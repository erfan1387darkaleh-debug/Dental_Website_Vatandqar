/**
 * ────────────────────────────────────────────────────────────────
 *  نمایش تاریخ جلالی (شمسی) سامانه نوبت‌دهی
 * ────────────────────────────────────────────────────────────────
 *  تبدیل تاریخ تنها با Intl (تقویم پایهٔ fa-IR، یعنی «persian») انجام
 *  می‌شود؛ هیچ محاسبهٔ دستی سال کبیسه یا طول ماه‌ها وجود ندارد و ریسک
 *  خطای محاسبهٔ دستی کاملاً حذف می‌شود. ذخیرهٔ داده در پایگاه‌داده
 *  به‌صورت UTC است و این فایل فقط لایهٔ نمایش است.
 * ────────────────────────────────────────────────────────────────
 */
import { BOOKING, toPersianDigits } from "../site-config";
import {
  addDays,
  tehranDateTimeToUtcMs,
  type TehranDate,
  type TimeOfDay,
} from "./time";

const TEHRAN = BOOKING.timeZone;

/*
 * انتخاب ظهر به‌عنوان ساعت نمونه از روزِ تقویمی، مرز شبانه‌روز (تغییر
 * تاریخ در نیمه‌شب) را در هر منطقهٔ زمانی‌ای بی‌اثر می‌کند.
 */
function noonInTehran(date: TehranDate): Date {
  return new Date(tehranDateTimeToUtcMs(date, "12:00"));
}

function partsToMap(
  parts: Intl.DateTimeFormatPart[],
): Partial<Record<Intl.DateTimeFormatPartTypes, string>> {
  const map: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return map;
}

/** خواندن اجزای عددی تاریخ جلالی با تقویم پارسی و ارقام لاتین */
const jalaliPartsFormat = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: TEHRAN,
});

export type JalaliParts = {
  /** سال جلالی، مثل "1405" (ارقام لاتین) */
  year: string;
  /** شمارهٔ ماه جلالی، مثل "8" برای آبان (ارقام لاتین) */
  month: string;
  /** شمارهٔ روز جلالی (ارقام لاتین) */
  day: string;
};

/** اجزای تاریخ جلالی یک روز تقویمی — صرفاً Intl، بدون ریاضیات دستی */
export function getJalaliParts(date: TehranDate): JalaliParts {
  const map = partsToMap(jalaliPartsFormat.formatToParts(noonInTehran(date)));
  if (!map.year || !map.month || !map.day) {
    throw new Error("تقویم پارسی (Intl) در این محیط در دسترس نیست");
  }
  return { year: map.year, month: map.month, day: map.day };
}

/* ── نمایش‌های فارسی (ارقام فارسی خودکار از locale fa-IR) ── */

const fullFormat = new Intl.DateTimeFormat("fa-IR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TEHRAN,
});
const monthYearFormat = new Intl.DateTimeFormat("fa-IR", {
  month: "long",
  year: "numeric",
  timeZone: TEHRAN,
});
const dayFormat = new Intl.DateTimeFormat("fa-IR", {
  day: "numeric",
  timeZone: TEHRAN,
});
const weekdayFormat = new Intl.DateTimeFormat("fa-IR", {
  weekday: "long",
  timeZone: TEHRAN,
});

/** تاریخ کامل جلالی، مثل «شنبه ۹ آبان ۱۴۰۵» */
export function formatJalaliFull(date: TehranDate): string {
  const map = partsToMap(fullFormat.formatToParts(noonInTehran(date)));
  return `${map.weekday} ${map.day} ${map.month} ${map.year}`;
}

/** ماه و سال جلالی، مثل «آبان ۱۴۰۵» */
export function formatJalaliMonthYear(date: TehranDate): string {
  const map = partsToMap(monthYearFormat.formatToParts(noonInTehran(date)));
  return `${map.month} ${map.year}`;
}

/** فقط روز ماه جلالی، مثل «۹» */
export function formatJalaliDay(date: TehranDate): string {
  return dayFormat.format(noonInTehran(date));
}

/** نام فارسی روز هفته، مثل «شنبه» */
export function formatWeekday(date: TehranDate): string {
  return weekdayFormat.format(noonInTehran(date));
}

/** نمایش ساعت «HH:mm» به ارقام فارسی با حذف صفر ابتدا، مثل «۹:۰۰» */
export function formatTimeFa(time: TimeOfDay): string {
  const [hour, minute] = time.split(":");
  return toPersianDigits(`${Number(hour)}:${minute}`);
}

/* ── ناوبری ماه‌های جلالی ── */

/** ابتدا و انتهای ماه جلالیِ یک تاریخ به‌صورت دو تاریخ تقویمی میلادی */
export function jalaliMonthRange(
  anchor: TehranDate,
): { first: TehranDate; last: TehranDate } {
  const anchorMonth = getJalaliParts(anchor).month;
  let first = anchor;
  for (let step = 0; step < 45; step += 1) {
    const previous = addDays(first, -1);
    if (getJalaliParts(previous).month === anchorMonth) first = previous;
    else break;
  }
  let last = anchor;
  for (let step = 0; step < 45; step += 1) {
    const next = addDays(last, 1);
    if (getJalaliParts(next).month === anchorMonth) last = next;
    else break;
  }
  return { first, last };
}

/** لنگرِ ماهِ جلالی قبل — بر پایهٔ روز قبل از ابتدای ماه جاری */
export function previousJalaliMonth(anchor: TehranDate): TehranDate {
  return addDays(jalaliMonthRange(anchor).first, -1);
}

/** لنگرِ ماهِ جلالی بعد — بر پایهٔ روز بعد از انتهای ماه جاری */
export function nextJalaliMonth(anchor: TehranDate): TehranDate {
  return addDays(jalaliMonthRange(anchor).last, 1);
}
