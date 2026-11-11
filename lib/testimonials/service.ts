/**
 * ────────────────────────────────────────────────────────────────
 *  منطق نظرات بیماران (خدمات دامنه) — مستقل از Next
 * ────────────────────────────────────────────────────────────────
 *  همان الگوی نوبت‌دهی: توابع این فایل نمونهٔ Drizzle را به‌عنوان
 *  پارامتر می‌گیرند؛ در عملیات Neon است و در تست‌های محلی PGlite.
 *  قواعد کلیدی:
 *    - هر نظر تازه «تأییدنشده» ثبت می‌شود (تعدیل پذیرش)؛
 *    - فقط نظرات تأییدشده در سایت عمومی نمایش داده می‌شوند؛
 *    - اعتبارسنجی کامل سمت سرور (نام، متن، امتیاز، نوع خدمت).
 * ────────────────────────────────────────────────────────────────
 */
import { desc, eq } from "drizzle-orm";
import { services } from "../../data/services";
import { testimonials } from "./schema";
import type { BookingDb } from "../booking/db";

/** کدهای خطای نظرات — پیام فارسی هر کد در TESTIMONIAL_ERROR_MESSAGES */
export type TestimonialErrorCode =
  | "db_unavailable"
  | "db_error"
  | "invalid_name"
  | "invalid_comment"
  | "invalid_rating"
  | "invalid_treatment"
  | "invalid_id"
  | "invalid_status"
  | "not_found";

/** پیام فارسی هر کد — منبع یکتای متن خطاها برای فرم عمومی و پنل پذیرش */
export const TESTIMONIAL_ERROR_MESSAGES: Record<TestimonialErrorCode, string> =
  {
    db_unavailable:
      "سامانهٔ نظرات هنوز تنظیم نشده است؛ متغیر DATABASE_URL در تنظیمات سرور تعریف نشده.",
    db_error: "اتصال به پایگاه‌داده برقرار نشد؛ لطفاً دوباره تلاش کنید.",
    invalid_name: "لطفاً نام و نام خانوادگی معتبر وارد کنید.",
    invalid_comment: "متن نظر باید بین ۱۰ تا ۵۰۰ نویسه باشد.",
    invalid_rating: "امتیاز باید عددی بین ۱ تا ۵ باشد.",
    invalid_treatment: "نوع خدمت انتخابی معتبر نیست.",
    invalid_id: "شناسهٔ نظر معتبر نیست.",
    invalid_status: "وضعیت درخواستی معتبر نیست.",
    not_found: "نظر موردنظر یافت نشد یا حذف شده است.",
  };

type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: TestimonialErrorCode };

/** ورودی ثبت نظر عمومی — از بدنهٔ درخواست (پس از خواندن JSON خام) */
export type TestimonialInput = {
  patientName: unknown;
  comment: unknown;
  rating: unknown;
  treatmentType: unknown;
};

/** ردیف نظر برای نمایش عمومی و پنل پذیرش */
export type TestimonialRecord = {
  id: string;
  patientName: string;
  comment: string;
  rating: number;
  treatmentType: string;
  isApproved: boolean;
  /** لحظهٔ ثبت نظر (ISO UTC) */
  createdAt: string;
};

/* ─────────────────────────── اعتبارسنجی ─────────────────────────── */

function invalid(error: TestimonialErrorCode): ServiceResult<never> {
  return { ok: false, error };
}

/**
 * نام سنجیده و پاک‌سازی‌شده: ۲ تا ۶۰ نویسه؛ همان قاعدهٔ نام بیمار در
 * نوبت‌دهی (فاصله‌های بی‌معنی جمع می‌شوند و نیم‌فاصلهٔ نام‌ها دست‌نخورده
 * می‌ماند) — نویسه‌های کنترلی به‌کلی نامعتبرند.
 */
function sanitizedPatientName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.replace(/[ \t]+/g, " ").trim();
  if (trimmed.length < 2 || trimmed.length > 60) return null;
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return null;
  return trimmed;
}

/**
 * متن نظر پاک‌سازی‌شده: همهٔ فاصله‌های بی‌معنی (شامل خط جدید) به یک
 * فاصله جمع می‌شوند؛ ۱۰ تا ۵۰۰ نویسه؛ نویسهٔ کنترلی نامعتبر است.
 */
function sanitizedComment(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.replace(/\s+/g, " ").trim();
  if (trimmed.length < 10 || trimmed.length > 500) return null;
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return null;
  return trimmed;
}

/** امتیاز عدد صحیح ۱ تا ۵ */
function sanitizedRating(raw: unknown): number | null {
  if (typeof raw !== "number" || !Number.isInteger(raw)) return null;
  if (raw < 1 || raw > 5) return null;
  return raw;
}

/** شناسهٔ خدمت باید در فهرست مرکزی data/services.ts باشد */
function sanitizedTreatmentType(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  return services.some((service) => service.id === raw) ? raw : null;
}

/** الگوی UUID برای شناسهٔ نظر در مسیرهای پذیرش */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapRow(row: {
  id: string;
  patientName: string;
  comment: string;
  rating: number;
  treatmentType: string;
  isApproved: boolean;
  createdAt: Date;
}): TestimonialRecord {
  return {
    id: row.id,
    patientName: row.patientName,
    comment: row.comment,
    rating: row.rating,
    treatmentType: row.treatmentType,
    isApproved: row.isApproved,
    createdAt: row.createdAt.toISOString(),
  };
}

