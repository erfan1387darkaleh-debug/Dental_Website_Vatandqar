/**
 * جستجوی نوبت در پنل پذیرش — منطق خالص و مستقل از Next
 * ─────────────────────────────────────────────────────
 * پذیرش با یک ورودی واحد («کد رهگیری، نام بیمار یا شمارهٔ موبایل»)
 * فهرست نوبت‌های روز را در لحظه فیلتر می‌کند. قواعد تطبیق:
 *   - بی‌حساس به بزرگی/کوچکی حروف لاتین (فارسی ذاتاً بی‌حساس است)
 *   - فاصله‌های ابتدای/انتهای ورودی و فاصله‌های تکراری نادیده
 *   - ارقام فارسی/عربی در ورودی به لاتین تبدیل می‌شود تا «۸۴۹۲۱۰»
 *     هم همان «849210» را پیدا کند
 *   - تطبیق «یا»یی: کافی است کد رهگیری، نام یا شمارهٔ موبایل بخورد
 *   - برای کد/موبایل، ورودیِ فقط-رقمی به‌صورت زیررشته جستجو می‌شود
 *     («849» هم کد 849210 را می‌یابد)؛ برای نام، کل ورودی زیررشتهٔ نام است
 *   - ورودی خالی → همهٔ نوبت‌ها (فیلتر غیرفعال)
 */

/** تبدیل ارقام فارسی (۰-۹) و عربی (٠-٩) به لاتین */
export function toLatinDigits(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code !== undefined && code >= 0x06f0 && code <= 0x06f9) {
      out += String(code - 0x06f0); // ارقام فارسی
    } else if (code !== undefined && code >= 0x0660 && code <= 0x0669) {
      out += String(code - 0x0660); // ارقام عربی
    } else {
      out += ch;
    }
  }
  return out;
}

/** ورودیِ جستجوی خام → نرمال‌شدهٔ مقایسه (حروف کوچک، ارقام لاتین، فاصلهٔ واحد) */
export function normalizeSearchQuery(raw: string): string {
  return toLatinDigits(raw)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** حداقل دادهٔ لازم برای تطبیق — زیرنوع ردیف نوبت پنل پذیرش */
export type SearchableAppointment = {
  trackingCode: string;
  patientName: string;
  patientPhone: string;
};

/** آیا نوبت با پرس‌وجوی جستجو (خام، همان‌که پذیرش تایپ می‌کند) می‌خواند؟ */
export function appointmentMatchesQuery(
  appointment: SearchableAppointment,
  rawQuery: string,
): boolean {
  const query = normalizeSearchQuery(rawQuery);
  if (query === "") return true;

  const name = appointment.patientName.toLowerCase().trim();
  if (name.includes(query)) return true;

  // کد رهگیری و موبایل: فقط بخش‌های رقمیِ ورودی در آن‌ها جستجو می‌شود
  const digits = query.replace(/[^0-9]/g, "");
  if (digits === "") return false;
  return (
    appointment.trackingCode.includes(digits) ||
    appointment.patientPhone.includes(digits)
  );
}
