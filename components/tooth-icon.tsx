import Image from "next/image";
import type { HTMLAttributes } from "react";

/**
 * تصویر دندان با تاج طلایی — نشان مرکزی قاب‌های دایره‌ای سایت.
 *
 * منبع تصویر، فایل شفاف `public/images/tooth-golden-crown.png` است و
 * بازسازی یا بازکشیدن نشده؛ همان فایل با `next/image` نمایش داده
 * می‌شود تا مرورگر نسخهٔ بهینه و متناسب با اندازهٔ نمایش را دریافت کند.
 *
 * فایل اصلی ۱۵۳۶×۱۰۲۴ و افقی است و حاشیهٔ شفاف زیادی در دو طرف دارد؛
 * اگر با object-contain در جعبهٔ مربعی جا داده شود، خودِ دندان کوچک
 * می‌شود. بنابراین تصویر کمی بزرگ‌تر از جعبه رندر و با درصدهای زیر
 * دقیقاً روی مرکز جعبه تنظیم می‌شود (محتوای غیرشفاف در مختصات فایل
 * از x=366 تا x=1090 و y=8 تا y=982 است؛ یعنی مرکز محتوا ۴۰ پیکسل
 * چپ‌تر و ۱۷ پیکسل بالاتر از مرکز تصویر قرار دارد).
 *
 * جعبهٔ چیدمان همان اندازهٔ قبلی است (کلاس‌های ارتفاع/عرض) تا هیچ
 * تغییری در فاصله‌ها و واکنش‌گرایی نشان‌ها ایجاد نشود.
 */
export function ToothIcon({
  className = "h-6 w-6",
  ...rest
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      aria-hidden="true"
      {...rest}
    >
      <Image
        src="/images/tooth-golden-crown.png"
        alt=""
        width={1536}
        height={1024}
        sizes="128px"
        className="pointer-events-none absolute left-[53.7%] top-[51.6%] h-[94%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
      />
    </span>
  );
}
