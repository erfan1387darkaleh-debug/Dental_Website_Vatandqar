/**
 * ────────────────────────────────────────────────────────────────
 *  طرح پایگاه‌دادهٔ نوبت‌ها (Drizzle ORM — PostgreSQL/Neon)
 * ────────────────────────────────────────────────────────────────
 *  هر نوبت یک ردیف و یکتاست؛ مهم‌ترین قید، اندیس یکتای
 *  (branch_id, starts_at_utc) است که دوبخشی بودن تقویم‌های دو شعبه و
 *  جلوگیری از رزرو هم‌زمان یک ساعت (حتی در درخواست‌های متوالی/موازی)
 *  را خودِ پایگاه‌داده تضمین می‌کند — نه رابط کاربری.
 * ────────────────────────────────────────────────────────────────
 */
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { BRANCHES } from "../site-config";

/** شناسه‌های مجاز شعبه — مستقیم از دادهٔ مرکزی سایت (بدون تکرار) */
const branchIdLiterals = BRANCHES.map((branch) => `'${branch.id}'`).join(", ");

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    branchId: varchar("branch_id", { length: 40 }).notNull(),
    /** لحظهٔ استاندارد UTC شروع نوبت — ذخیرهٔ قابل اتکا؛ نمایش جلالی در لایهٔ نمایش */
    startsAtUtc: timestamp("starts_at_utc", { withTimezone: true }).notNull(),
    /** مدت هر نوبت همیشه همان ۱۰ دقیقهٔ معاینه است */
    durationMinutes: integer("duration_minutes").notNull().default(10),
    patientName: varchar("patient_name", { length: 80 }).notNull(),
    /** شمارهٔ موبایل نرمال‌شده (09xxxxxxxxx) */
    patientPhone: varchar("patient_phone", { length: 11 }).notNull(),
    /**
     * کد رهگیری ۶ رقمیِ انسانی برای یافتنِ سریع نوبت در پذیرش (مثال: 849210).
     * تولید تصادفی در سرویس با بازتلاش روی برخورد؛ یکتایی نهایی را
     * قید یکتای پایگاه‌داده تضمین می‌کند.
     */
    trackingCode: varchar("tracking_code", { length: 6 }).notNull(),
    /** «public» = رزرو آنلاین مراجع، «staff» = ثبت دستی پذیرش */
    source: varchar("source", { length: 8 }).notNull().default("public"),
    /** وضعیت نوبت؛ پیش‌فرض «تأییدشده» — «cancelled» برای لغو نرم آینده */
    status: varchar("status", { length: 16 }).notNull().default("confirmed"),
    /** لحظهٔ ارسال موفق پیامک یادآوری؛ null = هنوز ارسال نشده (شناسهٔ تکراری‌نشدن کرون) */
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    /** لحظهٔ ارسال موفق پیامک تأیید ثبت (فقط نوبت‌های عمومی) */
    confirmationSentAt: timestamp("confirmation_sent_at", { withTimezone: true }),
    /** نام کاربری پذیرش برای نوبت‌های staff؛ برای نوبت عمومی null */
    createdBy: varchar("created_by", { length: 40 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // قلب تضمین تکراری‌نشدن نوبت: در هر شعبه، هر لحظه حداکثر یک نوبت
    uniqueIndex("appointments_branch_slot_uq").on(
      table.branchId,
      table.startsAtUtc,
    ),
    // کد رهگیری در سراسر جدول یکتاست؛ برخورد (23505) در سرویس با تولید
    // کد تازه و درج دوباره حل می‌شود
    uniqueIndex("appointments_tracking_code_uq").on(table.trackingCode),
    // پرس‌وجوی پنجرهٔ یادآوری کرون (بازهٔ starts_at_utc)
    index("appointments_starts_at_idx").on(table.startsAtUtc),
    check(
      "appointments_branch_id_valid",
      sql`${table.branchId} IN (${sql.raw(branchIdLiterals)})`,
    ),
    check(
      "appointments_source_valid",
      sql`${table.source} IN ('public', 'staff')`,
    ),
    check(
      "appointments_status_valid",
      sql`${table.status} IN ('confirmed', 'cancelled')`,
    ),
    check(
      "appointments_phone_format",
      sql`${table.patientPhone} ~ '^09[0-9]{9}$'`,
    ),
    check(
      "appointments_tracking_code_format",
      sql`${table.trackingCode} ~ '^[1-9][0-9]{5}$'`,
    ),
    check(
      "appointments_duration_fixed",
      sql`${table.durationMinutes} = 10`,
    ),
    // گرانولاریتی سراسری نوبت‌ها: ثانیه صفر (شبکهٔ دقیقه‌ای در سمت
    // برنامه از ساعات کاری BRANCHES ساخته می‌شود و در تست‌های محلی
    // همراستایی آن با مضرب ۱۰ دقیقه کنترل می‌شود)
    check(
      "appointments_slot_grid",
      sql`EXTRACT(SECOND FROM ${table.startsAtUtc}) = 0`,
    ),
  ],
);
