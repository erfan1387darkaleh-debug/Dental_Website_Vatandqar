/**
 * ────────────────────────────────────────────────────────────────
 *  منطق نوبت‌دهی (خدمات دامنه) — مستقل از Next
 * ────────────────────────────────────────────────────────────────
 *  توابع این فایل نمونهٔ Drizzle را به‌عنوان پارامتر می‌گیرند؛ در
 *  عملیات واقعی Neon است و در تست‌های محلی PGlite (شبیه‌ساز واقعی
 *  Postgres). همهٔ قواعد حمایتی اینجا و صرفاً در سمت سرور اجرا می‌شوند:
 *    - نوبت فقط روی شبکهٔ ۱۰ دقیقه‌ایِ ساعات کاری همان شعبه (از BRANCHES)
 *    - روز تعطیل (جمعه) هرگز پذیرفته نمی‌شود
 *    - نوبت عمومی: حداکثر ۶۰ روز آینده، دست‌کم ۳۰ دقیقه تا شروع
 *    - نوبت دستی پذیرش: بدون محدودیت گذشته/افق
 *    - تداخل: قرارداد یکتایی پایگاه‌داده (branch_id, starts_at_utc)
 * ────────────────────────────────────────────────────────────────
 */
import { and, eq, gte, lt } from "drizzle-orm";
import { BOOKING } from "../site-config";
import {
  diffInDays,
  isValidTehranDate,
  isValidTimeOfDay,
  tehranDateTimeToUtcMs,
  tehranDateTimeParts,
  tehranDayStartUtcMs,
  todayTehranDate,
  type TehranDate,
  type TimeOfDay,
} from "./time";
import { getBookingBranch, isBranchOpenOnDate, slotInstantUtcMs, slotTimesForBranchDate } from "./slots";
import { normalizeIranMobile } from "./phone";
import { appointments } from "./schema";
import type { BookingDb } from "./db";

/** کدهای خطای نوبت‌دهی — پیام فارسی هر کد در BOOKING_ERROR_MESSAGES */
export type BookingErrorCode =
  | "db_unavailable"
  | "db_error"
  | "invalid_branch"
  | "invalid_date"
  | "invalid_time"
  | "closed_day"
  | "lead_time"
  | "horizon"
  | "invalid_name"
  | "invalid_phone"
  | "slot_taken"
  | "not_found";

/** پیام فارسی هر کد — منبع یکتای متن خطاها برای صفحهٔ عمومی و پنل پذیرش */
export const BOOKING_ERROR_MESSAGES: Record<BookingErrorCode, string> = {
  db_unavailable:
    "سامانهٔ نوبت‌دهی هنوز تنظیم نشده است؛ متغیر DATABASE_URL در تنظیمات سرور تعریف نشده.",
  db_error: "اتصال به پایگاه‌داده برقرار نشد؛ لطفاً دوباره تلاش کنید.",
  invalid_branch: "شعبهٔ انتخابی معتبر نیست.",
  invalid_date: "تاریخ انتخابی معتبر نیست.",
  invalid_time: "ساعت انتخابی جزو نوبت‌های این شعبه نیست.",
  closed_day: "شعبه در روز جمعه تعطیل است.",
  lead_time:
    "برای رزرو آنلاین، دست‌کم ۳۰ دقیقه تا شروع نوبت فاصله لازم است؛ برای نوبت‌های فوری با شعبه تماس بگیرید.",
  horizon:
    "رزرو آنلاین حداکثر تا ۶۰ روز آینده ممکن است؛ برای تاریخ‌های دورتر با شعبه تماس بگیرید.",
  invalid_name: "لطفاً نام و نام خانوادگی معتبر وارد کنید.",
  invalid_phone:
    "شمارهٔ موبایل معتبر نیست؛ قالب درست: ۰۹۱۲۱۲۳۴۵۶۷",
  slot_taken:
    "این نوبت خالی هم‌اکنون ثبت شد؛ لطفاً ساعت دیگری انتخاب کنید.",
  not_found: "نوبت موردنظر یافت نشد یا حذف شده است.",
};

type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: BookingErrorCode };

/** ورودی ساخت نوبت — از بدنهٔ درخواست/فرم (پس از خواندن JSON خام) */
export type BookingInput = {
  branchId: unknown;
  date: unknown;
  time: unknown;
  patientName: unknown;
  patientPhone: unknown;
};

/** نوبت ثبت‌شده — پاسخ برای رابط کاربری */
export type CreatedBooking = {
  id: string;
  branchId: string;
  /** تاریخ تقویمی تهران "yyyy-mm-dd" */
  date: TehranDate;
  /** ساعت شروع "HH:mm" */
  time: TimeOfDay;
  /** همان لحظهٔ UTC ذخیره‌شده در پایگاه‌داده (ISO) */
  startsAtUtc: string;
  patientName: string;
  patientPhone: string;
  source: "public" | "staff";
};

