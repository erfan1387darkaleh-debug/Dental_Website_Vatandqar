/**
 * ────────────────────────────────────────────────────────────────
 *  منطق نمونه‌کارهای قبل و بعد (خدمات دامنه) — مستقل از Next
 * ────────────────────────────────────────────────────────────────
 *  همان الگوی نوبت‌دهی و نظرات: توابع این فایل نمونهٔ Drizzle را به‌عنوان
 *  پارامتر می‌گیرند؛ در عملیات با Neon است و در تست‌های محلی PGlite.
 *  قواعد کلیدی:
 *    - نمونه‌ها را فقط پذیرش می‌سازد (ایجاد = منتشرشده، مگر پیش‌نویس)؛
 *    - فقط نمونه‌های منتشرشده در سایت عمومی دیده می‌شوند؛
 *    - آدرس تصاویر فقط مسیر نسبی سایت یا نشانی https امن است؛
 *    - اعتبارسنجی کامل سمت سرور (عنوان، توضیح، خدمت، تصاویر).
 * ────────────────────────────────────────────────────────────────
 */
import { and, desc, eq } from "drizzle-orm";
import { services } from "../../data/services";
import { galleryCases } from "./schema";
import type { BookingDb } from "../booking/db";

/** کدهای خطای نمونه‌کارها — پیام فارسی هر کد در GALLERY_ERROR_MESSAGES */
export type GalleryErrorCode =
  | "db_unavailable"
  | "db_error"
  | "invalid_title"
  | "invalid_description"
  | "invalid_treatment"
  | "invalid_image"
  | "invalid_published"
  | "invalid_id"
  | "invalid_status"
  | "not_found";

/** پیام فارسی هر کد — منبع یکتای متن خطاها برای فرم و فهرست پذیرش */
export const GALLERY_ERROR_MESSAGES: Record<GalleryErrorCode, string> = {
  db_unavailable:
    "سامانهٔ نمونه‌کارها هنوز تنظیم نشده است؛ متغیر DATABASE_URL در تنظیمات سرور تعریف نشده.",
  db_error: "اتصال به پایگاه‌داده برقرار نشد؛ لطفاً دوباره تلاش کنید.",
  invalid_title: "عنوان نمونه باید بین ۳ تا ۸۰ نویسه باشد.",
  invalid_description: "متن توضیح حداکثر ۴۰۰ نویسه است.",
  invalid_treatment: "نوع خدمت انتخابی معتبر نیست.",
  invalid_image:
    "آدرس تصویر باید یک مسیر نسبی سایت (مثل /before-after/case.jpg) یا نشانی امن https باشد.",
  invalid_published: "وضعیت انتشار باید روشن یا خاموش باشد.",
  invalid_id: "شناسهٔ نمونه معتبر نیست.",
  invalid_status: "وضعیت درخواستی معتبر نیست.",
  not_found: "نمونهٔ موردنظر یافت نشد یا حذف شده است.",
};

type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: GalleryErrorCode };

/** ورودی ایجاد نمونه — از بدنهٔ درخواست (پس از خواندن JSON خام) */
export type GalleryInput = {
  title: unknown;
  /** اختیاری — بدون توضیح = null */
  description?: unknown;
  treatmentType: unknown;
  beforeImageUrl: unknown;
  afterImageUrl: unknown;
  /** اختیاری — نبود فیلد یعنی منتشرشده */
  isPublished?: unknown;
};

/** ورودی به‌روزرسانی — همهٔ فیلدها اختیاری (فقط فیلدهای ارسالی تغییر می‌کنند) */
export type GalleryPatch = Partial<GalleryInput>;

/** ردیف نمونه برای پنل پذیرش */
export type GalleryCaseRecord = {
  id: string;
  title: string;
  /** بدون توضیح = null */
  description: string | null;
  treatmentType: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  isPublished: boolean;
  /** لحظهٔ ثبت (ISO UTC) */
  createdAt: string;
};

/** ردیف نمونه برای سایت عمومی — بدون پرچم انتشار */
export type PublicGalleryCase = Omit<GalleryCaseRecord, "isPublished">;

