import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { btnProducts } from "@/lib/styles";
import { Container } from "@/components/container";

/**
 * بنر معرفی محصولات وطندار در صفحه اصلی — نوار شیشه‌ای باریک با رنگ‌بندی
 * گرم کهربایی/نارنجی که از دندانپزشکی (سبزآبی) و زیبایی (رز) تفکیک می‌شود؛
 * لینک به صفحه اختصاصی /products.
 */
export function ProductsBanner() {
  return (
    <section
      aria-labelledby="products-banner-heading"
      className="bg-canvas"
    >
      <Container className="py-4 sm:py-6">
        <div className="relative overflow-hidden rounded-3xl border border-amber-100 bg-linear-to-l from-amber-50/90 via-orange-50/70 to-amber-50/90 p-6 shadow-soft sm:p-8 dark:border-amber-900/40 dark:from-amber-950/25 dark:via-orange-950/20 dark:to-amber-950/25">
          {/* درخشش بسیار ملایم در لبهٔ کارت — هماهنگ با سلیقهٔ مینیمال سایت */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-10 -top-12 h-40 w-40 rounded-full bg-amber-300/25 blur-3xl dark:bg-amber-800/20"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-12 -right-10 h-40 w-40 rounded-full bg-orange-300/20 blur-3xl dark:bg-orange-800/15"
          />

          <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-start">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-bl from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-600/25">
                <ShoppingBag className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p
                  id="products-banner-heading"
                  className="text-base font-extrabold text-heading sm:text-lg"
                >
                  محصولات وطندار — منتخب برای مراقبت روزانه
                </p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  کالاهای اصل و منتخب، از مراقبت دهان و دندان تا پوست؛ استعلام
                  قیمت و سفارش در تلگرام.
                </p>
              </div>
            </div>
            <Link
              href="/products"
              target="_blank"
              rel="noopener noreferrer"
              className={`${btnProducts} shrink-0 px-5 py-2.5`}
            >
              مشاهده محصولات
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
