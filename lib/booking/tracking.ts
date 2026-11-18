/**
 * کد رهگیری نوبت — تولید و قالب
 * ─────────────────────────────────
 * هر نوبت یک کد ۶ رقمیِ انسانی (مثال: 849210) می‌گیرد تا مراجع بتوانند
 * در پیامک/صفحهٔ تأیید آن را یادداشت کنند و پذیرش با همان کد نوبت را
 * در چند ثانیه پیدا کند. کد شناسهٔ امنیتی نیست (شناسهٔ نوبت UUID است)؛
 * پس مولد تصادفی ساده کافی است و یکتایی نهایی را قید یکتای
 * «appointments_tracking_code_uq» در پایگاه‌داده تضمین می‌کند — در برخورد
 * (خطای 23505) سرویس نوبت‌دهی کد تازه‌ای تولید و دوباره درج می‌کند.
 */
import { randomInt } from "node:crypto";

/** قالب کد رهگیری: دقیقاً شش رقم بدون صفر آغازین (100000 تا 999999) */
export const TRACKING_CODE_PATTERN = /^[1-9][0-9]{5}$/;

/** فرایند تولید کد — برای آزمون‌پذیری تزریق‌پذیر در سرویس نوبت‌دهی */
export type TrackingCodeGenerator = () => string;

/** تولید یک کد رهگیری تصادفی معتبر */
export function generateTrackingCode(): string {
  return String(randomInt(100000, 1_000_000));
}

/** آزمون سریع قالب کد (برای لایهٔ دفاعی نمایش/API) */
export function isValidTrackingCode(value: unknown): value is string {
  return typeof value === "string" && TRACKING_CODE_PATTERN.test(value);
}
