/**
 * ────────────────────────────────────────────────────────────────
 *  ابزارهای مشترک مسیرهای API نوبت‌دهی/پنل — فقط سمت سرور
 * ────────────────────────────────────────────────────────────────
 *  محافظت‌های پایهٔ همهٔ مسیرهای نوشتنی: بررسی «هم‌مبدأ بودن» (Origin)
 *  و سقف درخواست ساده (برای جلوگیری از اسپم فرم). احراز پذیرش در
 *  lib/booking/auth.ts و در هر مسیر پذیرش جداگانه اعمال می‌شود.
 * ────────────────────────────────────────────────────────────────
 */
import { NextResponse, type NextRequest } from "next/server";
import { BOOKING_ERROR_MESSAGES, type BookingErrorCode } from "@/lib/booking/service";
import {
  TESTIMONIAL_ERROR_MESSAGES,
  type TestimonialErrorCode,
} from "@/lib/testimonials/service";
import {
  GALLERY_ERROR_MESSAGES,
  type GalleryErrorCode,
} from "@/lib/gallery/service";

/** پاسخ خطای JSON با پیام فارسی */
export function jsonError(
  status: number,
  code: string,
  message: string,
): NextResponse {
  return NextResponse.json({ error: code, message }, { status });
}

/** نگاشت کد خطای نوبت‌دهی به وضعیت HTTP و پیام فارسی یکسان */
export function bookingErrorResponse(error: BookingErrorCode): NextResponse {
  const status =
    error === "slot_taken"
      ? 409
      : error === "not_found"
        ? 404
        : error === "db_unavailable" || error === "db_error"
          ? 503
          : 400;
  return jsonError(status, error, BOOKING_ERROR_MESSAGES[error]);
}

/** نگاشت کد خطای نظرات بیماران به وضعیت HTTP و پیام فارسی یکسان */
export function testimonialErrorResponse(
  error: TestimonialErrorCode,
): NextResponse {
  const status =
    error === "not_found"
      ? 404
      : error === "db_unavailable" || error === "db_error"
        ? 503
        : 400;
  return jsonError(status, error, TESTIMONIAL_ERROR_MESSAGES[error]);
}

/** نگاشت کد خطای نمونه‌کارهای قبل و بعد به وضعیت HTTP و پیام فارسی یکسان */
export function galleryErrorResponse(error: GalleryErrorCode): NextResponse {
  const status =
    error === "not_found"
      ? 404
      : error === "db_unavailable" || error === "db_error"
        ? 503
        : 400;
  return jsonError(status, error, GALLERY_ERROR_MESSAGES[error]);
}

/**
 * درخواست نوشتنی باید از همان مبدأ سایت آمده باشد (مرورگرهای مدرن
 * در همهٔ POST هم‌مبدأ سرآیند Origin را می‌فرستند). نبود Origin یا
 * ناهمخوانی دامنه رد می‌شود — لایهٔ کمکی ضد CSRF روی کوکی SameSite=Lax.
 */
export function assertSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const originHost = new URL(origin).host;
    return originHost === request.headers.get("host");
  } catch {
    return false;
  }
}

/** IP فراخواننده (اولین مقدار x-forwarded-for روی Vercel/پروکسی‌ها) */
export function clientIpKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

/** حداکثر حجم مجاز بدنهٔ JSON — همهٔ فرم‌های این سایت بسیار کوچک‌ترند */
export const MAX_JSON_BODY_BYTES = 16 * 1024;

/**
 * خواندن امن بدنهٔ JSON با سقف حجم — از خواندنِ بی‌کرانِ `request.json()`
 * (مسیر سادهٔ کمبود حافظه/DoS) جلوگیری می‌کند. «ok: false» یعنی بدنه
 * نبود، بزرگ‌تر از سقف بود یا JSON معتبر نبود؛ مسیرها همه را ۴۰۰ می‌دهند.
 */
export async function readJsonBody(
  request: NextRequest,
): Promise<{ ok: true; value: unknown } | { ok: false }> {
  // طول اعلام‌شده اگر همراه درخواست بیاید، پیش از خواندن بررسی می‌شود
  const declaredLength = Number(request.headers.get("content-length") ?? "");
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_JSON_BODY_BYTES
  ) {
    return { ok: false };
  }
  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false };
  }
  if (Buffer.byteLength(text, "utf8") > MAX_JSON_BODY_BYTES) {
    return { ok: false };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

/** سقف‌بانِ درخواست ساده در حافظه (برای هر نمونهٔ سرور؛ کافی برای فرم عمومی) */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    /** بیشینهٔ درخواست مجاز در پنجره */
    private readonly maxHits: number,
    /** طول پنجره به میلی‌ثانیه */
    private readonly windowMs: number,
  ) {}

  /** false یعنی درخواست از سقف پنجره گذشته و باید رد شود */
  hit(key: string, nowUtcMs: number): boolean {
    const now = nowUtcMs;
    const recent = (this.hits.get(key) ?? []).filter(
      (timestamp) => now - timestamp < this.windowMs,
    );
    if (recent.length >= this.maxHits) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    // پاک‌سازی دوره‌ای ساده برای جلوگیری از رشد بی‌رویهٔ حافظه
    if (this.hits.size > 5000) {
      for (const [entryKey, timestamps] of this.hits) {
        if (timestamps.every((timestamp) => now - timestamp >= this.windowMs)) {
          this.hits.delete(entryKey);
        }
      }
    }
    return true;
  }
}
