import { Clock, MapPin, Phone } from "lucide-react";
import { InstagramIcon } from "@/components/instagram-icon";
import { TelegramIcon } from "@/components/telegram-icon";
import { RubikaIcon } from "@/components/rubika-icon";
import { ConsultantCard } from "@/components/consultant-card";
import { DepartmentContactBox } from "@/components/department-contact";
import {
  BRANCHES,
  CONSULTANTS,
  INSTAGRAM_USERNAME,
  INSTAGRAM_URL,
  RUBIKA_USERNAME,
  RUBIKA_URL,
  TELEGRAM_USERNAME,
  TELEGRAM_URL,
  formatHourPeriod,
  toPersianDigits,
} from "@/lib/site-config";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { Container } from "@/components/container";

/**
 * بخش یکپارچهٔ «تماس و مشاوره» — هم اطلاعات تماس دو شعبه و شبکه‌های
 * اجتماعی و هم معرفی مشاوران و تماس مستقیم با آن‌ها؛ جایگزین دو بخش
 * جداگانهٔ «تماس با ما» و «مشاوره دندانپزشکی» برای منوی تمیزتر.
 */
export function ContactSection() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="scroll-mt-20"
    >
      <Container className="py-16 sm:py-20 lg:py-24">
        <SectionHeading
          id="contact-heading"
          eyebrow="تماس و مشاوره"
          title="راه‌های ارتباط و مشاوره"
          description="برای هماهنگی نوبت، مشاورهٔ دندانپزشکی یا هر پرسش دیگری، با شعبه موردنظرتان تماس بگیرید، با یکی از مشاوران ما صحبت کنید یا از شبکه‌های اجتماعی در ارتباط باشید."
        />

        {/* جعبهٔ مشاورهٔ دندانپزشکی — تلگرام و تماس مستقیم، سرِ دست */}
        <Reveal className="mt-10 lg:mt-12">
          <DepartmentContactBox department="dental" />
        </Reveal>

        <Reveal className="mt-6 sm:mt-8">
          <div className="rounded-3xl bg-primary-900 px-6 py-10 sm:px-10 sm:py-12 dark:bg-primary-950 dark:ring-1 dark:ring-white/10">
            {/* معرفی کوتاه */}
            <div className="text-center">
              <h3 className="text-xl font-extrabold text-white">
                خوشحال می‌شویم صدایتان را بشنویم
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-8 text-primary-100/90">
                سامانه نوبت‌دهی آنلاین هنوز فعال نیست؛ برای هماهنگی نوبت، تماس
                تلفنی با شعبه موردنظر سریع‌ترین راه است. پاسخ‌گویی در ساعات
                کاری انجام می‌شود.
              </p>
            </div>

            {/* دو شعبه — هر شعبه با نشانی، ساعات کاری و دکمه تماس */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {BRANCHES.map((branch) => (
                <div
                  key={branch.id}
                  className="flex h-full flex-col rounded-2xl bg-white/10 p-6 ring-1 ring-white/10"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-lg font-extrabold text-white">
                      {`شعبه ${branch.name}`}
                    </p>
                    <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-primary-100">
                      {branch.area}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-3.5">
                    <li className="flex items-start gap-2.5">
                      <MapPin
                        className="mt-1 h-4 w-4 shrink-0 text-primary-200"
                        aria-hidden="true"
                      />
                      <p className="text-sm leading-7 text-white">
                        {branch.address}
                      </p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Clock
                        className="mt-1 h-4 w-4 shrink-0 text-primary-200"
                        aria-hidden="true"
                      />
                      <p className="text-sm leading-7 text-white">
                        {branch.openingHours.map((entry) => (
                          <span key={entry.days} className="block">
                            <span className="font-semibold">
                              {`${entry.days}:`}
                            </span>{" "}
                            {entry.periods.length > 0
                              ? entry.periods
                                  .map((period) => formatHourPeriod(period))
                                  .join(" و ")
                              : "تعطیل"}
                          </span>
                        ))}
                      </p>
                    </li>
                  </ul>

                  {/* فاصله‌گذار انعطاف‌پذیر؛ دکمه تماس همیشه به لبهٔ پایین کارت می‌چسبد */}
                  <div className="flex-1" aria-hidden="true" />

                  <a
                    href={branch.telHref}
                    aria-label={`تماس با ${branch.descriptor}`}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-white px-6 py-3.5 text-sm font-extrabold text-primary-900 shadow-sm transition-colors duration-200 hover:bg-primary-50"
                  >
                    <Phone className="h-5 w-5" aria-hidden="true" />
                    <span dir="ltr" className="font-extrabold">
                      {toPersianDigits(branch.displayPhone)}
                    </span>
                  </a>
                </div>
              ))}
            </div>

            {/* شبکه‌های اجتماعی — متعلق به کل کسب‌وکار */}
            <div className="mt-8 border-t border-white/15 pt-8">
              <p className="text-center text-xs font-medium text-primary-200">
                ما را در شبکه‌های اجتماعی دنبال کنید
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/30 px-4 py-4 text-sm font-bold text-white transition-colors duration-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <InstagramIcon className="h-5 w-5" aria-hidden="true" />
                    اینستاگرام
                  </span>
                  <span
                    dir="ltr"
                    className="text-[11px] font-medium text-white/70"
                  >
                    {`@${INSTAGRAM_USERNAME}`}
                  </span>
                </a>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/30 px-4 py-4 text-sm font-bold text-white transition-colors duration-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <TelegramIcon className="h-5 w-5" aria-hidden="true" />
                    تلگرام
                  </span>
                  <span
                    dir="ltr"
                    className="text-[11px] font-medium text-white/70"
                  >
                    {`@${TELEGRAM_USERNAME}`}
                  </span>
                </a>
                <a
                  href={RUBIKA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/30 px-4 py-4 text-sm font-bold text-white transition-colors duration-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <RubikaIcon className="h-5 w-5" aria-hidden="true" />
                    روبیکا
                  </span>
                  <span
                    dir="ltr"
                    className="text-[11px] font-medium text-white/70"
                  >
                    {`@${RUBIKA_USERNAME}`}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </Reveal>

        {/* مشاوره دندانپزشکی — معرفی مشاوران و تماس مستقیم تلفنی */}
        <div className="mt-14 text-center">
          <h3 className="text-xl font-extrabold text-heading sm:text-2xl">
            مشاوره دندانپزشکی
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-8 text-muted">
            برای مشاوره و پاسخ به پرسش‌های خود، مستقیماً با یکی از مشاوران زیر
            تماس بگیرید.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {CONSULTANTS.map((consultant, index) => (
            <Reveal key={consultant.name} delay={index * 80} className="h-full">
              <ConsultantCard consultant={consultant} index={index} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
