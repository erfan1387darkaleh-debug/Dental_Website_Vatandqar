import type { Metadata } from "next";
import {
  MessagesSquare,
  Phone,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { beautyServices } from "@/data/beauty-services";
import { BeautyIcon } from "@/components/beauty-icon";
import { btnBeauty, btnSecondary } from "@/lib/styles";
import { SITE, TELEGRAM_URL } from "@/lib/site-config";
import { DepartmentContactBox } from "@/components/department-contact";
import { Reveal } from "@/components/reveal";
import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "خدمات زیبایی و پیکرتراشی بدن",
  description: `ارائهٔ جدید ${SITE.name}؛ خدمات زیبایی و پیکرتراشی بدن شامل بوتاکس، لیپوساکشن، برداشتن خال و جوانسازی پوست — با مشاورهٔ تخصصی پیش از هر اقدام.`,
  alternates: { canonical: "/beauty" },
};

/** نشان‌های اعتماد بخش زیبایی — ادعاهای عمومی و قابل دفاع */
const BEAUTY_TRUST = [
  {
    icon: UserRound,
    title: "تیم تخصصی همکار",
    text: "خدمات زیبایی با همکاری متخصصان باتجربهٔ هر حوزه ارائه می‌شود.",
  },
  {
    icon: ShieldCheck,
    title: "اصول بهداشتی و استریلیزاسیون",
    text: "همان استانداردهای بهداشتیِ بخش دندانپزشکی، در خدمات زیبایی هم رعایت می‌شود.",
  },
  {
    icon: MessagesSquare,
    title: "مشاورهٔ شفاف و رایگان",
    text: "پیش از هر اقدام، همهٔ گزینه‌ها و مراحل به زبان ساده برایتان توضیح داده می‌شود.",
  },
] as const;

