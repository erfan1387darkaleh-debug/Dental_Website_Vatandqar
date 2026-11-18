import Image from "next/image";

/*
 * لایهٔ پس‌زمینهٔ صفحه اصلی — تصویر «ست دندانپزشکی» به‌صورت لایهٔ fixed
 * پشت همهٔ بخش‌ها، با شست‌وشوی گرادیان هم‌رنگ canvas.
 *
 * فایل dental-unit-bg.png یک تصویر شفاف (برش‌خوردهٔ صندلی) است؛ با
 * object-contain کل ست (صندلی، چراغ، مانیتور و هندپیس‌ها) بدون برش دیده
 * می‌شود و نواحی شفاف، رنگ canvas را نشان می‌دهند.
 *
 * چیدمان لایه‌ها (از پایین به بالا):
 *   ۱) بدنه با رنگ canvas
 *   ۲) تصویر: object-contain + شفافیت بالا (بدون بلور)
 *   ۳) شست‌وشوی گرادیان canvas از ۷۵٪ تا ۴۵٪ تا ۸۰٪ — تصویر در تمام
 *      صفحه دیده می‌شود ولی متن و کارت‌ها خوانا می‌مانند
 *   ۴) محتوای صفحه: در app/(site)/page.tsx داخل «relative z-10» قرار
 *      گرفته تا مطمئناً روی لایهٔ z-0 تصویر بنشیند
 *
 * بخش‌های صفحهٔ اصلی بی‌رنگ‌اند تا این لایه دیده شود؛ کارت‌های اصلی
 * bg-surface-2/85 + backdrop-blur-md زمینهٔ روشن و پرکنتراست می‌سازند.
 */
export function HomeBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <Image
        src="/images/dental-unit-bg.png"
        alt="ست دندانپزشکی مدرن؛ صندلی برقی با چراغ معاینه، هندپیس‌ها و مانیتور"
        fill
        priority
        sizes="100vw"
        className="object-contain opacity-85 blur-none dark:opacity-65"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-b from-canvas/75 via-canvas/45 to-canvas/80"
      />
    </div>
  );
}
