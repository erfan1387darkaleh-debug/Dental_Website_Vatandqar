/**
 * ────────────────────────────────────────────────────────────────
 *  احراز و مجوز پنل پذیرش — فقط سمت سرور
 * ────────────────────────────────────────────────────────────────
 *  یک حساب مشترک پنل پذیرش. گذرواژه هرگز به‌صورت خام در تنظیمات
 *  قرار نمی‌گیرد؛ فقط هش bcrypt آن در متغیر محیطی ADMIN_PASSWORD_HASH.
 *  نشست = کوکی httpOnly با توکن امضاشدهٔ HMAC-SHA256 (چارچوب: کلید
 *  AUTH_SECRET) و عمر ۱۲ ساعته. هیچ توکن/کلیدی به بستهٔ کلاینت نمی‌رود؛
 *  اعتبارسنجی توکن در هر صفحه و هر مسیر API پذیرش تکرار می‌شود.
 * ────────────────────────────────────────────────────────────────
 */
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

/** نام کوکی نشست پنل پذیرش */
export const SESSION_COOKIE_NAME = "dental_admin_session";
/** عمر نشست: ۱۲ ساعت */
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export type AdminIdentity = { username: string };

/** کلید امضا از env؛ بدون آن نشست معتبری ساخته/پذیرفته نمی‌شود */
function getAuthSecret(): string | null {
  const secret = process.env.AUTH_SECRET?.trim() ?? "";
  return secret === "" ? null : secret;
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function hmacSignature(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** ساخت توکن نشست: payload.{HMAC} — امضا با AUTH_SECRET */
export function createSessionToken(username: string, nowUtcMs: number): string {
  const secret = getAuthSecret();
  if (!secret) {
    throw new Error("AUTH_SECRET تنظیم نشده است؛ پنل پذیرش کار نمی‌کند.");
  }
  const payload = toBase64Url(
    JSON.stringify({
      u: username,
      // نویسهٔ تصادفی برای یکتا شدن توکن‌های هم‌زمان
      n: randomUUID(),
      e: nowUtcMs + SESSION_TTL_MS,
    }),
  );
  return `${payload}.${hmacSignature(secret, payload)}`;
}

/** صحت‌سنجی امضا، ساختار و انقضا — نتیجه فقط خود موجودیِ پذیرش است */
export function verifySessionToken(
  token: string | undefined | null,
  nowUtcMs: number,
): AdminIdentity | null {
  const secret = getAuthSecret();
  if (!secret) return null;
  if (typeof token !== "string") return null;

  const separatorIndex = token.indexOf(".");
  if (separatorIndex <= 0) return null;
  const payload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  if (payload === "" || signature === "") return null;

  const expected = hmacSignature(secret, payload);
  // مقایسهٔ زمان‌ثابت — جلوگیری از حملهٔ کانال زمان
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }

  let parsed: { u?: unknown; e?: unknown };
  try {
    parsed = JSON.parse(fromBase64Url(payload));
  } catch {
    return null;
  }
  if (typeof parsed.u !== "string" || parsed.u === "") return null;
  if (typeof parsed.e !== "number" || parsed.e <= nowUtcMs) return null;
  return { username: parsed.u };
}

/** صحت‌سنجی نشست با زمان واقعی سیستم — برای صفحات سرور (بدون تزریق زمان) */
export function verifyCurrentSessionToken(
  token: string | undefined | null,
): AdminIdentity | null {
  return verifySessionToken(token, Date.now());
}

/* ── حساب پذیرش (از متغیرهای محیطی) ── */

export type AdminAccount = {
  username: string;
  passwordHash: string;
};

/** خواندن حساب پذیرش از env؛ null یعنی پنل هنوز تنظیم نشده */
export function getAdminAccount(): AdminAccount | null {
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim() ?? "";
  if (passwordHash === "") return null;
  const username = process.env.ADMIN_USERNAME?.trim() || "reception";
  return { username, passwordHash };
}

/** مقایسهٔ امن گذرواژه با هش ذخیره‌شده */
export async function verifyAdminPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, passwordHash);
  } catch {
    return false;
  }
}

/* ── محدودسازی تلاش ناموفق ورود (در حافظهٔ نمونهٔ سرور) ── */
const LOGIN_MAX_FAILURES = 5;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;

const loginFailures = new Map<string, { count: number; windowStart: number }>();

/** آیا کلید (IP/کاربر) پیش از تلاش بعدی بلاک است */
export function isLoginThrottled(key: string, nowUtcMs: number): boolean {
  const record = loginFailures.get(key);
  if (!record) return false;
  if (nowUtcMs - record.windowStart > LOGIN_WINDOW_MS) {
    loginFailures.delete(key);
    return false;
  }
  return record.count >= LOGIN_MAX_FAILURES;
}

/** ثبت یک تلاش ناموفق برای کلید */
export function recordLoginFailure(key: string, nowUtcMs: number): void {
  const record = loginFailures.get(key);
  if (!record || nowUtcMs - record.windowStart > LOGIN_WINDOW_MS) {
    loginFailures.set(key, { count: 1, windowStart: nowUtcMs });
    return;
  }
  record.count += 1;
}

/** پاک‌سازی پرشمار تلاش ناموفق پس از ورود موفق */
export function resetLoginFailures(key: string): void {
  loginFailures.delete(key);
}
