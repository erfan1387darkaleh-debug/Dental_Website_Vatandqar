/**
 * ────────────────────────────────────────────────────────────────
 *  طرح پایگاه‌دادهٔ نمونه‌کارهای قبل و بعد (Drizzle ORM — PostgreSQL/Neon)
 * ────────────────────────────────────────────────────────────────
 *  هر نمونه یک ردیف است: دو تصویر «قبل» و «بعد» از یک درمان، عنوان،
 *  توضیح اختیاری و نوع خدمت. نمونه‌ها را فقط پذیرش اضافه می‌کند؛
 *  پرچم is_published برای پنهان‌سازی موقت بدون حذف است (پیش‌فرض: منتشرشده).
 *  نوع خدمت (treatment_type) از فهرست مرکزی data/services.ts می‌آید
 *  و قید CHECK پایگاه‌داده همان فهرست را تضمین می‌کند.
 * ────────────────────────────────────────────────────────────────
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { services } from "../../data/services";

/** شناسه‌های مجاز خدمت — مستقیم از دادهٔ مرکزی سایت (بدون تکرار) */
const treatmentIdLiterals = services
  .map((service) => `'${service.id}'`)
  .join(", ");

export const galleryCases = pgTable(
  "gallery_cases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** عنوان نمونه (پاک‌سازی‌شده، ۳ تا ۸۰ نویسه در سمت برنامه) */
    title: varchar("title", { length: 80 }).notNull(),
    /** توضیح اختیاری — حداکثر ۴۰۰ نویسه (قید CHECK پایین) */
    description: varchar("description", { length: 400 }),
    /** شناسهٔ خدمت از data/services.ts؛ برچسب فارسی در لایهٔ نمایش */
    treatmentType: varchar("treatment_type", { length: 40 }).notNull(),
    /** آدرس تصویر «قبل» — مسیر نسبی سایت یا نشانی https */
    beforeImageUrl: varchar("before_image_url", { length: 600 }).notNull(),
    /** آدرس تصویر «بعد» — مسیر نسبی سایت یا نشانی https */
    afterImageUrl: varchar("after_image_url", { length: 600 }).notNull(),
    /** false = پیش‌نویس؛ از سایت عمومی پنهان است ولی در پنل دیده می‌شود */
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // پرس‌وجوی سایت عمومی: نمونه‌های منتشرشده به ترتیب تازه‌ترین
    index("gallery_cases_published_treatment_idx").on(
      table.isPublished,
      table.treatmentType,
      table.createdAt,
    ),
    check(
      "gallery_cases_treatment_valid",
      sql`${table.treatmentType} IN (${sql.raw(treatmentIdLiterals)})`,
    ),
    check(
      "gallery_cases_description_length",
      sql`${table.description} IS NULL OR CHAR_LENGTH(${table.description}) <= 400`,
    ),
  ],
);
