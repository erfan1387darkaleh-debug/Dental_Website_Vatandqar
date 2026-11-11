/**
 * مدیریت نمونه‌کارهای قبل و بعد — /api/admin/gallery
 *
 *   GET    ?status=published|draft|all   فهرست نمونه‌ها (پیش‌فرض all)
 *   POST   {title, description?, treatmentType, beforeImageUrl, afterImageUrl, isPublished?}
 *   PATCH  ?id=<uuid>   {title?, description?, treatmentType?, beforeImageUrl?, afterImageUrl?, isPublished?}
 *   DELETE ?id=<uuid>   حذف نمونه
 *
 * هر چهار مسیر پیش از هر کاری توکن نشست پذیرش را سمت سرور سنجیده و
 * در صورت نبودن اعتبار، ۴۰۱ می‌دهند — همان قرارداد /api/admin/appointments.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  galleryErrorResponse,
  jsonError,
  readJsonBody,
} from "@/lib/api/http";
import { getBookingDb } from "@/lib/booking/db";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/booking/auth";
import {
  createGalleryCase,
  deleteGalleryCase,
  listGalleryCasesByStatus,
  updateGalleryCase,
  type GalleryInput,
  type GalleryPatch,
} from "@/lib/gallery/service";

function unauthorized(): NextResponse {
  return jsonError(
    401,
    "unauthorized",
    "برای دسترسی به این بخش باید وارد پنل پذیرش شوید.",
  );
}

export async function GET(request: NextRequest) {
  // اول احراز هویت؛ خواندن کوکی زمان‌محور است و باید پیش از هر
  // try/catch انجام شود.
  const admin = verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
    Date.now(),
  );
  if (!admin) return unauthorized();
  const status = request.nextUrl.searchParams.get("status") ?? "all";

  const db = getBookingDb();
  if (!db) return galleryErrorResponse("db_unavailable");

  const result = await listGalleryCasesByStatus({ db }, status);
  if (!result.ok) return galleryErrorResponse(result.error);
  return NextResponse.json(
    { cases: result.value },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) {
    return jsonError(403, "origin_rejected", "درخواست از مبدأ دیگر مجاز نیست.");
  }
  const admin = verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
    Date.now(),
  );
  if (!admin) return unauthorized();

  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    return jsonError(400, "invalid_json", "دادهٔ ارسالی نامعتبر است.");
  }
  if (parsed.value === null || typeof parsed.value !== "object") {
    return jsonError(400, "invalid_json", "دادهٔ ارسالی نامعتبر است.");
  }
  const record = parsed.value as Record<string, unknown>;
  // سنجش نهایی بدنه کاملاً در سمت سرور انجام می‌شود؛ مقادیر خام بدون
  // اعتماد به service پاس داده می‌شوند و آنجا سخت‌گیرانه بررسی می‌گردند.
  const input: GalleryInput = {
    title: record.title,
    description: record.description,
    treatmentType: record.treatmentType,
    beforeImageUrl: record.beforeImageUrl,
    afterImageUrl: record.afterImageUrl,
    isPublished: record.isPublished,
  };

  const db = getBookingDb();
  if (!db) return galleryErrorResponse("db_unavailable");

  const result = await createGalleryCase({ db }, input);
  if (!result.ok) return galleryErrorResponse(result.error);
  return NextResponse.json(
    { ok: true, id: result.value.id },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: NextRequest) {
  if (!assertSameOrigin(request)) {
    return jsonError(403, "origin_rejected", "درخواست از مبدأ دیگر مجاز نیست.");
  }
  const admin = verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
    Date.now(),
  );
  if (!admin) return unauthorized();

  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    return jsonError(400, "invalid_json", "دادهٔ ارسالی نامعتبر است.");
  }
  if (parsed.value === null || typeof parsed.value !== "object") {
    return jsonError(400, "invalid_json", "دادهٔ ارسالی نامعتبر است.");
  }
  const record = parsed.value as Record<string, unknown>;
  const patch: GalleryPatch = {
    title: record.title,
    description: record.description,
    treatmentType: record.treatmentType,
    beforeImageUrl: record.beforeImageUrl,
    afterImageUrl: record.afterImageUrl,
    isPublished: record.isPublished,
  };

  const id = request.nextUrl.searchParams.get("id") ?? "";

  const db = getBookingDb();
  if (!db) return galleryErrorResponse("db_unavailable");

  const result = await updateGalleryCase({ db }, id, patch);
  if (!result.ok) return galleryErrorResponse(result.error);
  return NextResponse.json(
    { ok: true, id: result.value.id },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: NextRequest) {
  if (!assertSameOrigin(request)) {
    return jsonError(403, "origin_rejected", "درخواست از مبدأ دیگر مجاز نیست.");
  }
  const admin = verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
    Date.now(),
  );
  if (!admin) return unauthorized();

  const id = request.nextUrl.searchParams.get("id") ?? "";

  const db = getBookingDb();
  if (!db) return galleryErrorResponse("db_unavailable");

  const result = await deleteGalleryCase({ db }, id);
  if (!result.ok) return galleryErrorResponse(result.error);
  return NextResponse.json(
    { ok: true, id: result.value.id },
    { headers: { "Cache-Control": "no-store" } },
  );
}
