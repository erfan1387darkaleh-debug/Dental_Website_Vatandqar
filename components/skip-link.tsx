/**
 * لینک «پرش به محتوای اصلی» برای کاربران صفحه‌کلید.
 * پیش‌تر داخل چیدمان سایت بود؛ اکنون چیدمان‌های اختصاصی بخش زیبایی و
 * محصولات هم از همین مؤلفه مشترک استفاده می‌کنند (کلاس‌ها بدون تغییر).
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:right-3 focus-visible:z-100 focus-visible:rounded-full focus-visible:bg-white focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-bold focus-visible:text-primary-800 focus-visible:shadow-lg focus-visible:ring-1 focus-visible:ring-slate-200"
    >
      پرش به محتوای اصلی
    </a>
  );
}
