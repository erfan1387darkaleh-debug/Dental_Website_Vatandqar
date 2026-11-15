/**
 * کلاس‌های مشترک دکمه‌ها برای یکدستی ظاهر در کل سایت.
 * اگر جایی به دکمه جدید نیاز داشتید، اول یکی از این‌ها را امتحان کنید.
 */

/** دکمه اصلی (پررنگ) — رنگ پس‌زمینه سبزآبی تیره */
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-800 active:bg-primary-900 dark:hover:bg-primary-600 dark:active:bg-primary-500 dark:shadow-none dark:ring-1 dark:ring-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300";

/** دکمه گرادیانی برند (سبزآبی → آبی آسمانی) — فراخوان اصلی هیرو و بخش‌های تبدیل */
export const btnGradient =
  "inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-l from-primary-600 to-accent-2 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-700/25 transition duration-200 hover:shadow-xl hover:shadow-primary-700/30 hover:brightness-105 active:brightness-95 dark:shadow-primary-900/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300";

/** دکمه دوم (کمرنگ) — حاشیه‌دار روی پس‌زمینه صفحه */
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-6 py-3 text-sm font-semibold text-heading transition-colors duration-200 hover:border-primary-300 hover:bg-tint hover:text-primary-800 dark:hover:border-primary-700 dark:hover:bg-primary-900/40 dark:hover:text-primary-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300";

/** دکمه گرادیانی خدمات زیبایی (رز → بنفش) — متمایز از رنگ برند دندانپزشکی
 *  تا بخش زیبایی در نگاه اول از دندانپزشکی تفکیک شود */
export const btnBeauty =
  "inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-l from-rose-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 transition duration-200 hover:shadow-xl hover:shadow-rose-600/30 hover:brightness-105 active:brightness-95 dark:shadow-rose-900/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 dark:focus-visible:outline-rose-400";

/** دکمه گرادیانی محصولات وطندار (کهربایی → نارنجی) — گرم و متمایز از
 *  سبزآبی دندانپزشکی و رزِ بخش زیبایی */
export const btnProducts =
  "inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-l from-amber-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-600/25 transition duration-200 hover:shadow-xl hover:shadow-amber-600/30 hover:brightness-105 active:brightness-95 dark:shadow-amber-900/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:focus-visible:outline-amber-400";

/** لینک متنی با فلش — برای «بیشتر بدانید» و مشابه آن */
export const btnTextLink =
  "inline-flex items-center justify-center gap-1.5 text-sm font-bold text-accent transition-colors duration-200 hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300";