/* ─────────────────────────── اعتبارسنجی ─────────────────────────── */

function invalid(error: GalleryErrorCode): ServiceResult<never> {
  return { ok: false, error };
}

/**
 * عنوان سنجیده و پاک‌سازی‌شده: ۳ تا ۸۰ نویسه؛ فاصله‌های بی‌معنی جمع
 * می‌شوند و نیم‌فاصلهٔ واژه‌ها دست‌نخورده می‌ماند — نویسه‌های کنترلی
 * به‌کلی نامعتبرند.
 */
function sanitizedTitle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.replace(/[ \t]+/g, " ").trim();
  if (trimmed.length < 3 || trimmed.length > 80) return null;
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return null;
  return trimmed;
}

/** نتیجهٔ اعتبارسنجی توضیح اختیاری — null یعنی نامعتبر */
type OptionalText = { ok: true; value: string | null } | { ok: false };

/**
 * توضیح اختیاری پاک‌سازی‌شده: خالیِ کامل → null (بدون توضیح)؛ در غیر
 * این صورت همهٔ فاصله‌های بی‌معنی به یک فاصله جمع می‌شوند؛ سقف ۴۰۰
 * نویسه؛ نویسهٔ کنترلی نامعتبر است.
 */
function sanitizedDescription(raw: unknown): OptionalText {
  if (raw === null || raw === undefined) return { ok: true, value: null };
  if (typeof raw !== "string") return { ok: false };
  const trimmed = raw.replace(/\s+/g, " ").trim();
  if (trimmed === "") return { ok: true, value: null };
  if (trimmed.length > 400) return { ok: false };
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return { ok: false };
  return { ok: true, value: trimmed };
}

/** شناسهٔ خدمت باید در فهرست مرکزی data/services.ts باشد */
function isKnownTreatment(value: string): boolean {
  return services.some((service) => service.id === value);
}

/**
 * آدرس تصویر امن: یا مسیر نسبی سایت (شروع با «/» تکی) یا نشانی کامل
 * https — هیچ طرح دیگری (javascript، data، http ناامن و…) پذیرفته
 * نمی‌شود؛ فاصله و نویسهٔ کنترلی در آدرس نامعتبر است.
 */
function sanitizedImageUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (value.length < 1 || value.length > 600) return null;
  if (/[\u0000-\u001F\u007F\s]/.test(value)) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (/^https:\/\/\S+$/i.test(value)) return value;
  return null;
}

/** وضعیت انتشار فقط بولین است؛ نبود فیلد در ایجاد → منتشرشده */
function sanitizedIsPublished(
  raw: unknown,
  fallback: boolean,
): boolean | null {
  if (raw === undefined || raw === null) return fallback;
  if (typeof raw !== "boolean") return null;
  return raw;
}

/** الگوی UUID برای شناسهٔ نمونه در مسیرهای پذیرش */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LIST_COLUMNS = {
  id: galleryCases.id,
  title: galleryCases.title,
  description: galleryCases.description,
  treatmentType: galleryCases.treatmentType,
  beforeImageUrl: galleryCases.beforeImageUrl,
  afterImageUrl: galleryCases.afterImageUrl,
  isPublished: galleryCases.isPublished,
  createdAt: galleryCases.createdAt,
};

type ListRow = {
  id: string;
  title: string;
  description: string | null;
  treatmentType: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  isPublished: boolean;
  createdAt: Date;
};

function mapRow(row: ListRow): GalleryCaseRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    treatmentType: row.treatmentType,
    beforeImageUrl: row.beforeImageUrl,
    afterImageUrl: row.afterImageUrl,
    isPublished: row.isPublished,
    createdAt: row.createdAt.toISOString(),
  };
}

/* ─────────────────────────── ایجاد (پذیرش) ─────────────────────────── */

/**
 * ایجاد نمونهٔ تازه از سوی پذیرش — پیش‌فرض «منتشرشده»؛ پذیرش می‌تواند
 * با isPublished: false آن را پیش‌نویس ذخیره کند.
 */
