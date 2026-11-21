/**
 * اجرای کارهای غیرحیاتی (مثل خواندن نظرات و نمونه‌کارها) پس از بیکار شدن
 * مرورگر. هدف: در ثانیه‌های اول، پهنای باند و پردازش اصلی صرف تصویر
 * هیرو و آب‌رسانی صفحه شود؛ این درخواست‌ها بعد از آن شروع می‌شوند و
 * تجربهٔ کاربر تغییری نمی‌کند. مرورگرهای بدون requestIdleCallback
 * (مثل سافاری قدیمی) پس از ۳۰۰ میلی‌ثانیه اجرا می‌شوند.
 */
export function scheduleIdle(
  task: () => void,
  timeout = 2000,
): () => void {
  if (typeof window === "undefined") return () => {};

  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(task, { timeout });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(task, 300);
  return () => window.clearTimeout(id);
}
