import Link from "next/link";
import { InstagramIcon } from "@/components/instagram-icon";
import { TelegramIcon } from "@/components/telegram-icon";
import { RubikaIcon } from "@/components/rubika-icon";
import { PersianYear } from "@/components/persian-year";
import { MapPin, Phone } from "lucide-react";
import {
  BRANCHES,
  INSTAGRAM_URL,
  NAV_LINKS,
  RUBIKA_URL,
  SITE,
  TELEGRAM_URL,
  toPersianDigits,
} from "@/lib/site-config";
import { services } from "@/data/services";
import { ToothLogo } from "./tooth-logo";
import { Container } from "./container";

/** فوتر سایت — اطلاعات دندانپزشکی، دسترسی سریع و شبکه‌های اجتماعی */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-canvas">
      <Container className="py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* برند و معرفی کوتاه */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
              aria-label={SITE.name}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-700 text-white">
                <ToothLogo className="h-6 w-6" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-base font-extrabold text-heading">
                  {SITE.shortName}
                </span>
                <span className="text-[11px] font-medium text-subtle">
                  {SITE.subtitle}
                </span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-7 text-muted">
              {SITE.tagline}. در فضایی آرام و بهداشتی، برای شما و خانواده‌تان
              کناریم.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="اینستاگرام بازرگانی وطندار"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line-strong transition-colors duration-200 hover:border-primary-300 hover:bg-surface-2 dark:hover:border-primary-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
              >
                <InstagramIcon className="h-4.5 w-4.5" aria-hidden="true" />
              </a>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="تلگرام بازرگانی وطندار"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line-strong transition-colors duration-200 hover:border-primary-300 hover:bg-surface-2 dark:hover:border-primary-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
              >
                <TelegramIcon className="h-4.5 w-4.5" aria-hidden="true" />
              </a>
              <a
                href={RUBIKA_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="روبیکا بازرگانی وطندار"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line-strong transition-colors duration-200 hover:border-primary-300 hover:bg-surface-2 dark:hover:border-primary-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
              >
                <RubikaIcon className="h-4.5 w-4.5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* دسترسی سریع */}
          <nav aria-label="دسترسی سریع">
            <h2 className="text-sm font-bold text-heading">دسترسی سریع</h2>
            <ul className="mt-4 space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors duration-200 hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* خدمات */}
          <nav aria-label="فهرست خدمات">
            <h2 className="text-sm font-bold text-heading">خدمات</h2>
            <ul className="mt-4 space-y-2.5">
              {services.slice(0, 5).map((service) => (
                <li key={service.id}>
                  <Link
                    href="/services"
                    className="text-sm text-muted transition-colors duration-200 hover:text-accent"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/services"
                  className="text-sm font-medium text-accent transition-colors duration-200 hover:text-accent-strong"
                >
                  مشاهده همه خدمات...
                </Link>
              </li>
            </ul>
          </nav>

          {/* اطلاعات تماس شعبه‌ها */}
          <div>
            <h2 className="text-sm font-bold text-heading">شعبه‌ها</h2>
            <ul className="mt-4 space-y-5">
              {BRANCHES.map((branch) => (
                <li key={branch.id}>
                  <p className="flex items-center gap-2 text-sm font-semibold text-heading">
                    <MapPin
                      className="h-4 w-4 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    {`شعبه ${branch.name}`}
                    <span className="font-medium text-subtle">
                      {`— ${branch.area}`}
                    </span>
                  </p>
                  <a
                    href={branch.telHref}
                    dir="ltr"
                    aria-label={`تماس با ${branch.descriptor}`}
                    className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors duration-200 hover:text-accent"
                  >
                    <Phone
                      className="h-4 w-4 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    {toPersianDigits(branch.displayPhone)}
                  </a>
                  <p className="mt-1.5 text-sm leading-6 text-muted">
                    {branch.address}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* نوار پایانی */}
        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-line pt-6 text-center text-xs text-subtle sm:flex-row sm:text-start">
          <p>© <PersianYear /> {SITE.name} — تمامی حقوق محفوظ است.</p>
          <p>مراقبت از لبخند شما، افتخار ماست.</p>
        </div>
      </Container>
    </footer>
  );
}
