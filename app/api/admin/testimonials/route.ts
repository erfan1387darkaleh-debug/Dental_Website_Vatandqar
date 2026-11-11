/**
 * تعدیل نظرات بیماران — /api/admin/testimonials
 *
 *   GET    ?status=pending|approved|all   فهرست نظرات بر حسب وضعیت (پیش‌فرض pending)
 *   PATCH  ?id=<uuid>                     تأیید نظر (نمایش در سایت عمومی)
 *   DELETE ?id=<uuid>                     حذف نظر
 *
 * هر سه مسیر پیش از هر کاری توکن نشست پذیرش را سمت سرور سنجیده و در
 * صورت نبودن اعتبار، ۴۰۱ می‌دهند — همان قرارداد /api/admin/appointments.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  jsonError,
  testimonialErrorResponse,
} from "@/lib/api/http";
import { getBookingDb } from "@/lib/booking/db";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/booking/auth";
import {
  approveTestimonial,
  deleteTestimonial,
  listTestimonialsByStatus,
} from "@/lib/testimonials/service";

export async function GET(request: NextRequest) {
  // اول احراز هویت؛ خواندن کوکی زمان‌محور است و باید پیش از هر
  // try/catch انجام شود.
  const admin = verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
    Date.now(),
  );
  if (!admin) {
    return jsonError(
      401,
      "unauthorized",
      "برای دسترسی به این بخش باید وارد پنل پذیرش شوید.",
    );
  }
  const status = request.nextUrl.searchParams.get("status") ?? "pending";

  const db = getBookingDb();
  if (!db) return testimonialErrorResponse("db_unavailable");

  const result = await listTestimonialsByStatus({ db }, status);
  if (!result.ok) return testimonialErrorResponse(result.error);
  return NextResponse.json(
    { testimonials: result.value },
    { headers: { "Cache-Control": "no-store" } },
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
  if (!admin) {
    return jsonError(401, "unauthorized", "برای این عملیات باید وارد پنل شوید.");
  }
  const id = request.nextUrl.searchParams.get("id") ?? "";

  const db = getBookingDb();
  if (!db) return testimonialErrorResponse("db_unavailable");

  const result = await approveTestimonial({ db }, id);
  if (!result.ok) return testimonialErrorResponse(result.error);
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
  if (!admin) {
    return jsonError(401, "unauthorized", "برای این عملیات باید وارد پنل شوید.");
  }
  const id = request.nextUrl.searchParams.get("id") ?? "";

  const db = getBookingDb();
  if (!db) return testimonialErrorResponse("db_unavailable");

  const result = await deleteTestimonial({ db }, id);
  if (!result.ok) return testimonialErrorResponse(result.error);
  return NextResponse.json(
    { ok: true, id: result.value.id },
    { headers: { "Cache-Control": "no-store" } },
  );
}
