/**
 * خروج از پنل پذیرش — POST /api/admin/logout
 * کوکی نشست پاک می‌شود؛ بدون بررسی مجوز (خروج همیشه مجاز است).
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { assertSameOrigin, jsonError } from "@/lib/api/http";
import { SESSION_COOKIE_NAME } from "@/lib/booking/auth";

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) {
    return jsonError(403, "origin_rejected", "درخواست از مبدأ دیگر مجاز نیست.");
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
