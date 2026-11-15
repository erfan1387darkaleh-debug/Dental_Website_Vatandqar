import { Send } from "lucide-react";
import { TELEGRAM_URL } from "@/lib/site-config";

/**
 * دکمهٔ شناور تلگرام — ثابت در پایین صفحه (گوشهٔ چپ) با هاور باز می‌شود
 * تا برچسب گفت‌وگو نمایش داده شود؛ آیکون هواپیمای کاغذی با هاور کمی
 * می‌چرخد. لینک مستقیم به پیج تلگرام کسب‌وکار (TELEGRAM_URL در site-config).
 * کامپوننت سرور است (فقط CSS هاور، بدون جاوااسکریپت). چون دکمه در گوشهٔ
 * چپ لنگر شده، ترتیب دیداری آیکون↔برچسب با dir="ltr" ثابت می‌شود تا
 * بازشدن به سمت مرکز صفحه باشد.
 */
export function FloatingTelegram() {
  return (
    <a
      href={TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="گفت‌وگوی سریع در تلگرام"
      dir="ltr"
      className="group fixed bottom-5 left-5 z-40 flex items-center gap-0 rounded-full bg-linear-to-l from-sky-500 to-blue-600 p-3.5 text-white shadow-lg shadow-blue-900/25 transition-all duration-300 hover:scale-105 hover:gap-2.5 hover:pl-3.5 hover:pr-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:shadow-black/40"
    >
      <Send
        className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:rotate-12"
        aria-hidden="true"
      />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold opacity-0 transition-all duration-300 group-hover:max-w-44 group-hover:opacity-100">
        گفت‌وگو در تلگرام
      </span>
    </a>
  );
}
