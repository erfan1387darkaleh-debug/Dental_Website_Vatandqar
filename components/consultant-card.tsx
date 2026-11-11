import { Phone } from "lucide-react";
import { toPersianDigits, type Consultant } from "@/lib/site-config";
import { btnPrimary } from "@/lib/styles";

type ConsultantCardProps = {
  consultant: Consultant;
  /** جایگاه مشاور در فهرست (از صفر) — برای برچسب «مشاور ۱» و غیره */
  index: number;
};

/** کارت نمایش یک مشاور — برچسب، نام خانوادگی، شماره تماس و دکمه تماس */
export function ConsultantCard({ consultant, index }: ConsultantCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line-strong bg-surface p-6 transition duration-300 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-900/5 dark:hover:border-primary-800">
      {/* سربرگ کارت: نام خانوادگی مشاور و برچسب شماره مشاور */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-lg font-extrabold text-heading">
          {consultant.name}
        </h3>
        <span className="inline-flex shrink-0 items-center rounded-full bg-tint px-3 py-1.5 text-xs font-bold text-primary-800 dark:text-primary-200">
          {`مشاور ${toPersianDigits(String(index + 1))}`}
        </span>
      </div>

      {/* شماره تماس — لینک قابل لمس روی موبایل */}
      <a
        href={consultant.telHref}
        aria-label={`تماس با مشاور ${consultant.name}`}
        className="mt-4 flex items-center gap-3 rounded-lg text-sm font-extrabold text-heading transition-colors duration-200 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-tint text-accent">
          <Phone className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        {consultant.displayPhone}
      </a>

      {/* دکمه تماس */}
      <a
        href={consultant.telHref}
        aria-label={`تماس با مشاور ${consultant.name}`}
        className={`${btnPrimary} mt-6 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300`}
      >
        <Phone className="h-4 w-4" aria-hidden="true" />
        تماس با مشاور
      </a>
    </article>
  );
}
