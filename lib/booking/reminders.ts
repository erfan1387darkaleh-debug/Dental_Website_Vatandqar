/**
 * ────────────────────────────────────────────────────────────────
 *  کار یادآوری پیامکی نوبت‌ها — مستقل از Next (قابل تست روی PGlite)
 * ────────────────────────────────────────────────────────────────
 *  پنجرهٔ ارسال: هر نوبت «تأییدشده»ای که هنوز شروع نشده و تا پایان
 *  روزِ فردای تهران فاصله دارد و هنوز پیامک یادآوری نگرفته است.
 *  به این ترتیب اجرای روزانهٔ عصر، نوبت‌های فردا را پوشش می‌دهد و یک
 *  فراخوانی دستی صبح روز بعد، یادآوری همان‌روزِ جاافتاده را هم ممکن
 *  می‌کند؛ متن پیام تاریخ صریح دارد و هرگز «فردا» نمی‌گوید.
 *
 *  تضمین «حداکثر یک پیامک برای هر نوبت»: پیش از ارسال، ستون
 *  reminder_sent_at با یک UPDATE شرطی (فقط وقتی null است) «ادعا»
 *  می‌شود — atomic در پایگاه‌داده؛ دو اجرای هم‌زمان هرگز هر دو ارسال
 *  نمی‌کنند. اگر ارسال شکست بخورد، ادعا پس گرفته می‌شود تا اجرای بعدی
 *  دوباره تلاش کند (حداکثر یک‌بار در هر اجرا، بدون ارسال تکراری).
 * ────────────────────────────────────────────────────────────────
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { and, asc, eq, gt, isNull, lt } from "drizzle-orm";
import type { BookingDb } from "./db";
import { appointments } from "./schema";
import {
  addDays,
  tehranDateTimeParts,
  tehranDayStartUtcMs,
  todayTehranDate,
  type TehranDate,
  type TimeOfDay,
} from "./time";
import {
  sendAppointmentReminderSms,
  type SmsSendOutcome,
} from "./sms";

/** سقف ایمنی هر اجرا — حجم واقعی یک مطب روزانه چند ده نوبت است */
export const REMINDER_BATCH_LIMIT = 100;

/** تابع ارسال یادآوری (تزریق‌پذیر برای تست) */
export type ReminderSender = (appointment: {
  patientPhone: string;
  branchId: string;
  date: TehranDate;
  time: TimeOfDay;
}) => Promise<SmsSendOutcome>;

/** خلاصهٔ یک اجرا — بدون هیچ شمارهٔ تلفن یا اطلاعات شخصی */
export type ReminderSummary = {
  /** از این لحظه (ISO UTC) به بعد */
  windowFromUtc: string;
  /** تا پایان روز فردای تهران (ISO UTC) */
  windowUntilUtc: string;
  /** تعداد نوبت‌های درون پنجره و واجد شرایط */
  considered: number;
  /** پیامک موفق */
  sent: number;
  /** پیامک ناموفق (ادعا پس گرفته شده؛ اجرای بعدی دوباره تلاش می‌کند) */
  failed: number;
  /** نوبت‌هایی که در همین لحظه توسط اجرای هم‌زمان دیگری ادعا شده بودند */
  skipped: number;
  /** شناسهٔ نوبت‌های ناموفق — برای پیگیری پذیرش (بدون دادهٔ شخصی) */
  failedAppointmentIds: string[];
};

export type ReminderRunResult =
  | { ok: true; summary: ReminderSummary }
  | { ok: false; error: "db_error" };

/**
 * اجرای کامل کار یادآوری روی پایگاه‌دادهٔ داده‌شده.
 * زمان و تابع ارسال تزریق‌پذیرند تا روی PGlite با سرویس آزمایشی هم
 * قابل اجرا باشد.
 */