export async function createGalleryCase(
  ctx: { db: BookingDb },
  input: GalleryInput,
): Promise<ServiceResult<{ id: string }>> {
  const title = sanitizedTitle(input.title);
  if (!title) return invalid("invalid_title");
  const description = sanitizedDescription(input.description);
  if (!description.ok) return invalid("invalid_description");
  if (
    typeof input.treatmentType !== "string" ||
    !isKnownTreatment(input.treatmentType)
  ) {
    return invalid("invalid_treatment");
  }
  const beforeImageUrl = sanitizedImageUrl(input.beforeImageUrl);
  if (!beforeImageUrl) return invalid("invalid_image");
  const afterImageUrl = sanitizedImageUrl(input.afterImageUrl);
  if (!afterImageUrl) return invalid("invalid_image");
  const isPublished = sanitizedIsPublished(input.isPublished, true);
  if (isPublished === null) return invalid("invalid_published");

  try {
    const inserted = await ctx.db
      .insert(galleryCases)
      .values({
        title,
        description: description.value,
        treatmentType: input.treatmentType,
        beforeImageUrl,
        afterImageUrl,
        isPublished,
      })
      .returning({ id: galleryCases.id });
    const row = inserted[0];
    if (!row) return invalid("db_error");
    return { ok: true, value: { id: row.id } };
  } catch (error) {
    console.error("[gallery] درج نمونه‌کار ناموفق بود:", error);
    return invalid("db_error");
  }
}

/* ─────────────────────────── به‌روزرسانی (پذیرش) ─────────────────────────── */

/**
 * به‌روزرسانی جزئی نمونه — فقط فیلدهای ارسالی تغییر می‌کنند (عنوان،
 * توضیح، خدمت، تصاویر، وضعیت انتشار). تنها مسیر مجاز تغییر، پس از
 * احراز پذیرش در مسیر API.
 */
export async function updateGalleryCase(
  ctx: { db: BookingDb },
  id: unknown,
  patch: GalleryPatch,
): Promise<ServiceResult<{ id: string }>> {
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) {
    return invalid("not_found");
  }
  const updates: Partial<{
    title: string;
    description: string | null;
    treatmentType: string;
    beforeImageUrl: string;
    afterImageUrl: string;
    isPublished: boolean;
  }> = {};

  if (patch.title !== undefined) {
    const title = sanitizedTitle(patch.title);
    if (!title) return invalid("invalid_title");
    updates.title = title;
  }
  if (patch.description !== undefined) {
    const description = sanitizedDescription(patch.description);
    if (!description.ok) return invalid("invalid_description");
    updates.description = description.value;
  }
  if (patch.treatmentType !== undefined) {
    if (
      typeof patch.treatmentType !== "string" ||
      !isKnownTreatment(patch.treatmentType)
    ) {
      return invalid("invalid_treatment");
    }
    updates.treatmentType = patch.treatmentType;
  }
  if (patch.beforeImageUrl !== undefined) {
    const url = sanitizedImageUrl(patch.beforeImageUrl);
    if (!url) return invalid("invalid_image");
    updates.beforeImageUrl = url;
  }
  if (patch.afterImageUrl !== undefined) {
    const url = sanitizedImageUrl(patch.afterImageUrl);
    if (!url) return invalid("invalid_image");
    updates.afterImageUrl = url;
  }
  if (patch.isPublished !== undefined) {
    if (typeof patch.isPublished !== "boolean") {
      return invalid("invalid_published");
    }
    updates.isPublished = patch.isPublished;
  }

  try {
    if (Object.keys(updates).length === 0) {
      // هیچ فیلدی برای تغییر نیست؛ فقط وجود شناسه بررسی می‌شود
      const existing = await ctx.db
        .select({ id: galleryCases.id })
        .from(galleryCases)
        .where(eq(galleryCases.id, id))
        .limit(1);
      if (existing.length === 0) return invalid("not_found");
      return { ok: true, value: { id } };
    }
    const updated = await ctx.db
      .update(galleryCases)
      .set(updates)
      .where(eq(galleryCases.id, id))
      .returning({ id: galleryCases.id });
    if (updated.length === 0) return invalid("not_found");
    return { ok: true, value: { id: updated[0].id } };
  } catch (error) {
    console.error("[gallery] به‌روزرسانی نمونه‌کار ناموفق بود:", error);
    return invalid("db_error");
  }
}

