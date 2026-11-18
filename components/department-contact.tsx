import { Phone, Send, ShoppingBag, Sparkles } from "lucide-react";
import {
  DEPARTMENT_CONTACTS,
  toPersianDigits,
  type DepartmentKey,
} from "@/lib/site-config";
import { btnBeauty, btnGradient, btnProducts } from "@/lib/styles";
import { ToothIcon } from "@/components/tooth-icon";

/** رنگ و دکمهٔ اختصاصی هر بخش — دندانپزشکی سبزآبی، زیبایی رز، محصولات کهربایی.
 *  هدر اختصاصی هر بخش (components/department-header.tsx) هم از این جدول
 *  استفاده می‌کند تا رنگ برند هر حوزه در کل سایت یکدست بماند. */
export const DEPT_STYLES = {
  dental: {
    tile: "bg-linear-to-bl from-primary-600 to-accent-2",
    btn: btnGradient,
    call: "border-primary-200 text-primary-800 hover:bg-tint dark:border-primary-800 dark:text-primary-200 dark:hover:bg-primary-900/40",
  },
  beauty: {
    tile: "bg-linear-to-bl from-rose-500 to-purple-600",
    btn: btnBeauty,
    call: "border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-800/60 dark:text-rose-300 dark:hover:bg-rose-950/40",
  },
  products: {
    tile: "bg-linear-to-bl from-amber-500 to-orange-600",
    btn: btnProducts,
    call: "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800/60 dark:text-amber-300 dark:hover:bg-amber-950/40",
  },
} as const;

/** آیکون اختصاصی هر بخش — دندان، درخشش و سبد خرید */
function DeptGlyph({ department }: { department: DepartmentKey }) {
  if (department === "beauty") {
    return <Sparkles className="h-6 w-6" aria-hidden="true" />;
  }
  if (department === "products") {
    return <ShoppingBag className="h-6 w-6" aria-hidden="true" />;
  }
  return <ToothIcon className="h-6 w-6" aria-hidden="true" />;
}

type DepartmentContactBoxProps = {
  department: DepartmentKey;
  className?: string;
};

/**
 * جعبهٔ مشاورهٔ اختصاصی هر بخش — با کانال تماس همان حوزه (از
 * DEPARTMENT_CONTACTS در site-config) و دو راه ارتباطی: تلگرام و
 * تماس تلفنی. ظاهر هر بخش با رنگ اختصاصی همان حوزه متمایز می‌شود.
 */
export function DepartmentContactBox({
  department,
  className = "",
}: DepartmentContactBoxProps) {
  const dept = DEPARTMENT_CONTACTS[department];
  const style = DEPT_STYLES[department];

  return (
    <div
      className={`rounded-3xl border border-line-strong bg-surface/70 p-6 shadow-soft backdrop-blur-xl sm:p-8 dark:border-white/10 ${className}`}
    >
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-start">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <span
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${style.tile}`}
          >
            <DeptGlyph department={department} />
          </span>
          <div>
            <h3 className="text-lg font-extrabold text-heading sm:text-xl">
              {dept.title}
            </h3>
            <p className="mt-1 text-sm leading-7 text-muted">
              {dept.description}
            </p>
          </div>
        </div>

        {/* دو راه ارتباطی: تلگرام + تماس تلفنی مستقیم */}
        <div className="flex w-full flex-col items-stretch gap-2.5 sm:w-auto sm:flex-row sm:items-center">
          <a
            href={dept.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${style.btn} px-5 py-2.5`}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            مشاوره در تلگرام
          </a>
          <a
            href={dept.phoneHref}
            aria-label={`تماس تلفنی — ${dept.title}`}
            className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${style.call}`}
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span dir="ltr">{toPersianDigits(dept.phoneDisplay)}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
