/**
 * ────────────────────────────────────────────────────────────────
 *  نرمال‌سازی و اعتبارسنجی شمارهٔ موبایل ایران
 * ────────────────────────────────────────────────────────────────
 *  فقط در سمت سرور روی دادهٔ کاربر اجرا می‌شود. خروجی همیشه شکل
 *  استاندارد «09xxxxxxxxx» (۱۱ رقم لاتین) است تا در پایگاه‌داده قالب
 *  یکپارچه بماند؛ ارقام فارسی/عربی، فاصله‌ها و پیش‌شماره‌های بین‌المللی
 *  (+98 / 0098 / 98) به همان شکل داخلی برمی‌گردند.
 * ────────────────────────────────────────────────────────────────
 */

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export type NormalizePhoneResult =
  | { ok: true; phone: string }
  | { ok: false; reason: "format" };

export function normalizeIranMobile(raw: string): NormalizePhoneResult {
  if (typeof raw !== "string") return { ok: false, reason: "format" };

  let digits = "";
  for (const char of raw) {
    const faIndex = FA_DIGITS.indexOf(char);
    const arIndex = AR_DIGITS.indexOf(char);
    if (faIndex >= 0) digits += String(faIndex);
    else if (arIndex >= 0) digits += String(arIndex);
    else if (char >= "0" && char <= "9") digits += char;
    // بقیهٔ نویسه‌ها (فاصله، خط تیره، +، پرانتز و…) هشدار نمی‌دهند و حذف می‌شوند
  }

  // پیش‌شماره‌های بین‌المللی را به شکل داخلی برسان
  if (digits.length === 14 && digits.startsWith("0098")) {
    digits = `0${digits.slice(4)}`;
  } else if (digits.length === 12 && digits.startsWith("98")) {
    digits = `0${digits.slice(2)}`;
  } else if (digits.length === 10 && digits.startsWith("9")) {
    digits = `0${digits}`;
  }

  if (/^09\d{9}$/.test(digits)) return { ok: true, phone: digits };
  return { ok: false, reason: "format" };
}