/* ─────────────────────────── ثبت عمومی ─────────────────────────── */

/**
 * ثبت نظر تازه از سوی بیمار — همیشه «تأییدنشده»؛ نمایش در سایت فقط
 * پس از تأیید صریح پذیرش انجام می‌شود.
 */
export async function submitTestimonial(
  ctx: { db: BookingDb },
  input: TestimonialInput,
): Promise<ServiceResult<{ id: string }>> {
  const patientName = sanitizedPatientName(input.patientName);
  if (!patientName) return invalid("invalid_name");
  const comment = sanitizedComment(input.comment);
  if (!comment) return invalid("invalid_comment");
  const rating = sanitizedRating(input.rating);
  if (!rating) return invalid("invalid_rating");
  const treatmentType = sanitizedTreatmentType(input.treatmentType);
  if (!treatmentType) return invalid("invalid_treatment");

  try {
    const inserted = await ctx.db
      .insert(testimonials)
      .values({ patientName, comment, rating, treatmentType })
      .returning({ id: testimonials.id });
    const row = inserted[0];
    if (!row) return invalid("db_error");
    return { ok: true, value: { id: row.id } };
  } catch (error) {
    console.error("[testimonials] درج نظر ناموفق بود:", error);
    return invalid("db_error");
  }
}

/* ─────────────────────────── فهرست‌ها ─────────────────────────── */

/** سقف نمایش در سایت عمومی — حجم واقعی یک مطب را با فراوانی پوشش می‌دهد */
export const PUBLIC_TESTIMONIALS_LIMIT = 24;

/** نظرات تأییدشده برای سایت عمومی — تازه‌ترین اول */
export async function listApprovedTestimonials(
  ctx: { db: BookingDb },
): Promise<ServiceResult<TestimonialRecord[]>> {
  try {
    const rows = await ctx.db
      .select({
        id: testimonials.id,
        patientName: testimonials.patientName,
        comment: testimonials.comment,
        rating: testimonials.rating,
        treatmentType: testimonials.treatmentType,
        isApproved: testimonials.isApproved,
        createdAt: testimonials.createdAt,
      })
      .from(testimonials)
      .where(eq(testimonials.isApproved, true))
      .orderBy(desc(testimonials.createdAt))
      .limit(PUBLIC_TESTIMONIALS_LIMIT);
    return { ok: true, value: rows.map(mapRow) };
  } catch (error) {
    console.error("[testimonials] خواندن نظرات تأییدشده ناموفق بود:", error);
    return invalid("db_error");
  }
}

/** فیلتر وضعیت پنل پذیرش */
export type TestimonialStatusFilter = "pending" | "approved" | "all";

function isStatusFilter(value: unknown): value is TestimonialStatusFilter {
  return (
    value === "pending" || value === "approved" || value === "all"
  );
}

/** فهرست پنل پذیرش بر حسب وضعیت — تازه‌ترین اول */
export async function listTestimonialsByStatus(
  ctx: { db: BookingDb },
  status: unknown,
): Promise<ServiceResult<TestimonialRecord[]>> {
  if (!isStatusFilter(status)) return invalid("invalid_status");
  const columns = {
    id: testimonials.id,
    patientName: testimonials.patientName,
    comment: testimonials.comment,
    rating: testimonials.rating,
    treatmentType: testimonials.treatmentType,
    isApproved: testimonials.isApproved,
    createdAt: testimonials.createdAt,
  };
  try {
    const rows =
      status === "all"
        ? await ctx.db
            .select(columns)
            .from(testimonials)
            .orderBy(desc(testimonials.createdAt))
            .limit(200)
        : await ctx.db
            .select(columns)
            .from(testimonials)
            .where(eq(testimonials.isApproved, status === "approved"))
            .orderBy(desc(testimonials.createdAt))
            .limit(200);
    return { ok: true, value: rows.map(mapRow) };
  } catch (error) {
    console.error("[testimonials] خواندن فهرست نظرات ناموفق بود:", error);
    return invalid("db_error");
  }
}

/* ─────────────────────────── تعدیل (پذیرش) ─────────────────────────── */

/** تأیید نظر — تنها مسیر مجاز تغییر وضعیت، پس از احراز پذیرش در مسیر API */
export async function approveTestimonial(
  ctx: { db: BookingDb },
  id: unknown,
): Promise<ServiceResult<{ id: string }>> {
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) {
    return invalid("not_found");
  }
  try {
    const updated = await ctx.db
      .update(testimonials)
      .set({ isApproved: true })
      .where(eq(testimonials.id, id))
      .returning({ id: testimonials.id });
    if (updated.length === 0) return invalid("not_found");
    return { ok: true, value: { id: updated[0].id } };
  } catch (error) {
    console.error("[testimonials] تأیید نظر ناموفق بود:", error);
    return invalid("db_error");
  }
}

/** حذف نظر — تنها مسیر مجاز حذف، پس از احراز پذیرش در مسیر API */
export async function deleteTestimonial(
  ctx: { db: BookingDb },
  id: unknown,
): Promise<ServiceResult<{ id: string }>> {
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) {
    return invalid("not_found");
  }
  try {
    const removed = await ctx.db
      .delete(testimonials)
      .where(eq(testimonials.id, id))
      .returning({ id: testimonials.id });
    if (removed.length === 0) return invalid("not_found");
    return { ok: true, value: { id: removed[0].id } };
  } catch (error) {
    console.error("[testimonials] حذف نظر ناموفق بود:", error);
    return invalid("db_error");
  }
}
