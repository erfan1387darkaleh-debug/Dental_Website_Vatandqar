/**
 * ────────────────────────────────────────────────────────────────
 *  موتور نوبت‌ها — شبکهٔ ۱۰ دقیقه‌ای از روی ساعات کاری شعبه‌ها
 * ────────────────────────────────────────────────────────────────
 *  منبع حقیقت ساعات کاری، همان BRANCHES در lib/site-config.ts است؛
 *  هیچ ساعت یا روز تعطیلی در این فایل یا پایگاه‌داده تکرار نمی‌شود.
 *  قاعده: هر نوبت «معاینه» دقیقاً ۱۰ دقیقه است؛ هم‌پوشانی مجاز نیست و
 *  آخرین نوبتِ هر بازه دقیقاً پیش از پایان بازه شروع می‌شود (مثلاً
 *  ۱۲:۵۰ برای کاری که ۱۳:۰۰ تمام می‌شود).
 * ────────────────────────────────────────────────────────────────
 */
import {
  BOOKING,
  BRANCHES,
  toPersianDigits,
  type Branch,
  type HourPeriod,
} from "../site-config";
import {
  englishWeekdayName,
  isValidTimeOfDay,
  minutesToTime,
  tehranDateTimeToUtcMs,
  timeToMinutes,
  type TehranDate,
  type TimeOfDay,
} from "./time";

const SLOT_MINUTES = BOOKING.slotMinutes;

function parseHourPeriod(period: HourPeriod): { openMin: number; closeMin: number } {
  if (!isValidTimeOfDay(period.opens) || !isValidTimeOfDay(period.closes)) {
    throw new Error(
      `بازهٔ ساعات کاری نامعتبر است: ${period.opens} تا ${period.closes}`,
    );
  }
  const openMin = timeToMinutes(period.opens);
  const closeMin = timeToMinutes(period.closes);
  if (openMin >= closeMin) {
    throw new Error(
      `بازهٔ ساعات کاری نامعتبر است: آغاز پس از پایان (${period.opens} تا ${period.closes})`,
    );
  }
  return { openMin, closeMin };
}

/** شعبهٔ نوبت‌دهی با شناسه — بدون تعریف دوبارهٔ داده */
export function getBookingBranch(branchId: string): Branch | undefined {
  return BRANCHES.find((branch) => branch.id === branchId);
}

/**
 * همهٔ ساعت‌های شروع نوبت برای یک شعبه در یک روز تقویمی.
 * روز تعطیل (مانند جمعه؛ بازهٔ periods خالی) آرایهٔ خالی برمی‌گرداند.
 */
export function slotTimesForBranchDate(
  branchId: string,
  date: TehranDate,
): TimeOfDay[] {
  const branch = getBookingBranch(branchId);
  if (!branch) return [];
  const dayEntry = branch.openingHours.find((entry) =>
    entry.dayOfWeek.includes(englishWeekdayName(date)),
  );
  if (!dayEntry || dayEntry.periods.length === 0) return [];

  const slots: TimeOfDay[] = [];
  for (const period of dayEntry.periods) {
    const { openMin, closeMin } = parseHourPeriod(period);
    // اگر شروع بازه روی مضرب ۱۰ دقیقه نباشد، شبکهٔ ساعاتِ قیدشده در
    // پایگاه‌داده با دادهٔ سازگار نمی‌شود؛ بهتر است همین‌جا بلند شود.
    if (openMin % SLOT_MINUTES !== 0) {
      throw new Error(
        `ساعت شروع بازه در ${toPersianDigits(period.opens)} برای شعبهٔ ${branch.name} روی شبکهٔ ${toPersianDigits(String(SLOT_MINUTES))} دقیقه‌ای نیست`,
      );
    }
    for (let minute = openMin; minute + SLOT_MINUTES <= closeMin; minute += SLOT_MINUTES) {
      slots.push(minutesToTime(minute));
    }
  }
  return slots;
}

/** آیا شعبه در این روز پذیرش دارد (جمعه = تعطیل) */
export function isBranchOpenOnDate(branchId: string, date: TehranDate): boolean {
  return slotTimesForBranchDate(branchId, date).length > 0;
}

/**
 * لحظهٔ UTC یک نوبت روی شبکهٔ ۱۰ دقیقه‌ای این شعبه.
 * اگر ساعت جزو نوبت‌های مجاز شعبه در آن روز نباشد، null برمی‌گردد —
 * درگاه عمومی و پنل پذیرش هر دو فقط همین ساعت‌ها را می‌پذیرند.
 */
export function slotInstantUtcMs(
  branchId: string,
  date: TehranDate,
  time: TimeOfDay,
): number | null {
  if (!slotTimesForBranchDate(branchId, date).includes(time)) return null;
  return tehranDateTimeToUtcMs(date, time);
}
