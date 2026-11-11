/**
 * ثبت نوبت عمومی — POST /api/booking/create
 *
 * بدنهٔ JSON: { branchId, date, time, patientName, patientPhone }
 * اعتبارسنجی کامل در سمت سرور (lib/booking/service.ts) انجام می‌شود و
 * نوبت تنها با قید یکتای پایگاه‌داده (branch_id, starts_at_utc) تضمین
 * می‌گردد؛ درخواست موازی و تکراری همان ساعت خطای ۴۰۹ می‌دهد.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { after } from "next/server";
import { eq } from "drizzle-orm";
import {
  assertSameOrigin,
  bookingErrorResponse,
  clientIpKey,
  jsonError,
  RateLimiter,
  readJsonBody,
} from "@/lib/api/http";
import { getBookingDb } from "@/lib/booking/db";
import { appointments } from "@/lib/booking/schema";
import { createPublicBooking, type BookingInput } from "@/lib/booking/service";
import { sendAppointmentConfirmationSms } from "@/lib/booking/sms";

const createLimiter = new RateLimiter(8, 60_000);

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) {
    return jsonError(
      403,
      "origin_rejected",
      "درخواست از مبدأ دیگر مجاز نیست.",
    );
  }
  const nowUtcMs = Date.now();
  if (!createLimiter.hit(clientIpKey(request), nowUtcMs)) {
    return jsonError(
      429,
      "rate_limited",
      "درخواست‌های زیاد؛ لطفاً کمی بعد دوباره تلاش کنید.",
    );
  }

  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    return jsonError(400, "invalid_json", "دادهٔ ارسالی نامعتبر است.");
  }
  if (parsed.value === null || typeof parsed.value !== "object") {
    return jsonError(400, "invalid_json", "دادهٔ ارسالی نامعتبر است.");
  }
  const record = parsed.value as Record<string, unknown>;
  // سنجش نهایی بدنه کاملاً در سمت سرور انجام می‌شود؛ مقادیر ناشناخته
  // بدون اعتماد به service پاس داده می‌شوند و آنجا سخت‌گیرانه بررسی می‌گردند.
  const input: BookingInput = {
    branchId: record.branchId,
    date: record.date,
    time: record.time,
    patientName: record.patientName,
    patientPhone: record.patientPhone,
  };

  const db = getBookingDb();
  if (!db) return bookingErrorResponse("db_unavailable");

  const result = await createPublicBooking({ db, nowUtcMs }, input);
  if (!result.ok) return bookingErrorResponse(result.error);
  const booking = result.value;

  /*
   * پیامک تأیید ثبت — پس از فرستادن پاسخ (after)، بدون کندکردن و بدون
   * اثر بر نتیجهٔ رزرو: هر شکستِ ارسال فقط در گزارش سرور ثبت می‌شود و
   * ثبت نوبت معتبر باقی می‌ماند. فقط نوبت‌های عمومی پیامک تأیید
   * می‌گیرند (نوبتِ ثبت‌شدهٔ حضوری پذیرش، بی‌نیاز است).
   */
  after(async () => {
    try {
      const outcome = await sendAppointmentConfirmationSms({
        branchId: booking.branchId,
        date: booking.date,
        time: booking.time,
        patientName: booking.patientName,
        patientPhone: booking.patientPhone,
      });
      if (!outcome.ok) {
        console.error(
          `[booking] پیامک تأیید برای نوبت ${booking.id} ارسال نشد (${outcome.reason}).`,
        );
        return;
      }
      const markerDb = getBookingDb();
      if (!markerDb) return;
      await markerDb
        .update(appointments)
        .set({ confirmationSentAt: new Date() })
        .where(eq(appointments.id, booking.id));
    } catch (error) {
      console.error("[booking] پیامک تأیید ثبت ناموفق بود:", error);
    }
  });

  return NextResponse.json(
    { booking },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
