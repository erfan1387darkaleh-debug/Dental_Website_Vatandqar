/**
 * ────────────────────────────────────────────────────────────────
 *  ابزارهای زمانی سامانه نوبت‌دهی
 * ────────────────────────────────────────────────────────────────
 *  همه نوبت‌ها بر مبنای روزهای تقویمی «آسیا/تهران» ساخته می‌شوند و در
 *  پایگاه‌داده به‌صورت لحظهٔ UTC استاندارد (timestamptz) ذخیره می‌گردند.
 *  ایران از ۱۴۰۱ تغییر ساعت فصلی ندارد، بنابراین نگاشت «تاریخِ تهران ↔
 *  UTC» با یک اختلاف ثابت بی‌ابهام است (مقدار ثابت در BOOKING).
 *
 *  این فایل منطق خالص و بدون وابستگی به Next است تا علاوه بر رابط
 *  کاربری، در تست‌های محلی (tests/test-booking.ts) هم قابل استفاده باشد.
 * ────────────────────────────────────────────────────────────────
 */
import { BOOKING } from "../site-config";

/** رشتهٔ تاریخ به شکل "yyyy-mm-dd" (روز تقویمی میلادی، بدون ساعت/منطقه) */
export type TehranDate = string;

/** رشتهٔ ساعت به شکل "HH:mm" (۲۴ساعته، ارقام لاتین) */
export type TimeOfDay = string;

/** اختلاف ثابت تهران با UTC به میلی‌ثانیه (+03:30) */
export const TEHRAN_OFFSET_MS = BOOKING.tzOffsetMinutes * 60_000;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * نام‌های انگلیسی روز هفته با ترتیب تقویم ایران: اندیس ۰ = شنبه … ۶ = جمعه.
 * با آرایهٔ dayOfWeek در دادهٔ ساعات کاری شعبه‌ها (Schema.org) یکی است.
 */
export const WEEKDAY_NAMES = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** آیا رشته یک تاریخ تقویمی واقعی است (مانند 31 به ماهِ ۳۰ روزی) */
export function isValidTehranDate(value: unknown): value is TehranDate {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

/** آیا رشته یک ساعت معتبر "HH:mm" است */
export function isValidTimeOfDay(value: unknown): value is TimeOfDay {
  return typeof value === "string" && TIME_PATTERN.test(value);
}

/** اجزای عددی یک رشتهٔ تاریخ */
export function dateParts(date: TehranDate): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

/** تبدیل «تاریخ و ساعت تهران» به لحظهٔ UTC (میلی‌ثانیه) — نقطهٔ یکتای تبدیل زمان نوبت‌ها */
export function tehranDateTimeToUtcMs(
  date: TehranDate,
  time: TimeOfDay,
): number {
  const { year, month, day } = dateParts(date);
  const minutes = timeToMinutes(time);
  return (
    Date.UTC(
      year,
      month - 1,
      day,
      Math.floor(minutes / 60),
      minutes % 60,
      0,
      0,
    ) - TEHRAN_OFFSET_MS
  );
}

/** شروع یک روز تقویمی تهران به UTC (میلی‌ثانیه) */
export function tehranDayStartUtcMs(date: TehranDate): number {
  return tehranDateTimeToUtcMs(date, "00:00");
}

/** روزِ (تقویمی) تهران برای یک لحظهٔ UTC — برای خطوط مرزی «امروز» نوبت‌ها */
export function todayTehranDate(nowUtcMs: number): TehranDate {
  const shifted = new Date(nowUtcMs - TEHRAN_OFFSET_MS);
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`;
}

/** تاریخ و ساعت تقویمی تهران برابر یک لحظهٔ UTC (معکوس tehranDateTimeToUtcMs) */
export function tehranDateTimeParts(utcMs: number): {
  date: TehranDate;
  time: TimeOfDay;
} {
  const shifted = new Date(utcMs + TEHRAN_OFFSET_MS);
  return {
    date: `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`,
    time: `${pad2(shifted.getUTCHours())}:${pad2(shifted.getUTCMinutes())}`,
  };
}

/** فاصلهٔ روزی دو تاریخ تقویمی (b − a) بر حسب روز */
export function diffInDays(a: TehranDate, b: TehranDate): number {
  const { year: ay, month: am, day: ad } = dateParts(a);
  const { year: by, month: bm, day: bd } = dateParts(b);
  const aMs = Date.UTC(ay, am - 1, ad);
  const bMs = Date.UTC(by, bm - 1, bd);
  return Math.round((bMs - aMs) / 86_400_000);
}

/** جابه‌جایی یک تاریخ تقویمی به اندازهٔ n روز (n منفی = رو به گذشته) */
export function addDays(date: TehranDate, days: number): TehranDate {
  const { year, month, day } = dateParts(date);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`;
}

/** اندیس روز هفتهٔ تقویم ایران برای یک تاریخ: ۰ = شنبه … ۶ = جمعه */
export function weekdayIndex(date: TehranDate): number {
  // ظهر UTC نتیجهٔ روزِ تقویمی را از هیچ منطقهٔ زمانی‌ای جدا نمی‌کند
  const jsDay = new Date(`${date}T12:00:00Z`).getUTCDay();
  return (jsDay + 1) % 7;
}

/**
 * نام انگلیسی روز هفته — برای انطباق با آرایهٔ dayOfWeek ساعات کاری
 * شعبه‌ها (دادهٔ متمرکز در lib/site-config.ts).
 */
export function englishWeekdayName(
  date: TehranDate,
): (typeof WEEKDAY_NAMES)[number] {
  return WEEKDAY_NAMES[weekdayIndex(date)];
}

/** "HH:mm" → دقیقه از نیمه‌شب */
export function timeToMinutes(time: TimeOfDay): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

/** دقیقه از نیمه‌شب → "HH:mm" */
export function minutesToTime(minutes: number): TimeOfDay {
  return `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`;
}
