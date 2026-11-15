import type { Metadata } from "next";
import {
  BadgeCheck,
  MessagesSquare,
  Phone,
  Send,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { productCategories } from "@/data/products";
import { ProductIcon } from "@/components/product-icon";
import { btnProducts, btnSecondary } from "@/lib/styles";
import { SITE, TELEGRAM_URL } from "@/lib/site-config";
import { DepartmentContactBox } from "@/components/department-contact";
import { Reveal } from "@/components/reveal";
import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "محصولات وطندار",
  description: `محصولات وطندار؛ کالاهای اصل و منتخب برای مراقبت روزانهٔ دهان و دندان و پوست. استعلام قیمت و سفارش از طریق تلگرام ${SITE.name}.`,
  alternates: { canonical: "/products" },
};

/** نشان‌های اعتماد بخش محصولات — ادعاهای عمومی و قابل دفاع */
const PRODUCT_TRUST = [
  {
    icon: BadgeCheck,
    title: "کالای اصل و منتخب",
    text: "محصولاتی که تیم وطندار با دقت انتخاب می‌کند و به مراجعان پیشنهاد می‌دهد.",
  },
  {
    icon: MessagesSquare,
    title: "راهنمایی پیش از خرید",
    text: "برای انتخاب محصول مناسب شرایط‌تان، در تلگرام راهنمایی رایگان بگیرید.",
  },
  {
    icon: Sparkles,
    title: "هم‌راستا با خدمات مجموعه",
    text: "محصولات در ادامهٔ خدمات دندانپزشکی و زیبایی وطندار انتخاب شده‌اند.",
  },
] as const;

/** صفحه محصولات وطندار — هم‌سبک طراحی سایت، با رنگ‌بندی متمایز کهربایی/نارنجی */
export default function ProductsPage() {
  return (
    <>
      {/* هیرو محصولات — درخشش‌های بسیار ملایم کهربایی */}
      <section
        aria-labelledby="products-hero-heading"
        className="relative overflow-hidden bg-canvas"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 -top-44 h-[20rem] w-[20rem] rounded-full bg-amber-200/25 blur-3xl dark:bg-amber-800/15"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-44 -right-32 h-72 w-72 rounded-full bg-orange-200/20 blur-3xl dark:bg-orange-800/10"
        />

        <Container className="relative py-14 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-4 py-1.5 text-xs font-bold text-amber-700 shadow-sm backdrop-blur-xl dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
                <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                محصولات وطندار — کالای اصل و منتخب
              </span>
            </p>
            <h1
              id="products-hero-heading"
              className="mt-5 text-3xl font-extrabold leading-[1.4] text-heading sm:text-4xl lg:text-[2.75rem] lg:leading-[1.35]"
            >
              محصولات وطندار،{" "}
              <span className="bg-linear-to-l from-amber-600 via-orange-500 to-amber-400 bg-clip-text text-transparent dark:from-amber-400 dark:via-orange-400 dark:to-amber-300">
                انتخابی مطمئن برای مراقبت روزانه
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-muted sm:text-lg sm:leading-9">
              مجموعه‌ای از کالاهای اصل و منتخب برای مراقبت روزانهٔ دهان و دندان
              و پوست؛ هم‌راستا با خدمات دندانپزشکی و زیبایی مجموعه. برای
              استعلام قیمت و موجودی، در تلگرام پیام بدهید.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={btnProducts}
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                استعلام قیمت و سفارش در تلگرام
              </a>
              <a href="#consultation" className={btnSecondary}>
                <Phone className="h-4 w-4" aria-hidden="true" />
                مشاوره و تماس تلفنی
              </a>
            </div>

            {/* برچسب‌های دسته‌های محصول */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
              {productCategories.map((category) => (
                <span
                  key={category.id}
                  className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-surface/80 px-3.5 py-1.5 text-xs font-semibold text-heading shadow-soft backdrop-blur-xl dark:border-white/10"
                >
                  <ProductIcon
                    name={category.icon}
                    className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400"
                  />
                  {category.title}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* شبکهٔ دسته‌های محصول */}
      <section
        aria-labelledby="products-grid-heading"
        className="bg-surface-2"
      >
        <Container className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50/70 px-3.5 py-1 text-xs font-bold text-amber-700 shadow-sm dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
                محصولات
              </span>
            </p>
            <h2
              id="products-grid-heading"
              className="mt-3 text-2xl font-extrabold text-heading sm:text-3xl"
            >
              دسته‌های محصولات وطندار
            </h2>
            <p className="mt-3 text-base leading-8 text-muted">
              هر دسته شامل کالاهای منتخب است؛ قیمت‌ها و موجودی روز را می‌توانید
              در تلگرام استعلام کنید.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:mt-12 lg:grid-cols-3">
            {productCategories.map((category, index) => (
              <Reveal key={category.id} delay={index * 70} className="h-full">
                {/* id لنگر پیوند عمیق ستون «محصولات» فوتر */}
                <article
                  id={`category-${category.id}`}
                  className="group flex h-full scroll-mt-24 flex-col rounded-2xl border border-line-strong bg-surface p-6 transition duration-300 hover:-translate-y-1.5 hover:border-amber-300 hover:shadow-2xl hover:shadow-amber-900/10 dark:hover:border-amber-800 dark:hover:shadow-black/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-bl from-amber-50 to-orange-100 text-amber-600 transition-colors duration-300 group-hover:from-amber-500 group-hover:to-orange-600 group-hover:text-white dark:from-amber-950/60 dark:to-orange-950/40 dark:text-amber-400 dark:group-hover:from-amber-500 dark:group-hover:to-orange-600">
                    <ProductIcon name={category.icon} />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-heading sm:text-lg">
                    {category.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    {category.description}
                  </p>
                  {/* ردیف قیمت — تا زمان تعیین قیمت‌ها «استعلام در تلگرام» */}
                  <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
                    <span className="text-xs text-subtle">قیمت</span>
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      {category.price ?? "استعلام در تلگرام"}
                    </span>
                  </div>
                  <a
                    href={TELEGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 transition-colors duration-200 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    سفارش در تلگرام
                  </a>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* نشان‌های اعتماد بخش محصولات */}
      <section aria-labelledby="products-trust-heading" className="bg-canvas">
        <Container className="py-16 sm:py-20">
          <h2 id="products-trust-heading" className="sr-only">
            چرا محصولات وطندار؟
          </h2>
          <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
            {PRODUCT_TRUST.map((item, index) => (
              <Reveal key={item.title} delay={index * 70} className="h-full">
                <div className="h-full rounded-2xl border border-line-strong bg-surface p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3.5 text-base font-bold text-heading">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    {item.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* جعبهٔ مشاورهٔ اختصاصی بخش محصولات — تلگرام و تماس تلفنی مستقیم؛
          هدف لنگر دکمهٔ «مشاوره و تماس تلفنی» هیرو (اسکرول نرم سراسری) */}
      <section
        id="consultation"
        aria-labelledby="products-consultation-heading"
        className="scroll-mt-20 bg-canvas"
      >
        <Container className="pb-16 sm:pb-20 lg:pb-24">
          <h2 id="products-consultation-heading" className="sr-only">
            مشاوره و راه‌های ارتباط بخش محصولات
          </h2>
          <Reveal>
            <DepartmentContactBox department="products" />
          </Reveal>
        </Container>
      </section>
    </>
  );
}
