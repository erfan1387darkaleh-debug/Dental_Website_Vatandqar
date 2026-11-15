import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ValueCard } from "@/components/value-card";
import { CtaBanner } from "@/components/cta-banner";
import { Reveal } from "@/components/reveal";
import { Container } from "@/components/container";
import { ToothIcon } from "@/components/tooth-icon";
import { CLINIC_VALUES, VISIT_STEPS } from "@/data/about";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "درباره ما",
  description: `آشنایی با ${SITE.name}؛ فلسفه ما در مراقبت از سلامت دهان و دندان، اولویت‌هایمان و مسیر مراجعه شما به شعبه‌های دندانپزشکی.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="درباره ما"
        title={`درباره ${SITE.name}`}
        description="ما اینجا برای مراقبت از سلامت دهان و دندان شما هستیم؛ با رویکردی که در آن، شناخت دقیق نیاز شما قبل از هر درمانی قرار دارد."
      />

      {/* معرفی و فلسفه دندانپزشکی */}
      <section aria-labelledby="philosophy-heading">
        <Container className="py-16 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2
                id="philosophy-heading"
                className="text-2xl font-extrabold text-heading sm:text-3xl"
              >
                فلسفه ما: اول سلامت، با احترام به راحتی شما
              </h2>
              <p className="mt-5 text-base leading-9 text-muted">
                در شعبه‌های ما باور داریم درمان خوب از یک معاینه دقیق و
                گفت‌وگوی صادقانه شروع می‌شود. قبل از هر اقدامی، وضعیت دهان و
                دندان شما را کامل بررسی می‌کنیم و همه یافته‌ها و گزینه‌های
                درمان را به زبان ساده توضیح می‌دهیم؛ تا تصمیم نهایی همیشه با
                شما باشد.
              </p>
              <p className="mt-4 text-base leading-9 text-muted">
                می‌دانیم که تجربه مراجعه به دندانپزشک، برای خیلی‌ها ساده نیست.
                برای همین سعی می‌کنیم فضایی آرام، بهداشتی و بدون عجله بسازیم؛
                جایی که وقت کافی برای پاسخ به سؤال‌ها و حوصله برای انجام دقیق
                کار وجود دارد.
              </p>
              <p className="mt-4 text-base leading-9 text-muted">
                هدف ما ساختن ارتباطی بلندمدت و مبتنی بر اعتماد با شماست؛
                ارتباطی که در آن، سلامت دهان و دندانتان در مسیر درستی قرار
                بگیرد و هر مراجعه، تجربه‌ای راحت و بدون دغدغه باشد.
              </p>
            </div>

            {/* پنل تصویری — هم‌سبک کارت هیرو: قاب شیشه‌ای، قرص تیرهٔ گرادیان و
                گلیف دندان سفید با درخشش‌های رنگی؛ هالهٔ پشت قاب عمداً بسیار
                ملایم است تا ظاهر مینیمال بماند */}
            <div className="relative mx-auto w-full max-w-md">
              <div
                aria-hidden="true"
                className="absolute -inset-3 rounded-[2.75rem] bg-linear-to-l from-primary-200/25 via-sky-200/20 to-indigo-200/15 blur-lg sm:-inset-4 dark:from-primary-800/10 dark:via-sky-800/10 dark:to-indigo-800/10"
              />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-surface/70 shadow-soft backdrop-blur-xl dark:border-white/10">
                <div className="flex aspect-4/3 flex-col items-center justify-center gap-6 bg-linear-to-b from-tint via-surface to-indigo-100/20 p-8 text-center dark:from-primary-950/70 dark:via-primary-950/40 dark:to-indigo-950/20">
                  {/* نشان مرکزی: حلقهٔ روشن + قرص تیرهٔ گرادیان + دندان و درخشش */}
                  <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-surface p-2.5 ring-1 ring-primary-100/80 shadow-soft sm:h-48 sm:w-48 sm:p-3 dark:bg-slate-900/90 dark:ring-white/10">
                    <div className="relative flex h-full w-full items-center justify-center rounded-full bg-linear-to-b from-slate-800 via-slate-900 to-primary-950 ring-1 ring-white/10">
                      <ToothIcon
                        className="h-16 w-16 text-white sm:h-20 sm:w-20"
                        aria-hidden="true"
                      />
                      <Sparkles
                        className="absolute right-6 top-6 h-5 w-5 text-primary-300 sm:right-8 sm:top-8 sm:h-6 sm:w-6"
                        aria-hidden="true"
                      />
                      <Sparkles
                        className="absolute bottom-7 left-7 h-3.5 w-3.5 text-sky-300 sm:bottom-9 sm:left-9 sm:h-4 sm:w-4"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <p className="max-w-xs text-sm font-semibold leading-7 text-heading dark:text-primary-200">
                    «راحتی شما در اولویت، سلامت لبخندتان در مرکز توجه»
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ارزش‌های دندانپزشکی */}
      <section
        aria-labelledby="values-heading"
        className="border-y border-line bg-surface-2"
      >
        <Container className="py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold text-accent">ارزش‌های ما</p>
            <h2
              id="values-heading"
              className="mt-2 text-2xl font-extrabold text-heading sm:text-3xl"
            >
              چهار اصلی که به آن پایبندیم
            </h2>
            <p className="mt-3 text-base leading-8 text-muted">
              این چهار اصل، چارچوب برخورد و کار ما با هر بیمار است.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {CLINIC_VALUES.map((value, index) => (
              <Reveal key={value.title} delay={index * 70} className="h-full">
                <ValueCard value={value} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* مسیر مراجعه بیمار */}
      <section aria-labelledby="steps-heading">
        <Container className="py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold text-accent">مسیر مراجعه</p>
            <h2
              id="steps-heading"
              className="mt-2 text-2xl font-extrabold text-heading sm:text-3xl"
            >
              از تماس اول تا پایان درمان
            </h2>
            <p className="mt-3 text-base leading-8 text-muted">
              مراجعه‌تان در سه گام ساده و شفاف پیش می‌رود.
            </p>
          </div>

          <ol className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-5">
            {VISIT_STEPS.map((step, index) => (
              <Reveal key={step.step} delay={index * 70} className="h-full">
                <li className="flex h-full flex-col rounded-2xl border border-line-strong bg-surface p-6 transition-colors duration-300 hover:border-primary-200 dark:hover:border-primary-800">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-tint text-lg font-extrabold text-accent">
                    {step.step}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-heading">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    {step.description}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
