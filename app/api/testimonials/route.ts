/**
 * نظرات بیماران — /api/testimonials
 *
 *   GET                     فهرست نظرات «تأییدشده» برای نمایش عمومی (تازه‌ترین اول)
 *   POST {patientName, comment, rating, treatmentType}  ثبت نظر تازه
 *
 * نظر تازه همیشه «تأییدنشده» ثبت می‌شود و تنها پس از تأیید پذیرش
 * (مسیر /api/admin/testimonials) در همین GET نمایش داده می‌شود. اعتبارسنجی
 * کامل در سمت سرور (lib/testimonials/service.ts) انجام می‌شود و پاسخ‌ها
 * همیشه «بدون ذخیره» هستند.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  clientIpKey,
  jsonError,
  RateLimiter,
  readJsonBody,
  testimonialErrorResponse,
} from "@/lib/api/http";
import { getBookingDb } from "@/lib/booking/db";
import {
  listApprovedTestimonials,
  submitTestimonial,
  type TestimonialInput,
} from "@/lib/testimonials/service";

/** سقف ثبت نظر: ۳ نظر در هر ۱۰ دقیقه از هر IP — کافی برای فرم واقعی، ضد اسپم */
const submitLimiter = new RateLimiter(3, 10 * 60_000);
/** سقف خواندن عمومی: ۶۰ درخواست در دقیقه از هر IP — محافظت از پایگاه‌داده */
const readLimiter = new RateLimiter(60, 60_000);

export async function GET(request: NextRequest) {
  // مبدأ ناهمخوان رد می‌شود؛ نبود Origin (باز کردن مستقیم آدرس) مجاز است.
  if (request.headers.get("origin") !== null && !assertSameOrigin(request)) {
    return jsonError(403, "origin_rejected", "درخواست از مبدأ دیگر مجاز نیست.");
  }
  if (!readLimiter.hit(clientIpKey(request), Date.now())) {
    return jsonError(
      429,
      "rate_limited",
      "درخواست‌های زیاد؛ لطفاً کمی بعد دوباره تلاش کنید.",
    );
  }

  const db = getBookingDb();
  if (!db) return testimonialErrorResponse("db_unavailable");

  const result = await listApprovedTestimonials({ db });
  if (!result.ok) return testimonialErrorResponse(result.error);
  return NextResponse.json(
    { testimonials: result.value },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) {
    return jsonError(403, "origin_rejected", "درخواست از مبدأ دیگر مجاز نیست.");
  }
  if (!submitLimiter.hit(clientIpKey(request), Date.now())) {
    return jsonError(
      429,
      "rate_limited",
      "ثبت نظرهای زیاد؛ لطفاً کمی بعد دوباره تلاش کنید.",
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
  const input: TestimonialInput = {
    patientName: record.patientName,
    comment: record.comment,
    rating: record.rating,
    treatmentType: record.treatmentType,
  };

  const db = getBookingDb();
  if (!db) return testimonialErrorResponse("db_unavailable");

  const result = await submitTestimonial({ db }, input);
  if (!result.ok) return testimonialErrorResponse(result.error);
  return NextResponse.json(
    {
      ok: true,
      message: "سپاسگزاریم! نظر شما ثبت شد و پس از بررسی و تأیید نمایش داده می‌شود.",
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
