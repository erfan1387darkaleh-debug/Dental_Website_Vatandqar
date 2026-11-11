import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  BRANCHES,
  INSTAGRAM_URL,
  RUBIKA_URL,
  SITE,
  SITE_URL,
  TELEGRAM_URL,
} from "@/lib/site-config";

/*
 * چیدمان صفحات عمومی (خانه، درباره ما، خدمات، نوبت‌دهی) — هدر و فوتر
 * سایت و دادهٔ ساختاریافته در این لایه قرار دارند؛ لایهٔ ریشه
 * (app/layout.tsx) فقط چارچوب HTML، فونت و تم را می‌سازد تا پنل پذیرش
 * بدون chrome عمومی سایت رندر شود.
 */

/** دادهٔ ساختاریافته (Schema.org) — کسب‌وکار اصلی با دو شعبه (Dentist) */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  description: SITE.description,
  url: SITE_URL,
  sameAs: [INSTAGRAM_URL, TELEGRAM_URL, RUBIKA_URL],
  subOrganization: BRANCHES.map((branch) => ({
    "@type": "Dentist",
    name: branch.descriptor,
    telephone: branch.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: branch.address,
      addressLocality: "مشهد",
      addressCountry: "IR",
    },
    openingHoursSpecification: branch.openingHours
      .filter((entry) => entry.periods.length > 0)
      .flatMap((entry) =>
        entry.periods.map((period) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: entry.dayOfWeek,
          opens: period.opens,
          closes: period.closes,
        })),
      ),
  })),
};

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* لینک پرش برای کاربران صفحه‌کلید */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:right-3 focus-visible:z-100 focus-visible:rounded-full focus-visible:bg-white focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-bold focus-visible:text-primary-800 focus-visible:shadow-lg focus-visible:ring-1 focus-visible:ring-slate-200"
      >
        پرش به محتوای اصلی
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