export async function runReminderJob(ctx: {
  db: BookingDb;
  /** «اکنون» به میلی‌ثانیه — پیش‌فرض زمان واقعی سیستم */
  nowUtcMs?: number;
  /** ارسال‌کننده — پیش‌فرض سرویس پیامک واقعی/پیکربندی‌شده */
  send?: ReminderSender;
}): Promise<ReminderRunResult> {
  const db = ctx.db;
  const nowUtcMs = ctx.nowUtcMs ?? Date.now();
  const send = ctx.send ?? sendAppointmentReminderSms;

  const today = todayTehranDate(nowUtcMs);
  const tomorrow = addDays(today, 1);
  const windowUntilUtcMs = tehranDayStartUtcMs(tomorrow) + 24 * 60 * 60 * 1000;

  let rows: Array<{
    id: string;
    branchId: string;
    startsAtUtc: Date;
    patientPhone: string;
  }>;
  try {
    rows = await db
      .select({
        id: appointments.id,
        branchId: appointments.branchId,
        startsAtUtc: appointments.startsAtUtc,
        patientPhone: appointments.patientPhone,
      })
      .from(appointments)
      .where(
        and(
          gt(appointments.startsAtUtc, new Date(nowUtcMs)),
          lt(appointments.startsAtUtc, new Date(windowUntilUtcMs)),
          eq(appointments.status, "confirmed"),
          isNull(appointments.reminderSentAt),
        ),
      )
      .orderBy(asc(appointments.startsAtUtc))
      .limit(REMINDER_BATCH_LIMIT);
  } catch (error) {
    console.error("[reminders] خواندن نوبت‌های پنجرهٔ یادآوری ناموفق بود:", error);
    return { ok: false, error: "db_error" };
  }

  const summary: ReminderSummary = {
    windowFromUtc: new Date(nowUtcMs).toISOString(),
    windowUntilUtc: new Date(windowUntilUtcMs).toISOString(),
    considered: rows.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    failedAppointmentIds: [],
  };

  for (const row of rows) {
    try {
      // گام ۱ — ادعای نوبت: فقط وقتی reminder_sent_at هنوز null است.
      // اگر اجرای هم‌زمان دیگری همین حالا ادعا کرده باشد، ردیف خالی برمی‌گردد.
      const claimed = await db
        .update(appointments)
        .set({ reminderSentAt: new Date(nowUtcMs) })
        .where(
          and(
            eq(appointments.id, row.id),
            isNull(appointments.reminderSentAt),
          ),
        )
        .returning({ id: appointments.id });
      if (claimed.length === 0) {
        summary.skipped += 1;
        continue;
      }

      // گام ۲ — ارسال پیامک (با تاریخ/ساعت تهرانِ خودِ نوبت)
      const parts = tehranDateTimeParts(row.startsAtUtc.getTime());
      const outcome = await send({
        patientPhone: row.patientPhone,
        branchId: row.branchId,
        date: parts.date,
        time: parts.time,
      });

      if (outcome.ok) {
        summary.sent += 1;
        continue;
      }

      // گام ۳ — شکست ارسال: ادعا پس گرفته می‌شود تا اجرای بعدی تلاش کند
      console.error(
        `[reminders] ارسال یادآوری نوبت ${row.id} ناموفق بود (${outcome.reason}).`,
      );
      await db
        .update(appointments)
        .set({ reminderSentAt: null })
        .where(eq(appointments.id, row.id));
      summary.failed += 1;
      summary.failedAppointmentIds.push(row.id);
    } catch (error) {
      console.error(
        `[reminders] خطای پردازش نوبت ${row.id}:`,
        error instanceof Error ? error.message : error,
      );
      summary.failed += 1;
      summary.failedAppointmentIds.push(row.id);
      // بازیابی ادعا در صورت خطای میانی — بهترین تلاش؛ خطای جدید نادیده
      try {
        await db
          .update(appointments)
          .set({ reminderSentAt: null })
          .where(eq(appointments.id, row.id));
      } catch {
        // اگر پس گرفتن هم شکست بخورد، نوبت «ادعاشده» می‌ماند و ارسال
        // مجدد نمی‌شود — رفتار امن در برابر ارسال تکراری.
      }
    }
  }

  console.log(
    `[reminders] خلاصهٔ اجرا: مجموع ${summary.considered}، موفق ${summary.sent}، ناموفق ${summary.failed}، ردشده ${summary.skipped}.`,
  );
  return { ok: true, summary };
}

/* ─────────────────────────── احراز فراخوان کرون ─────────────────────────── */

/**
 * صحت‌سنجی سرآیند «Authorization: Bearer <CRON_SECRET>» با مقایسهٔ
 * زمان‌ثابت روی خلاصهٔ SHA-256 (بی‌اعتنا به طول دو مقدار). بدون
 * CRON_SECRET تنظیم‌شده، هیچ فراخوانی پذیرفته نمی‌شود.
 */
export function isAuthorizedCronCall(
  authorizationHeader: string | null | undefined,
  configuredSecret: string | null | undefined,
): boolean {
  const secret = (configuredSecret ?? "").trim();
  if (secret === "") return false;
  const match = /^Bearer\s+(\S+)$/i.exec((authorizationHeader ?? "").trim());
  if (!match || !match[1]) return false;
  const providedDigest = createHash("sha256").update(match[1]).digest();
  const expectedDigest = createHash("sha256").update(secret).digest();
  return timingSafeEqual(providedDigest, expectedDigest);
}