/** ردیف پنل پذیرش */
export type AppointmentRow = {
  id: string;
  branchId: string;
  date: TehranDate;
  time: TimeOfDay;
  startsAtUtc: string;
  patientName: string;
  patientPhone: string;
  source: "public" | "staff";
  createdBy: string | null;
};

type DbContext = { db: BookingDb; nowUtcMs: number };

/* ─────────────────────────── اعتبارسنجی مشترک ─────────────────────────── */

function invalid(error: BookingErrorCode): ServiceResult<never> {
  return { ok: false, error };
}

/**
 * نام سنجیده و پاک‌سازی‌شده: ۲ تا ۶۰ نویسه؛ فقط فاصله‌های بی‌معنی جمع
 * می‌شوند و نیم‌فاصلهٔ نام‌ها (مثل هاشمی‌زاد) دست‌نخورده می‌ماند.
 */
function sanitizedPatientName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.replace(/[ \t]+/g, " ").trim();
  if (trimmed.length < 2 || trimmed.length > 60) return null;
  // نویسه‌های کنترلی به‌کلی نامعتبرند
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return null;
  return trimmed;
}

/** شمارهٔ موبایل نرمال‌شده در قالب 09xxxxxxxxx یا خطای قالب */
function normalizedPatientPhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const result = normalizeIranMobile(raw);
  return result.ok ? result.phone : null;
}

type ScheduleCheck =
  | { ok: true; date: TehranDate; time: TimeOfDay; startsAtUtcMs: number }
  | { ok: false; error: BookingErrorCode };

/**
 * هم‌راستایی نوبت با ساعات کاری شعبه — منبع حقیقت: BRANCHES.
 * نوبت باید دقیقاً یکی از ساعت‌های شبکهٔ همین شعبه در همان روز باشد.
 */
function checkSchedule(
  branchId: string,
  rawDate: unknown,
  rawTime: unknown,
): ScheduleCheck {
  if (!getBookingBranch(branchId)) {
    return { ok: false, error: "invalid_branch" };
  }
  if (typeof rawDate !== "string" || !isValidTehranDate(rawDate)) {
    return { ok: false, error: "invalid_date" };
  }
  if (typeof rawTime !== "string" || !isValidTimeOfDay(rawTime)) {
    return { ok: false, error: "invalid_time" };
  }
  const startsAtUtcMs = slotInstantUtcMs(branchId, rawDate, rawTime);
  if (startsAtUtcMs === null) {
    return {
      ok: false,
      error: isBranchOpenOnDate(branchId, rawDate) ? "invalid_time" : "closed_day",
    };
  }
  return { ok: true, date: rawDate, time: rawTime, startsAtUtcMs };
}

/** تشخیص خطای یکتایی پایگاه‌داده (کد Postgres 23505) — یعنی همین نوبت لحظاتی پیش رزرو شده است */
function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 6 && current && typeof current === "object"; depth += 1) {
    const candidate = current as { code?: unknown; message?: unknown; cause?: unknown };
    if (candidate.code === "23505") return true;
    if (
      typeof candidate.message === "string" &&
      candidate.message.includes("duplicate key value violates unique constraint")
    ) {
      return true;
    }
    current = candidate.cause;
  }
  return false;
}

async function insertAppointment(
  db: BookingDb,
  params: {
    branchId: string;
    date: TehranDate;
    time: TimeOfDay;
    startsAtUtcMs: number;
    patientName: string;
    patientPhone: string;
    source: "public" | "staff";
    createdBy: string | null;
  },
): Promise<ServiceResult<CreatedBooking>> {
  try {
    const inserted = await db
      .insert(appointments)
      .values({
        branchId: params.branchId,
        startsAtUtc: new Date(params.startsAtUtcMs),
        durationMinutes: BOOKING.slotMinutes,
        patientName: params.patientName,
        patientPhone: params.patientPhone,
        source: params.source,
        createdBy: params.createdBy,
      })
      .returning({ id: appointments.id });
    const row = inserted[0];
    if (!row) return invalid("db_error");
    return {
      ok: true,
      value: {
        id: row.id,
        branchId: params.branchId,
        date: params.date,
        time: params.time,
        startsAtUtc: new Date(params.startsAtUtcMs).toISOString(),
        patientName: params.patientName,
        patientPhone: params.patientPhone,
        source: params.source,
      },
    };
  } catch (error) {
    if (isUniqueViolation(error)) return invalid("slot_taken");
    console.error("[booking] درج نوبت ناموفق بود:", error);
    return invalid("db_error");
  }
}

