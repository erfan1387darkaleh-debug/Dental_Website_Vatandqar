import Link from "next/link";
import { InstagramIcon } from "@/components/instagram-icon";
import { TelegramIcon } from "@/components/telegram-icon";
import { RubikaIcon } from "@/components/rubika-icon";
import { PersianYear } from "@/components/persian-year";
import { Send } from "lucide-react";
import {
  INSTAGRAM_URL,
  RUBIKA_URL,
  SITE,
  TELEGRAM_URL,
} from "@/lib/site-config";
import { ToothLogo } from "./tooth-logo";
import { FooterServicesColumn } from "./footer-services-column";
import { FooterQuickLinks } from "./footer-quick-links";
import { Container } from "./container";

/**
 * فوتر سایت — سرمه‌ای تیره (slate-900) در هر دو حالت روشن و تاریک تا
 * انتهای صفحه احساس «پایان» بدهد؛ برند، دسترسی سریع، ستون خدماتِ
 * وابسته به صفحه (دندانپزشکی/زیبایی/محصولات) و شبکه‌های اجتماعی
 * (شامل دکمهٔ تلگرام). اطلاعات شعبه‌ها عمداً در فوتر نیست و
 * فقط در صفحهٔ اصلی (بخش شعبه‌ها و تماس) و دادهٔ ساختاریافته می‌ماند.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900 text-slate-300">
      <Container className="py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {/* برند و معرفی کوتاه + دکمهٔ تلگرام */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400"
              aria-label={SITE.name}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-700 text-white shadow-sm">
                <ToothLogo className="h-6 w-6" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-base font-extrabold text-slate-100 sm:text-lg">
                  {SITE.shortName}
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {SITE.subtitle}
                </span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              {SITE.tagline}. در فضایی آرام و بهداشتی، برای شما و خانواده‌تان
              کناریم.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="اینستاگرام بازرگانی وطندار"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 transition-colors duration-200 hover:border-sky-500/60 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                <InstagramIcon className="h-4.5 w-4.5" aria-hidden="true" />
              </a>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="تلگرام بازرگانی وطندار"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 transition-colors duration-200 hover:border-sky-500/60 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                <TelegramIcon className="h-4.5 w-4.5" aria-hidden="true" />
              </a>
              <a
                href={RUBIKA_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="روبیکا بازرگانی وطندار"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 transition-colors duration-200 hover:border-sky-500/60 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                <RubikaIcon className="h-4.5 w-4.5" aria-hidden="true" />
              </a>
            </div>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-linear-to-l from-sky-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition duration-200 hover:scale-[1.03] hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              گفت‌وگو در تلگرام
            </a>
          </div>

          {/* دسترسی سریع — لینک «تماس و مشاوره» بسته به صفحهٔ جاری به
              بخش تماس همان صفحه اسکرول می‌شود (جزیرهٔ کلاینت) */}
          <FooterQuickLinks />

          {/* ستون خدمات — بسته به صفحهٔ جاری انطباق می‌یابد:
              دندانپزشکی (پیش‌فرض)، خدمات زیبایی در /beauty و
              دسته‌های محصولات در /products */}
          <FooterServicesColumn />
        </div>

        {/* نوار پایانی */}
        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-slate-800 pt-6 text-center text-xs text-slate-500 sm:flex-row sm:text-start">
          <p>© <PersianYear /> {SITE.name} — تمامی حقوق محفوظ است.</p>
          <p>مراقبت از لبخند شما، افتخار ماست.</p>
        </div>
      </Container>
    </footer>
  );
}
