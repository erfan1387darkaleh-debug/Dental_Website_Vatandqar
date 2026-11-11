/**
 * یادآوری پیامکی نوبت‌ها — GET|POST /api/booking/reminders
 *
 * مسیر «آمادهٔ کرون»: مخصوص فراخوانی زمان‌بندی‌شده (Vercel Cron — متد
 * GET با سرآیند Authorization: Bearer <CRON_SECRET>) یا اجرای دستی
 * مدیر (POST با همان سرآیند). فراخوان عمومی/بی‌کلید با ۴۰۱ و پایگاه‌-
 * دادهٔ تنظیم‌نشده با ۵۰۳ پاسخ می‌دهد؛ پاسخ فقط شمار است و هرگز شمارهٔ
 * تلفن یا متن پیامک در آن نیست.
 *
 * «connection()» پیش از هر چیز: این مسیر هیچ پارامتر/کوکی‌ای نمی‌خواند
 * و باید همیشه در زمان واقعی درخواست اجرا شود — نه پیش‌رندر و نه کش
 * (پیش‌نیاز cacheComponents این نسخه).
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { connection } from "next/server";
import { bookingErrorResponse, jsonError } from "@/lib/api/http";
import { getBookingDb } from "@/lib/booking/db";
import { isAuthorizedCronCall, runReminderJob } from "@/lib/booking/reminders";

/** بیشینهٔ زمان اجرا روی سکوهای serverless (ارسال پله‌ای پیامک‌ها) */
export const maxDuration = 60;

async function handleReminderRequest(request: NextRequest): Promise<NextResponse> {
  await connection();

  // اول احراز — فراخوان بی‌کلید حتی نباید بفهمد پایگاه‌داده تنظیم است یا نه
  if (!isAuthorizedCronCall(
    request.headers.get("authorization"),
    process.env.CRON_SECRET,
  )) {
    return jsonError(
      401,
      "unauthorized",
      "فراخوانی یادآوری نیازمند سرآیند Authorization: Bearer با CRON_SECRET است.",
    );
  }

  const db = getBookingDb();
  if (!db) return bookingErrorResponse("db_unavailable");

  const result = await runReminderJob({ db });
  if (!result.ok) return bookingErrorResponse(result.error);
  return NextResponse.json(
    { ok: true, reminders: result.summary },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(request: NextRequest) {
  return handleReminderRequest(request);
}

export async function POST(request: NextRequest) {
  return handleReminderRequest(request);
}
