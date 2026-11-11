/**
 * ────────────────────────────────────────────────────────────────
 *  طرح پایگاه‌دادهٔ نظرات بیماران (Drizzle ORM — PostgreSQL/Neon)
 * ────────────────────────────────────────────────────────────────
 *  هر نظر یک ردیف است؛ نظرسنجی با تعدیل (moderation) کار می‌کند:
 *  نظر تازه همیشه «تأییدنشده» (is_approved = false) ثبت می‌شود و
 *  تنها نظری که پذیرش تأیید کند در سایت عمومی نمایش داده می‌شود.
 *  نوع خدمت (treatment_type) از فهرست مرکزی data/services.ts می‌آید
 *  و قید CHECK پایگاه‌داده همان فهرست را تضمین می‌کند.
 * ────────────────────────────────────────────────────────────────
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
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

export const testimonials = pgTable(
  "testimonials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** نام بیمار (پاک‌سازی‌شده، ۲ تا ۶۰ نویسه در سمت برنامه) */
    patientName: varchar("patient_name", { length: 80 }).notNull(),
    /** متن نظر — حداکثر ۵۰۰ نویسه (قید CHECK پایین) */
    comment: varchar("comment", { length: 500 }).notNull(),
    /** امتیاز ۱ تا ۵ ستاره */
    rating: integer("rating").notNull(),
    /** شناسهٔ خدمت از data/services.ts؛ برچسب فارسی در لایهٔ نمایش */
    treatmentType: varchar("treatment_type", { length: 40 }).notNull(),
    /** false = در انتظار تأیید پذیرش؛ فقط true در سایت عمومی دیده می‌شود */
    isApproved: boolean("is_approved").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // پرس‌وجوی سایت عمومی: نظرات تأییدشده به ترتیب تازه‌ترین
    index("testimonials_approved_created_idx").on(
      table.isApproved,
      table.createdAt,
    ),
    check(
      "testimonials_rating_range",
      sql`${table.rating} BETWEEN 1 AND 5`,
    ),
    check(
      "testimonials_treatment_valid",
      sql`${table.treatmentType} IN (${sql.raw(treatmentIdLiterals)})`,
    ),
    check(
      "testimonials_comment_length",
      sql`CHAR_LENGTH(${table.comment}) <= 500`,
    ),
  ],
);