/** صفحه خدمات زیبایی و پیکرتراشی بدن — هم‌سبک طراحی سایت، با رنگ‌بندی متمایز رز/بنفش */
export default function BeautyPage() {
  return (
    <>
      {/* هیرو بخش زیبایی — درخشش‌های بسیار ملایم رز/بنفش */}
      <section
        aria-labelledby="beauty-hero-heading"
        className="relative overflow-hidden bg-canvas"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 -top-44 h-[20rem] w-[20rem] rounded-full bg-rose-200/25 blur-3xl dark:bg-rose-800/15"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-44 -right-32 h-72 w-72 rounded-full bg-purple-200/20 blur-3xl dark:bg-purple-800/10"
        />

        <Container className="relative py-14 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50/80 px-4 py-1.5 text-xs font-bold text-rose-700 shadow-sm backdrop-blur-xl dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300">
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                ارائهٔ جدید — خدمات زیبایی و پیکرتراشی
              </span>
            </p>
            <h1
              id="beauty-hero-heading"
              className="mt-5 text-3xl font-extrabold leading-[1.4] text-heading sm:text-4xl lg:text-[2.75rem] lg:leading-[1.35]"
            >
              زیبایی پوست و تن،{" "}
              <span className="bg-linear-to-l from-rose-500 via-pink-500 to-purple-600 bg-clip-text text-transparent dark:from-rose-400 dark:via-pink-400 dark:to-purple-400">
                با همان استانداردهای مراقبت
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-muted sm:text-lg sm:leading-9">
              در کنار خدمات دندانپزشکی، از این پس خدمات زیبایی و پیکرتراشی بدن
              نیز ارائه می‌شود؛ هر اقدام پس از مشاورهٔ تخصصی و توضیح شفاف
              مراحل، با تمرکز بر سلامت و راحتی شما.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={btnBeauty}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                مشاورهٔ رایگان در تلگرام
              </a>
              <a href="#consultation" className={btnSecondary}>
                <Phone className="h-4 w-4" aria-hidden="true" />
                مشاوره و تماس تلفنی
              </a>
            </div>

            {/* برچسب‌های حوزه‌های زیبایی — بوتاکس، پیکرتراشی، خال و پوست */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
              {beautyServices.map((service) => (
                <span
                  key={service.id}
                  className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-surface/80 px-3.5 py-1.5 text-xs font-semibold text-heading shadow-soft backdrop-blur-xl dark:border-white/10"
                >
                  <BeautyIcon
                    name={service.icon}
                    className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400"
                  />
                  {service.title}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* شبکهٔ خدمات زیبایی */}
      <section
        aria-labelledby="beauty-services-heading"
        className="bg-surface-2"
      >
        <Container className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50/70 px-3.5 py-1 text-xs font-bold text-rose-700 shadow-sm dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300">
                خدمات زیبایی
              </span>
            </p>
            <h2
              id="beauty-services-heading"
              className="mt-3 text-2xl font-extrabold text-heading sm:text-3xl"
            >
              حوزه‌های خدمات زیبایی
            </h2>
            <p className="mt-3 text-base leading-8 text-muted">
              چهار حوزهٔ اصلی خدمات زیبایی؛ برای هرکدام، ابتدا مشاوره و ارزیابی
              انجام می‌شود و سپس برنامهٔ مناسب شما چیده می‌شود.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:mt-12 lg:grid-cols-4">
            {beautyServices.map((service, index) => (
              <Reveal key={service.id} delay={index * 70} className="h-full">
                {/* id لنگر پیوند عمیق ستون «خدمات زیبایی» فوتر */}
                <article
                  id={`service-${service.id}`}
                  className="group flex h-full scroll-mt-24 flex-col rounded-2xl border border-line-strong bg-surface p-6 transition duration-300 hover:-translate-y-1.5 hover:border-rose-300 hover:shadow-2xl hover:shadow-rose-900/10 dark:hover:border-rose-800 dark:hover:shadow-black/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-bl from-rose-50 to-pink-100 text-rose-600 transition-colors duration-300 group-hover:from-rose-500 group-hover:to-purple-600 group-hover:text-white dark:from-rose-950/60 dark:to-purple-950/40 dark:text-rose-400 dark:group-hover:from-rose-500 dark:group-hover:to-purple-600">
                    <BeautyIcon name={service.icon} />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-heading sm:text-lg">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    {service.description}
                  </p>
                  <ul className="mt-4 space-y-1.5">
                    {service.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2 text-xs leading-6 text-subtle"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400 dark:bg-rose-500"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={TELEGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-rose-600 transition-colors duration-200 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    مشاوره برای این خدمت
                  </a>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* نشان‌های اعتماد بخش زیبایی */}
      <section
        aria-labelledby="beauty-trust-heading"
        className="bg-canvas"
      >
        <Container className="py-16 sm:py-20">
          <h2
            id="beauty-trust-heading"
            className="sr-only"
          >
            چرا خدمات زیبایی این مجموعه؟
          </h2>
          <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
            {BEAUTY_TRUST.map((item, index) => (
              <Reveal key={item.title} delay={index * 70} className="h-full">
                <div className="h-full rounded-2xl border border-line-strong bg-surface p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
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

      {/* جعبهٔ مشاورهٔ اختصاصی بخش زیبایی — تلگرام و تماس تلفنی مستقیم؛
          هدف لنگر دکمهٔ «مشاوره و تماس تلفنی» هیرو (اسکرول نرم سراسری) */}
      <section
        id="consultation"
        aria-labelledby="beauty-consultation-heading"
        className="scroll-mt-20 bg-canvas"
      >
        <Container className="pb-16 sm:pb-20 lg:pb-24">
          <h2 id="beauty-consultation-heading" className="sr-only">
            مشاوره و راه‌های ارتباط بخش زیبایی
          </h2>
          <Reveal>
            <DepartmentContactBox department="beauty" />
          </Reveal>
        </Container>
      </section>
    </>
  );
}
