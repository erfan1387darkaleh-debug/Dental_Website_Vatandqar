"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatJalaliDay,
  formatJalaliMonthYear,
  jalaliMonthRange,
  nextJalaliMonth,
  previousJalaliMonth,
} from "@/lib/booking/jalali";
import { addDays, weekdayIndex, type TehranDate } from "@/lib/booking/time";

type JalaliMonthGridProps = {
  /** هر روزِ تقویمی از ماهی که باید نمایش داده شود */
  anchor: TehranDate;
  onAnchorChange(anchor: TehranDate): void;
  /** روز انتخاب‌شده (هایلایت) */
  selected: TehranDate | null;
  onSelectDate(date: TehranDate): void;
  /** آیا ناوبری به ماه قبل مجاز است؟ */
  canGoPreviousMonth: boolean;
  /** آیا ناوبری به ماه بعد مجاز است؟ */
  canGoNextMonth: boolean;
  /** تصمیم غیرفعال‌شدن هر روز (گذشته، تعطیلی، بیرون افق و…) */
  isDateDisabled(date: TehranDate): boolean;
  /** برچسب کمکی زیر شمارهٔ روز؛ مثل «امروز» یا «تعطیل» */
  dateMeta?(date: TehranDate): string | null;
};

const WEEKDAY_LABELS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];
const BLANK_CELLS = ["", "", "", "", "", ""];

/**
 * تقویم ماه جلالی (شمسی) در شبکهٔ هفتگی ۷ روزه.
 * نام‌ها به‌صورت خودکار از تقویم پارسی (Intl) خوانده می‌شوند؛ بدون
 * محاسبهٔ دستی سال کبیسه. این مؤلفه در درگاه عمومی و پنل پذیرش
 * یکسان استفاده می‌شود.
 */
export function JalaliMonthGrid({
  anchor,
  onAnchorChange,
  selected,
  onSelectDate,
  canGoPreviousMonth,
  canGoNextMonth,
  isDateDisabled,
  dateMeta,
}: JalaliMonthGridProps) {
  const { first, last } = jalaliMonthRange(anchor);
  const leadingBlanks = weekdayIndex(first);
  const days: TehranDate[] = [];
  for (let cursor = first; ; cursor = addDays(cursor, 1)) {
    days.push(cursor);
    if (cursor === last) break;
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-3 sm:p-4">
      {/* سرفصل ماه با دکمه‌های پیمایش */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onAnchorChange(previousJalaliMonth(anchor))}
          disabled={!canGoPreviousMonth}
          aria-label="ماه قبل"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-heading transition-colors duration-200 hover:bg-tint disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
        <p className="text-sm font-extrabold text-heading sm:text-base">
          {formatJalaliMonthYear(anchor)}
        </p>
        <button
          type="button"
          onClick={() => onAnchorChange(nextJalaliMonth(anchor))}
          disabled={!canGoNextMonth}
          aria-label="ماه بعد"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-heading transition-colors duration-200 hover:bg-tint disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* سطر نام روزهای هفته */}
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-subtle sm:text-xs">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="py-1">
            {label}
          </span>
        ))}
      </div>

      {/* خانه‌های روزهای ماه */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {BLANK_CELLS.slice(0, leadingBlanks).map((_, index) => (
          <span key={`blank-${index}`} aria-hidden="true" />
        ))}
        {days.map((date) => {
          const disabled = isDateDisabled(date);
          const isSelected = date === selected;
          const meta = dateMeta?.(date) ?? null;
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              disabled={disabled}
              aria-pressed={isSelected}
              aria-label={`${meta ? `${meta}، ` : ""}انتخاب روز ${formatJalaliDay(date)}`}
              className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-sm font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300 ${
                isSelected
                  ? "bg-primary-700 text-white dark:bg-primary-600"
                  : disabled
                    ? "cursor-not-allowed text-subtle opacity-50"
                    : "text-heading hover:bg-tint"
              }`}
            >
              <span>{formatJalaliDay(date)}</span>
              {meta !== null ? (
                <span
                  className={`text-[9px] font-medium sm:text-[10px] ${
                    isSelected ? "opacity-80" : "opacity-70"
                  }`}
                >
                  {meta}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
