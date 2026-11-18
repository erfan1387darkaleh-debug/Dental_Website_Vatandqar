import { DepartmentHeader } from "@/components/department-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingTelegram } from "@/components/floating-telegram";
import { SkipLink } from "@/components/skip-link";
import { BUSINESS_JSON_LD } from "@/lib/json-ld";

/*
 * چیدمان اختصاصی بخش «محصولات وطندار» — هدر این بخش به‌جای هدر اصلی
 * دندانپزشکی رندر می‌شود و بقیهٔ اسکلت صفحه (لینک پرش، فوتر، تلگرام
 * شناور و دادهٔ ساختاریافته) دقیقاً مانند چیدمان سایت است.
 */

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SkipLink />
      <DepartmentHeader department="products" />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <FloatingTelegram />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BUSINESS_JSON_LD) }}
      />
    </>
  );
}
