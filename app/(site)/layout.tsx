import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingTelegram } from "@/components/floating-telegram";
import { SkipLink } from "@/components/skip-link";
import { BUSINESS_JSON_LD } from "@/lib/json-ld";

/*
 * چیدمان صفحات عمومی (خانه، درباره ما، خدمات، نوبت‌دهی) — هدر و فوتر
 * سایت و دادهٔ ساختاریافته در این لایه قرار دارند؛ لایهٔ ریشه
 * (app/layout.tsx) فقط چارچوب HTML، فونت و تم را می‌سازد تا پنل پذیرش
 * بدون chrome عمومی سایت رندر شود.
 *
 * بخش‌های همکار (خدمات زیبایی و محصولات) چیدمان اختصاصی خودشان را در
 * app/(beauty) و app/(products) دارند و از این چیدمان عبور نمی‌کنند؛
 * لینک پرش، فوتر، تلگرام شناور و دادهٔ ساختاریافته بین هر سه مشترک است.
 */

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* لینک پرش برای کاربران صفحه‌کلید */}
      <SkipLink />
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      {/* فوتر روی لایهٔ پس‌زمینهٔ صفحه اصلی (z-0) می‌نشیند */}
      <div className="relative z-10">
        <SiteFooter />
      </div>
      <FloatingTelegram />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BUSINESS_JSON_LD) }}
      />
    </>
  );
}
