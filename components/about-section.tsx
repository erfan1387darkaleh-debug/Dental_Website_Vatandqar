import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { CLINIC_VALUES } from "@/data/about";
import { btnTextLink } from "@/lib/styles";
import { ValueCard } from "@/components/value-card";
import { ToothIcon } from "@/components/tooth-icon";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { Container } from "@/components/container";

/** پیش‌نمایش «درباره ما» در صفحه اصلی */
export function AboutSection() {
  return (
    <section aria-labelledby="about-preview-heading">
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              id="about-preview-heading"
              align="start"
              eyebrow="درباره ما"
              title="فضایی آرام برای مراقبت با حوصله"
            />
            <p className="mt-4 text-base leading-8 text-muted">
              خدمات دندانپزشکی ما با دو شعبه در مشهد و تمرکز بر سلامت دهان و
              دندان بیماران فعالیت می‌کند؛ جایی که پیش از هر درمان، زمان کافی
              برای شناخت شرایط شما می‌گذاریم و همه گزینه‌ها را به زبان ساده
              توضیح می‌دهیم.
            </p>
            <p className="mt-4 text-base leading-8 text-muted">
              ما معتقدیم مراجعه به دندانپزشک نباید تجربه‌ای استرس‌زا باشد؛
              برای همین، از برخورد اولیه تا پایان درمان، راحتی و آرامش شما
              برایمان مهم است.
            </p>
            <Link href="/about" className={`${btnTextLink} mt-6`}>
              بیشتر درباره ما بدانید
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {/* کارت تصویری — هم‌سبک کارت هیرو: قاب شیشه‌ای، قرص تیرهٔ گرادیان و
              گلیف دندان سفید با درخشش‌های رنگی؛ هالهٔ پشت قاب عمداً بسیار
              ملایم است تا ظاهر مینیمال بماند */}
          <Reveal>
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
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
          </Reveal>
        </div>

        {/* ارزش‌های دندانپزشکی — چهار اصل در کارت‌های کوچک، زیر معرفی دو ستونه */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-12 lg:grid-cols-4">
          {CLINIC_VALUES.map((value, index) => (
            <Reveal key={value.title} delay={index * 70} className="h-full">
              <ValueCard value={value} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
