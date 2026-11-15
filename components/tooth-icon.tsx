/**
 * آیکون خطی دندان (سبک Lucide) — برای نشان مرکزی کارت هیرو.
 * چون Lucide آیکون «دندان» ندارد، این گلیف به‌صورت بردار خطی تمیز و
 * متقارن ساخته شده: تاج دوبخشی در بالا، گردن باریک و دو ریشهٔ گرد در
 * پایین (نسبت‌های کلاسیک آیکون‌های دندانپزشکی) در viewBox ۲۴×۲۴.
 * stroke از currentColor پیروی می‌کند تا مثل آیکون‌های Lucide
 * رنگ‌پذیر باشد. نشان برند سایت (tooth-logo.tsx) جداگانه است و این
 * کامپوننت جایگزین آن نیست.
 */
export function ToothIcon({
  className = "h-6 w-6",
  strokeWidth = 1.5,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3.25C10.55 3.25 9.9 4.35 8.35 4.35C6.15 4.35 4.55 6.05 4.55 8.3C4.55 10.1 5.3 11.35 5.95 13.1C6.6 14.9 6.95 17.2 7.6 18.9C8.05 20 9.2 20.5 9.85 19.55C10.7 18.3 10.75 16.35 11.45 15.1C11.75 14.55 12.25 14.55 12.55 15.1C13.25 16.35 13.3 18.3 14.15 19.55C14.8 20.5 15.95 20 16.4 18.9C17.05 17.2 17.4 14.9 18.05 13.1C18.7 11.35 19.45 10.1 19.45 8.3C19.45 6.05 17.85 4.35 15.65 4.35C14.1 4.35 13.45 3.25 12 3.25Z" />
    </svg>
  );
}
