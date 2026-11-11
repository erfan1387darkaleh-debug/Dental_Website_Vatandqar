/**
 * موجودی نوبت‌های خالی — GET /api/booking/availability
 *
 * پارامترها:
 *   branch  — شناسهٔ شعبه (hediye-yousef | vatandar)
 *   date    — تاریخ تقویمی تهران "yyyy-mm-dd" (اختیاری؛ پیش‌فرض امروز)
 *   days    — تعداد روز موردنظر از آن نقطه (۱ تا ۳۱؛ پیش‌فرض ۱)
 *
 * پاسخ همیشه «بدون ذخیره» (no-store) است تا نوبت ثبت‌شدهٔ لحظاتی
 * پیش بلافاصله برای همهٔ بازدیدها «رزرو شده» نمایش داده شود.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  bookingErrorResponse,
  clientIpKey,
  jsonError,
  RateLimiter,
} from "@/lib/api/http";
import { getBookingDb } from "@/lib/booking/db";
import { getAvailabilityForDays } from "@/lib/booking/service";
import { getBookingBranch } from "@/lib/booking/slots";
import { addDays, diffInDays, isValidTehranDate, todayTehranDate } from "@/lib/booking/time";
import { BOOKING } from "@/lib/site-config";

const availabilityLimiter = new RateLimiter(60, 60_000);

export async function GET(request: NextRequest) {
  // پارامترها پیش از هر try/catch خوانده می‌شوند؛ همین خواندنِ
  // زمان‌محور، رندر مسیر را دینامیک (غیرقابل پیش‌رندر) می‌کند.
  const params = request.nextUrl.searchParams;
  const branchId = params.get("branch") ?? "";
  const rawDate = params.get("date") ?? "";
  const rawDays = params.get("days") ?? "1";

  // مبدأ ناهمخوان رد می‌شود؛ نبود Origin (مثل باز کردن مستقیم آدرس
  // در مرورگر) برای این مسیر فقط‌خواندنی مجاز است.
  if (request.headers.get("origin") !== null && !assertSameOrigin(request)) {
    return jsonError(403, "origin_rejected", "درخواست از مبدأ دیگر مجاز نیست.");
  }

  const nowUtcMs = Date.now();
  if (!availabilityLimiter.hit(clientIpKey(request), nowUtcMs)) {
    return jsonError(
      429,
      "rate_limited",
      "درخواست‌های زیاد؛ لطفاً کمی بعد دوباره تلاش کنید.",
    );
  }

  if (!getBookingBranch(branchId)) {
    return bookingErrorResponse("invalid_branch");
  }

  const today = todayTehranDate(nowUtcMs);
  let startDate = today;
  if (rawDate !== "") {
    if (!isValidTehranDate(rawDate)) return bookingErrorResponse("invalid_date");
    startDate = rawDate;
  }
  if (diffInDays(today, startDate) > BOOKING.horizonDays) {
    return bookingErrorResponse("horizon");
  }
  const count = Math.min(Math.max(Number(rawDays) || 1, 1), 31);
  const dates = Array.from({ length: count }, (_, index) =>
    addDays(startDate, index),
  );

  const db = getBookingDb();
  if (!db) return bookingErrorResponse("db_unavailable");

  const result = await getAvailabilityForDays(
    { db, nowUtcMs },
    branchId,
    dates,
  );
  if (!result.ok) return bookingErrorResponse(result.error);
  return NextResponse.json(
    { days: result.value },
    { headers: { "Cache-Control": "no-store" } },
  );
}