/* ─────────────────────────── نوبت عمومی (مراجع) ─────────────────────────── */

/**
 * ثبت نوبت آنلاین مراجع — با همهٔ قواعد رزرو عمومی.
 * در درخواست هم‌زمان چند کاربر برای یک ساعت، قید یکتای پایگاه‌داده
 * جلوی ثبت دوباره را می‌گیرد و خطای «slot_taken» برمی‌گردد.
 */
export async function createPublicBooking(
  ctx: DbContext,
  input: BookingInput,
): Promise<ServiceResult<CreatedBooking>> {
  const { db, nowUtcMs } = ctx;

  const schedule = checkSchedule(String(input.branchId), input.date, input.time);
  if (!schedule.ok) return invalid(schedule.error);

  // قواعد افق و فاصلهٔ کمینه فقط برای رزرو عمومی
  const today = todayTehranDate(nowUtcMs);
  if (diffInDays(today, schedule.date) > BOOKING.horizonDays) {
    return invalid("horizon");
  }
  const leadMs = BOOKING.leadMinutes * 60_000;
  if (schedule.startsAtUtcMs - nowUtcMs < leadMs) {
    return invalid("lead_time");
  }

  const patientName = sanitizedPatientName(input.patientName);
  if (!patientName) return invalid("invalid_name");
  const patientPhone = normalizedPatientPhone(input.patientPhone);
  if (!patientPhone) return invalid("invalid_phone");

  return insertAppointment(db, {
    branchId: String(input.branchId),
    date: schedule.date,
    time: schedule.time,
    startsAtUtcMs: schedule.startsAtUtcMs,
    patientName,
    patientPhone,
    source: "public",
    createdBy: null,
  });
}

/* ─────────────────────────── نوبت دستی پذیرش ─────────────────────────── */

/**
 * ثبت دستی نوبت توسط پذیرش (فراخوانی تلفنی و…) — بدون قید افق/فاصله؛
 * ثبت نوبت‌های گذشته برای مستندسازی تماس‌ها مجاز است.
 */
export async function createStaffBooking(
  ctx: Pick<DbContext, "db">,
  actor: string,
  input: BookingInput,
): Promise<ServiceResult<CreatedBooking>> {
  const schedule = checkSchedule(String(input.branchId), input.date, input.time);
  if (!schedule.ok) return invalid(schedule.error);

  const patientName = sanitizedPatientName(input.patientName);
  if (!patientName) return invalid("invalid_name");
  const patientPhone = normalizedPatientPhone(input.patientPhone);
  if (!patientPhone) return invalid("invalid_phone");

  return insertAppointment(ctx.db, {
    branchId: String(input.branchId),
    date: schedule.date,
    time: schedule.time,
    startsAtUtcMs: schedule.startsAtUtcMs,
    patientName,
    patientPhone,
    source: "staff",
    createdBy: actor,
  });
}

/* ─────────────────────────── موجودی ساعات ─────────────────────────── */

export type SlotStatus = "open" | "booked" | "past";

export type AvailableSlot = {
  time: TimeOfDay;
  /** همان لحظهٔ UTC نوبت (ISO) */
  startsAtUtc: string;
  status: SlotStatus;
};

export type AvailabilityDay = {
  date: TehranDate;
  /** روز تعطیل (جمعه) — فاقد نوبت */
  closed: boolean;
  slots: AvailableSlot[];
};

/** قید فاصلهٔ کمینه: نوبت عمومی دست‌کم ۳۰ دقیقه پس از «الان» باشد */
function isSlotPastForPublic(startsAtUtcMs: number, nowUtcMs: number): boolean {
  return startsAtUtcMs - nowUtcMs < BOOKING.leadMinutes * 60_000;
}

/**
 * موجودی ساعات برای روزهای خواستهٔ مراجع — هر بار خوانده می‌شود (بدون cache)
 * تا نوبت ثبت‌شدهٔ لحظه‌ای هم بلافاصله برای همه «رزرو شده» نمایش دهد.
 */
