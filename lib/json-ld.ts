import {
  BRANCHES,
  INSTAGRAM_URL,
  RUBIKA_URL,
  SITE,
  SITE_URL,
  TELEGRAM_URL,
} from "@/lib/site-config";

/**
 * دادهٔ ساختاریافته (Schema.org) — کسب‌وکار اصلی با دو شعبه (Dentist).
 * پیش‌تر داخل چیدمان سایت تعریف شده بود؛ اکنون برای این‌که چیدمان‌های
 * اختصاصی بخش «خدمات زیبایی» و «محصولات» هم همین داده را داشته باشند،
 * به این ماژول مشترک منتقل شده است. خروجی هر سه چیدمان یکسان است.
 */
export const BUSINESS_JSON_LD = {
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
