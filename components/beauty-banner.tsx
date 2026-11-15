import Link from "next/link";
import { Sparkles } from "lucide-react";
import { btnBeauty } from "@/lib/styles";
import { Container } from "@/components/container";

/**
 * بنر معرفی خدمات زیبایی و پیکرتراشی بدن در صفحه اصلی — نوار شیشه‌ای باریک
 * با رنگ‌بندی متمایز بخش زیبایی (رز/بنفش) که از بخش‌های دندانپزشکی تفکیک
 * می‌شود؛ لینک به صفحه اختصاصی /beauty.
 */
export function BeautyBanner() {
  return (
    <section
      aria-labelledby="beauty-banner-heading"
      className="bg-canvas"
    >
      <Container className="py-4 sm:py-6">
        <div className="relative overflow-hidden rounded-3xl border border-rose-100 bg-linear-to-l from-rose-50/90 via-pink-50/70 to-purple-50/90 p-6 shadow-soft sm:p-8 dark:border-rose-900/40 dark:from-rose-950/30 dark:via-purple-950/20 dark:to-rose-950/30">
          {/* درخشش بسیار ملایم در لبهٔ کارت — هماهنگ با سلیقهٔ مینیمال سایت */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-10 -top-12 h-40 w-40 rounded-full bg-rose-300/25 blur-3xl dark:bg-rose-800/20"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-12 -right-10 h-40 w-40 rounded-full bg-purple-300/20 blur-3xl dark:bg-purple-800/15"
          />

          <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-start">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-bl from-rose-500 to-purple-600 text-white shadow-lg shadow-rose-600/25">
                <Sparkles className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p
                  id="beauty-banner-heading"
                  className="text-base font-extrabold text-heading sm:text-lg"
                >
                  ارائهٔ جدید: خدمات زیبایی و پیکرتراشی بدن
                </p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  بوتاکس، پیکرتراشی و لیپوساکشن، برداشتن خال و مراقبت پوست — با
                  مشاورهٔ تخصصی پیش از هر اقدام.
                </p>
              </div>
            </div>
            <Link
              href="/beauty"
              target="_blank"
              rel="noopener noreferrer"
              className={`${btnBeauty} shrink-0 px-5 py-2.5`}
            >
              مشاهده خدمات زیبایی
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
