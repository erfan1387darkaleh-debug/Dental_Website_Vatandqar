/**
 * نمونه‌کارهای قبل و بعد — /api/gallery
 *
 *   GET ?treatment=<شناسهٔ خدمت اختیاری>  فهرست نمونه‌های «منتشرشده»
 *
 * پیش‌نویس‌ها هرگز از این مسیر بیرون نمی‌آیند. اعتبارسنجی فیلتر و
 * نگاشت ردیف‌ها در سمت سرور (lib/gallery/service.ts) انجام می‌شود.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  clientIpKey,
  galleryErrorResponse,
  jsonError,
  RateLimiter,
} from "@/lib/api/http";
import { getBookingDb } from "@/lib/booking/db";
import {
  listPublishedGalleryCases,
  type PublicGalleryCase,
} from "@/lib/gallery/service";

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

  const treatment = request.nextUrl.searchParams.get("treatment");

  const db = getBookingDb();
  if (!db) return galleryErrorResponse("db_unavailable");

  const result = await listPublishedGalleryCases({ db }, treatment);
  if (!result.ok) return galleryErrorResponse(result.error);

  // ردیف عمومی بدون پرچم انتشار است؛ نگاشت صریح (نه گسترش شیء)
  const cases: PublicGalleryCase[] = result.value.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    treatmentType: row.treatmentType,
    beforeImageUrl: row.beforeImageUrl,
    afterImageUrl: row.afterImageUrl,
    createdAt: row.createdAt,
  }));
  return NextResponse.json(
    { cases },
    {
      headers: {
        /* همان سیاست نظرات: کش کوتاه عمومی، بدون هیچ دادهٔ شخصی */
        "Cache-Control":
          "public, max-age=15, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
