/**
 * ورود پنل پذیرش — POST /api/admin/login
 *
 * حساب پذیرش فقط از متغیرهای محیطی می‌آید (getAdminAccount) و هیچ
 * مقدار پیش‌فرض/جایگزینی برای گذرواژه وجود ندارد: اگر ADMIN_PASSWORD_HASH
 * تنظیم نشده باشد ورود «بسته» می‌شود (۵۰۳). محدودسازی تلاش ناموفق در
 * lib/booking/auth.ts (۵ خطا در ۱۰ دقیقه) + سقف کل درخواست این مسیر.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  clientIpKey,
  jsonError,
  RateLimiter,
  readJsonBody,
} from "@/lib/api/http";
import {
  createSessionToken,
  getAdminAccount,
  isLoginThrottled,
  recordLoginFailure,
  resetLoginFailures,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  verifyAdminPassword,
} from "@/lib/booking/auth";

/** سقف کل درخواست‌های ورود از هر IP — فارغ از درست/نادرست بودن */
const loginRequestLimiter = new RateLimiter(10, 60_000);

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) {
    return jsonError(
      403,
      "origin_rejected",
      "درخواست از مبدأ دیگر مجاز نیست.",
    );
  }

  const nowUtcMs = Date.now();
  const ipKey = clientIpKey(request);
  if (!loginRequestLimiter.hit(ipKey, nowUtcMs)) {
    return jsonError(
      429,
      "rate_limited",
      "درخواست‌های زیاد؛ لطفاً کمی بعد دوباره تلاش کنید.",
    );
  }
  const identityKey = `${ipKey}:login`;
  if (isLoginThrottled(identityKey, nowUtcMs)) {
    return jsonError(
      429,
      "rate_limited",
      "تعداد تلاش‌های ورود زیاد است؛ ۱۰ دقیقه بعد دوباره تلاش کنید.",
    );
  }

  // حساب پذیرش فقط از env — بدون هیچ مقدار جایگزین (شکست صریح)
  const admin = getAdminAccount();
  if (!admin) {
    return jsonError(
      503,
      "admin_not_configured",
      "پنل پذیرش هنوز تنظیم نشده است؛ متغیر ADMIN_PASSWORD_HASH در تنظیمات سرور تعریف نشده.",
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
  const username = typeof record.username === "string" ? record.username : "";
  const password = typeof record.password === "string" ? record.password : "";
  const invalidMessage = "نام کاربری یا گذرواژه نادرست است.";

  if (username === "" || password === "" || username !== admin.username) {
    recordLoginFailure(identityKey, nowUtcMs);
    return jsonError(401, "invalid_credentials", invalidMessage);
  }

  const passwordOk = await verifyAdminPassword(password, admin.passwordHash);
  if (!passwordOk) {
    recordLoginFailure(identityKey, nowUtcMs);
    return jsonError(401, "invalid_credentials", invalidMessage);
  }

  resetLoginFailures(identityKey);

  let token: string;
  try {
    token = createSessionToken(admin.username, nowUtcMs);
  } catch (error) {
    console.error("[admin/login] امضای نشست ناموفق بود:", error);
    return jsonError(
      503,
      "admin_not_configured",
      "پنل پذیرش هنوز تنظیم نشده است؛ کلید امضای نشست معتبر نیست.",
    );
  }

  const response = NextResponse.json(
    { ok: true, username: admin.username },
    { headers: { "Cache-Control": "no-store" } },
  );
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "";
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    httpOnly: true,
    // strict: کوکی نشست در هیچ درخواست بین‌سایتی فرستاده نمی‌شود
    sameSite: "strict",
    path: "/",
    secure:
      request.nextUrl.protocol === "https:" ||
      forwardedProto.split(",")[0]?.trim() === "https",
  });
  return response;
}
