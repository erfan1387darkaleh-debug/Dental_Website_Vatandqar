/**
 * نوبت‌های پنل پذیرش — /api/admin/appointments
 *
 *   GET    ?branch=&date=     فهرست نوبت‌های یک شعبه در یک روز
 *   POST   {branchId,date,time,patientName,patientPhone}  ثبت دستی نوبت (به نام پذیرش)
 *   DELETE ?id=<uuid>         حذف نوبت
 *
 * هر سه مسیر پیش از هر کاری توکن نشست پذیرش را سمت سرور سنجیده و در
 * صورت نبودن اعتبار، ۴۰۱ می‌دهند — مجوز از رابط کاربری و از مسیرهای
 * عمومی (/api/booking/*) به‌هیچ‌شکل قابل دورزدن نیست.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  bookingErrorResponse,
  jsonError,
  readJsonBody,
} from "@/lib/api/http";
import { getBookingDb } from "@/lib/booking/db";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/booking/auth";
import { getBookingBranch } from "@/lib/booking/slots";
import {
  createStaffBooking,
  deleteAppointment,
  listDayAppointments,
  type BookingInput,
} from "@/lib/booking/service";
import { isValidTehranDate } from "@/lib/booking/time";

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
  const params = request.nextUrl.searchParams;
  const branchId = params.get("branch") ?? "";
  const date = params.get("date") ?? "";
  if (!isValidTehranDate(date) || !getBookingBranch(branchId)) {
    return bookingErrorResponse(
      isValidTehranDate(date) ? "invalid_branch" : "invalid_date",
    );
  }

  const db = getBookingDb();
  if (!db) return bookingErrorResponse("db_unavailable");

  const result = await listDayAppointments({ db }, branchId, date);
  if (!result.ok) return bookingErrorResponse(result.error);
  return NextResponse.json(
    { appointments: result.value },
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
  if (!admin) {
    return jsonError(401, "unauthorized", "برای این عملیات باید وارد پنل شوید.");
  }

  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    return jsonError(400, "invalid_json", "دادهٔ ارسالی نامعتبر است.");
  }
  if (parsed.value === null || typeof parsed.value !== "object") {
    return jsonError(400, "invalid_json", "دادهٔ ارسالی نامعتبر است.");
  }
  const record = parsed.value as Record<string, unknown>;
  const input: BookingInput = {
    branchId: record.branchId,
    date: record.date,
    time: record.time,
    patientName: record.patientName,
    patientPhone: record.patientPhone,
  };

  const db = getBookingDb();
  if (!db) return bookingErrorResponse("db_unavailable");

  const result = await createStaffBooking({ db }, admin.username, input);
  if (!result.ok) return bookingErrorResponse(result.error);
  return NextResponse.json(
    { appointment: result.value },
    { status: 201, headers: { "Cache-Control": "no-store" } },
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
  if (!db) return bookingErrorResponse("db_unavailable");

  const result = await deleteAppointment({ db }, id);
  if (!result.ok) return bookingErrorResponse(result.error);
  return NextResponse.json(
    { ok: true, id: result.value.id },
    { headers: { "Cache-Control": "no-store" } },
  );
}