export async function getAvailabilityForDays(
  ctx: DbContext,
  branchId: string,
  dates: TehranDate[],
): Promise<ServiceResult<AvailabilityDay[]>> {
  const { db, nowUtcMs } = ctx;
  if (dates.length === 0) return { ok: true, value: [] };
  if (!getBookingBranch(branchId)) return invalid("invalid_branch");
  for (const date of dates) {
    if (!isValidTehranDate(date)) return invalid("invalid_date");
  }

  const days: AvailabilityDay[] = [];
  try {
    const earliestDate = dates.reduce((min, cur) => (cur < min ? cur : min));
    const latestDate = dates.reduce((max, cur) => (cur > max ? cur : max));
    const rangeStart = tehranDayStartUtcMs(earliestDate);
    const rangeEnd = tehranDayStartUtcMs(latestDate) + 24 * 60 * 60 * 1000;

    // نوبت‌های ثبت‌شدهٔ کل بازه — یک پرس‌وجو برای همهٔ روزها
    const bookedRows = await db
      .select({ startsAtUtc: appointments.startsAtUtc })
      .from(appointments)
      .where(
        and(
          eq(appointments.branchId, branchId),
          gte(appointments.startsAtUtc, new Date(rangeStart)),
          lt(appointments.startsAtUtc, new Date(rangeEnd)),
        ),
      );
    const bookedMs = new Set(
      bookedRows.map((row) => row.startsAtUtc.getTime()),
    );

    for (const date of dates) {
      const daySlots = slotTimesForBranchDate(branchId, date);
      // روز نوبت‌دار نیست (بازهٔ خالی در ساعات کاری) → تعطیلی کامل
      if (daySlots.length === 0) {
        days.push({ date, closed: true, slots: [] });
        continue;
      }
      const slots: AvailableSlot[] = daySlots.map((time) => {
        const startsAtUtcMs = tehranDateTimeToUtcMs(date, time);
        const startsAtUtc = new Date(startsAtUtcMs).toISOString();
        if (bookedMs.has(startsAtUtcMs)) {
          return { time, startsAtUtc, status: "booked" as SlotStatus };
        }
        if (isSlotPastForPublic(startsAtUtcMs, nowUtcMs)) {
          return { time, startsAtUtc, status: "past" as SlotStatus };
        }
        return { time, startsAtUtc, status: "open" as SlotStatus };
      });
      days.push({ date, closed: false, slots });
    }
  } catch (error) {
    console.error("[booking] خواندن موجودی ناموفق بود:", error);
    return invalid("db_error");
  }
  return { ok: true, value: days };
}

/* ─────────────────────────── پنل پذیرش ─────────────────────────── */

/** بازهٔ یک روز برای مرز پرس‌وجوها */
function dayRange(date: TehranDate): { startMs: number; endMs: number } {
  const startMs = tehranDayStartUtcMs(date);
  return { startMs, endMs: startMs + 24 * 60 * 60 * 1000 };
}

/** فهرست نوبت‌های یک شعبه در یک روز (مرتب بر حسب ساعت) */
export async function listDayAppointments(
  ctx: Pick<DbContext, "db">,
  branchId: string,
  date: TehranDate,
): Promise<ServiceResult<AppointmentRow[]>> {
  if (!isValidTehranDate(date)) return invalid("invalid_date");
  const db = ctx.db;
  const { startMs, endMs } = dayRange(date);
  try {
    const rows = await db
      .select({
        id: appointments.id,
        branchId: appointments.branchId,
        startsAtUtc: appointments.startsAtUtc,
        patientName: appointments.patientName,
        patientPhone: appointments.patientPhone,
        source: appointments.source,
        createdBy: appointments.createdBy,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.branchId, branchId),
          gte(appointments.startsAtUtc, new Date(startMs)),
          lt(appointments.startsAtUtc, new Date(endMs)),
        ),
      );
    const mapped: AppointmentRow[] = rows
      .map((row) => {
        const tehranParts = tehranDateTimeParts(row.startsAtUtc.getTime());
        return {
          id: row.id,
          branchId: row.branchId,
          date: tehranParts.date,
          time: tehranParts.time,
          startsAtUtc: row.startsAtUtc.toISOString(),
          patientName: row.patientName,
          patientPhone: row.patientPhone,
          source: row.source as "public" | "staff",
          createdBy: row.createdBy,
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));
    return { ok: true, value: mapped };
  } catch (error) {
    console.error("[booking] خواندن نوبت‌های روز ناموفق بود:", error);
    return invalid("db_error");
  }
}

/** حذف نوبت — تنها مسیر مجاز حذف، و فقط پس از احراز پذیرش در مسیر API */
export async function deleteAppointment(
  ctx: Pick<DbContext, "db">,
  id: unknown,
): Promise<ServiceResult<{ id: string }>> {
  if (typeof id !== "string" || id === "") return invalid("not_found");
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_PATTERN.test(id)) return invalid("not_found");
  try {
    const removed = await ctx.db
      .delete(appointments)
      .where(eq(appointments.id, id))
      .returning({ id: appointments.id });
    if (removed.length === 0) return invalid("not_found");
    return { ok: true, value: { id: removed[0].id } };
  } catch (error) {
    console.error("[booking] حذف نوبت ناموفق بود:", error);
    return invalid("db_error");
  }
}
