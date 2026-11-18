import Link from "next/link";
import { CalendarCheck, Clock, MapPin, Phone } from "lucide-react";
import {
  formatHourPeriod,
  toPersianDigits,
  type Branch,
} from "@/lib/site-config";
import { btnPrimary, btnSecondary } from "@/lib/styles";

type BranchCardProps = {
  branch: Branch;
};

/** کارت نمایش یک شعبه — نام، منطقه، نشانی، تلفن، ساعات کاری و دکمه تماس */
export function BranchCard({ branch }: BranchCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line-strong bg-surface-2/85 p-6 backdrop-blur-md transition duration-300 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-900/5 dark:hover:border-primary-800 sm:grid sm:row-span-5 sm:grid-rows-subgrid">
      {/* سربرگ کارت: نام شعبه و برچسب منطقه */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-heading">
            {`شعبه ${branch.name}`}
          </h3>
          <p className="mt-1 text-xs font-medium text-subtle">
            {branch.descriptor}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-tint px-3 py-1.5 text-xs font-bold text-primary-800 dark:text-primary-200">
          {branch.area}
        </span>
      </div>

      {/* نشانی — در حالت دو ستونه، این ردیف یکی از ردیف‌های اشتراکی
          grid است و مرزش در دو کارت هم‌تراز می‌ماند؛ متن بلندتر
          طبیعی می‌شکند و ارتفاع ردیف از بلندترین محتوا گرفته می‌شود */}
      <div className="mt-5 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-tint text-accent">
          <MapPin className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <p className="min-w-0 text-sm leading-7 text-muted">
          {branch.address}
        </p>
      </div>

      {/* تلفن — لینک قابل لمس روی موبایل */}
      <a
        href={branch.telHref}
        dir="ltr"
        aria-label={`تماس با ${branch.descriptor}`}
        className="mt-4 flex items-center gap-3 rounded-lg text-sm font-extrabold text-heading transition-colors duration-200 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-tint text-accent">
          <Phone className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        {toPersianDigits(branch.displayPhone)}
      </a>

      {/* ساعات کاری — این ردیف هم یکی از ردیف‌های اشتراکی grid است؛
          مرزش در دو کارت هم‌تراز می‌ماند هرچند تعداد بازه‌های
          زمانی دو شعبه متفاوت باشد */}
      <div className="mt-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-tint text-accent">
          <Clock className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <dl className="min-w-0 text-sm leading-7 text-muted">
          {branch.openingHours.map((entry) => (
            <div key={entry.days} className="flex items-baseline gap-2">
              <dt className="shrink-0 font-semibold text-heading">
                {`${entry.days}:`}
              </dt>
              <dd className="min-w-0">
                {entry.periods.length > 0 ? (
                  entry.periods.map((period) => (
                    <span key={period.opens} className="block">
                      {formatHourPeriod(period)}
                    </span>
                  ))
                ) : (
                  <span className="text-subtle">تعطیل</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* دکمه‌های اقدام — در حالت دو ستونه در آخرین ردیف اشتراکی grid
          قرار می‌گیرند؛ لبهٔ بالا و پایین دکمه‌ها در دو کارت هم‌تراز می‌ماند */}
      <div className="mt-6 grid gap-2">
        <Link
          href={`/booking?branch=${branch.id}`}
          aria-label={`رزرو نوبت آنلاین در شعبه ${branch.name}`}
          className={btnSecondary}
        >
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          رزرو نوبت آنلاین
        </Link>
        <a
          href={branch.telHref}
          aria-label={`تماس با ${branch.descriptor}`}
          className={btnPrimary}
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          {`تماس با شعبه ${branch.name}`}
        </a>
      </div>
    </article>
  );
}