/* ─────────────────────────── حذف (پذیرش) ─────────────────────────── */

/** حذف نمونه — تنها مسیر مجاز حذف، پس از احراز پذیرش در مسیر API */
export async function deleteGalleryCase(
  ctx: { db: BookingDb },
  id: unknown,
): Promise<ServiceResult<{ id: string }>> {
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) {
    return invalid("not_found");
  }
  try {
    const removed = await ctx.db
      .delete(galleryCases)
      .where(eq(galleryCases.id, id))
      .returning({ id: galleryCases.id });
    if (removed.length === 0) return invalid("not_found");
    return { ok: true, value: { id: removed[0].id } };
  } catch (error) {
    console.error("[gallery] حذف نمونه‌کار ناموفق بود:", error);
    return invalid("db_error");
  }
}

/* ─────────────────────────── فهرست‌ها ─────────────────────────── */

/** سقف نمایش در سایت عمومی — فراوانی واقعی یک مطب را با فراوانی پوشش می‌دهد */
export const PUBLIC_GALLERY_LIMIT = 60;

/** نمونه‌های منتشرشده برای سایت عمومی — تازه‌ترین اول؛ فیلتر خدمت اختیاری */
export async function listPublishedGalleryCases(
  ctx: { db: BookingDb },
  treatmentType?: unknown,
): Promise<ServiceResult<PublicGalleryCase[]>> {
  const filter =
    typeof treatmentType === "string" && treatmentType !== ""
      ? treatmentType
      : null;
  if (filter !== null && !isKnownTreatment(filter)) {
    return invalid("invalid_treatment");
  }
  try {
    const rows = filter
      ? await ctx.db
          .select(LIST_COLUMNS)
          .from(galleryCases)
          .where(
            and(
              eq(galleryCases.isPublished, true),
              eq(galleryCases.treatmentType, filter),
            ),
          )
          .orderBy(desc(galleryCases.createdAt))
          .limit(PUBLIC_GALLERY_LIMIT)
      : await ctx.db
          .select(LIST_COLUMNS)
          .from(galleryCases)
          .where(eq(galleryCases.isPublished, true))
          .orderBy(desc(galleryCases.createdAt))
          .limit(PUBLIC_GALLERY_LIMIT);
    return { ok: true, value: rows.map(mapRow) };
  } catch (error) {
    console.error("[gallery] خواندن نمونه‌کارهای عمومی ناموفق بود:", error);
    return invalid("db_error");
  }
}

/** فیلتر وضعیت پنل پذیرش */
export type GalleryStatusFilter = "published" | "draft" | "all";

function isStatusFilter(value: unknown): value is GalleryStatusFilter {
  return value === "published" || value === "draft" || value === "all";
}

/** فهرست پنل پذیرش بر حسب وضعیت — تازه‌ترین اول */
export async function listGalleryCasesByStatus(
  ctx: { db: BookingDb },
  status: unknown,
): Promise<ServiceResult<GalleryCaseRecord[]>> {
  if (!isStatusFilter(status)) return invalid("invalid_status");
  try {
    const rows =
      status === "all"
        ? await ctx.db
            .select(LIST_COLUMNS)
            .from(galleryCases)
            .orderBy(desc(galleryCases.createdAt))
            .limit(200)
        : await ctx.db
            .select(LIST_COLUMNS)
            .from(galleryCases)
            .where(
              eq(galleryCases.isPublished, status === "published"),
            )
            .orderBy(desc(galleryCases.createdAt))
            .limit(200);
    return { ok: true, value: rows.map(mapRow) };
  } catch (error) {
    console.error("[gallery] خواندن فهرست نمونه‌کارها ناموفق بود:", error);
    return invalid("db_error");
  }
}
