import Link from "next/link";
import {
  CalendarCheck,
  MapPin,
  MessagesSquare,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { BRANCHES, SITE, TELEGRAM_URL } from "@/lib/site-config";
import { btnBeauty, btnGradient, btnProducts, btnSecondary } from "@/lib/styles";
import { ToothLogo } from "@/components/tooth-logo";
import { ToothIcon } from "@/components/tooth-icon";
import { Container } from "@/components/container";

/** رنگ کاشی آیکون هر نشان — سه رنگ برند (سبزآبی، آبی آسمانی، نیلی) */
const CHIP_TONE_CLASSES = {
  primary: "bg-tint text-accent",
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400",
  indigo:
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400",
} as const;

/** نشان شیشه‌ای هیرو — آیکون در کاشی رنگی + متن کوتاه؛ ظاهر یکدست همه نشان‌ها */
function HeroChip({
  icon: Icon,
  tone,
  children,
}: {
  icon: LucideIcon;
  tone: keyof typeof CHIP_TONE_CLASSES;
  children: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-white/60 bg-surface/80 px-2 py-1.5 shadow-soft backdrop-blur-xl dark:border-white/10 sm:gap-2 sm:rounded-2xl sm:px-3 sm:py-2">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md sm:h-7 sm:w-7 sm:rounded-lg ${CHIP_TONE_CLASSES[tone]}`}
      >
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
      </span>
      <span className="whitespace-nowrap text-[10px] font-semibold leading-4 text-heading sm:text-[11px] sm:leading-5">
        {children}
      </span>
    </div>
  );
}

/** بخش هیرو صفحه اصلی — لبخند درخشان، دندانپزشکی مدرن و آرام + نوبت آنلاین */
export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-canvas"
    >
      {/* هاله‌های شعاعی بسیار ملایم برند — عمقِ حداقلی، عمداً کم‌رنگ */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-48 h-[20rem] w-[20rem] rounded-full bg-primary-200/20 blur-3xl dark:bg-primary-800/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-52 -right-32 h-80 w-80 rounded-full bg-sky-200/20 blur-3xl dark:bg-sky-800/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-1/4 top-1/4 h-60 w-60 rounded-full bg-indigo-200/15 blur-3xl dark:bg-indigo-800/10"
      />

      <Container className="relative py-12 sm:py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* متن معرفی */}
          <div className="animate-fade-up text-center lg:text-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-line-strong/60 bg-surface/70 px-4 py-1.5 text-xs font-bold text-primary-800 shadow-sm backdrop-blur-xl dark:border-white/10 dark:text-primary-200">
              <ToothLogo className="h-3.5 w-3.5" />
              {SITE.shortName}
            </span>
            <h1
              id="hero-heading"
              className="mt-5 text-3xl font-extrabold leading-[1.4] text-heading sm:text-4xl lg:text-[2.75rem] lg:leading-[1.35]"
            >
              لبخندی درخشان و بی‌نقص{" "}
              <span className="bg-linear-to-l from-primary-600 via-sky-500 to-indigo-500 bg-clip-text text-transparent dark:from-primary-300 dark:via-sky-400 dark:to-indigo-400">
                حق شماست
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-muted sm:text-lg sm:leading-9 lg:mx-0">
              تجربهٔ دندانپزشکی مدرن و دیجیتال، آرام و بدون درد — با توضیح شفاف
              پیش از هر مرحله و رعایت کامل اصول بهداشتی، در فضایی که راحتی شما
              اولویت است.
            </p>

            {/* فراخوان اصلی: نوبت آنلاین + خدمات زیبایی + محصولات + مشاوره تلگرام */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href="/booking" className={btnGradient}>
                <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                رزرو نوبت آنلاین
              </Link>
              <Link
                href="/beauty"
                target="_blank"
                rel="noopener noreferrer"
                className={btnBeauty}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                خدمات زیبایی بدن
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold leading-5">
                  جدید
                </span>
              </Link>
              <Link
                href="/products"
                target="_blank"
                rel="noopener noreferrer"
                className={btnProducts}
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                محصولات وطندار
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold leading-5">
                  جدید
                </span>
              </Link>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={btnSecondary}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                مشاوره در تلگرام
              </a>
            </div>

            {/* حضور دو شعبه در مشهد — با دادهٔ بخش شعبه‌ها */}
            <p className="mt-7 flex flex-wrap items-center justify-center gap-2 text-sm text-subtle lg:justify-start">
              <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
              {`دو شعبه در مشهد؛ ${BRANCHES.map((branch) => branch.area).join(" و ")}`}
            </p>
          </div>

          {/* تصویرسازی معرفی — قاب شیشه‌ای با نشان دندان و درخشش */}
          <div className="animate-fade-up [animation-delay:150ms]">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* هاله بسیار ملایم پشت قاب — سایه‌رنگِ حداقلی، بدون درخشش */}
              <div
                aria-hidden="true"
                className="absolute -inset-3 rounded-[2.75rem] bg-linear-to-l from-primary-200/25 via-sky-200/20 to-indigo-200/15 blur-lg sm:-inset-4 dark:from-primary-800/10 dark:via-sky-800/10 dark:to-indigo-800/10"
              />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-surface/70 shadow-soft backdrop-blur-xl dark:border-white/10">
                {/* ناحیهٔ تصویر — در موبایل مربع است تا جا برای نشان‌های شناور
                    کافی باشد؛ نشان‌ها در گوشه‌ها لنگر شده‌اند و فاصله‌شان از
                    لبهٔ دایرهٔ مرکزی با دامنهٔ ۸ پیکسلی انیمیشن شناوری محاسبه
                    شده است */}
                <div className="flex aspect-square items-center justify-center bg-linear-to-b from-tint via-surface to-indigo-100/20 p-6 dark:from-primary-950/70 dark:via-primary-950/40 dark:to-indigo-950/20 sm:aspect-4/3 sm:p-8">
                  {/* نشان مرکزی: حلقهٔ روشن + قرص تیرهٔ گرادیان + دندان و درخشش */}
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-surface p-2 ring-1 ring-primary-100/80 shadow-soft sm:h-40 sm:w-40 sm:p-2.5 lg:h-44 lg:w-44 dark:bg-slate-900/90 dark:ring-white/10">
                    <div className="relative flex h-full w-full items-center justify-center rounded-full bg-linear-to-b from-slate-800 via-slate-900 to-primary-950 ring-1 ring-white/10">
                      <ToothIcon
                        className="h-12 w-12 text-white sm:h-16 sm:w-16 lg:h-18 lg:w-18"
                        aria-hidden="true"
                      />
                      <Sparkles
                        className="absolute right-4.5 top-4.5 h-4 w-4 text-primary-300 sm:right-7 sm:top-7 sm:h-5 sm:w-5 lg:right-8 lg:top-8 lg:h-6 lg:w-6"
                        aria-hidden="true"
                      />
                      <Sparkles
                        className="absolute bottom-5 left-5 h-3 w-3 text-sky-300 sm:bottom-8 sm:left-8 sm:h-3.5 sm:w-3.5 lg:bottom-9 lg:left-9 lg:h-4 lg:w-4"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>

                {/* نشان‌های شناور — یکی بالا-راست و دو نشان چیده‌شده در سمت چپ
                    (بالا و پایین)؛ هر جلد موقعیت‌دهی جدا از انیمیشن شناوری
                    دارد تا transformها تداخل نکنند. در عرض‌های زیر ۳۶۰px نشان
                    راست مخفی می‌شود تا با نشان چپ هم‌پوشان نشود. */}
                <div className="absolute right-3 top-3 hidden min-[360px]:block sm:right-5 sm:top-4">
                  <div className="animate-float">
                    <HeroChip icon={ShieldCheck} tone="primary">
                      تضمین استریلیزاسیون
                    </HeroChip>
                  </div>
                </div>
                <div className="absolute left-3 top-3 sm:left-5 sm:top-4">
                  <div className="animate-float [animation-delay:2.5s]">
                    <HeroChip icon={MessagesSquare} tone="sky">
                      توضیح شفاف پیش از درمان
                    </HeroChip>
                  </div>
                </div>
                <div className="absolute left-3 bottom-3 sm:left-5 sm:bottom-4">
                  <div className="animate-float [animation-delay:4.5s]">
                    <HeroChip icon={CalendarCheck} tone="indigo">
                      رزرو آنلاین، بدون تماس
                    </HeroChip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
