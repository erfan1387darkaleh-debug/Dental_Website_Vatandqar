/**
 * ────────────────────────────────────────────────────────────────
 *  اتصال پایگاه‌دادهٔ نوبت‌دهی — فقط سمت سرور
 * ────────────────────────────────────────────────────────────────
 *  پایگاه‌دادهٔ پذیرفته‌شده: PostgreSQL مدیریت‌شدهٔ Neon.
 *  هیچ مقدار پیش‌فرض جعلی‌ای وجود ندارد؛ اگر DATABASE_URL در متغیرهای
 *  محیطی تنظیم نشده باشد، getBookingDb مقدار null می‌دهد و تمام مسیرهای
 *  نوبت‌دهی با پیام صریح «تنظیم نشده» پاسخی ۵۰۳ می‌دهند — نه خطای مبهم.
 *
 *  تنظیم (یک‌بار، توسط مالک سایت):
 *    1) داشبورد neon.tech → ساخت Project → کپی «Pooled connection»
 *    2) در .env.local مقدار DATABASE_URL را قرار دهید (نمونه در .env.example)
 *    3) اجرای `npx drizzle-kit push` برای ساخت جدول‌ها
 * ────────────────────────────────────────────────────────────────
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

export type BookingDb = NeonHttpDatabase<Record<string, never>>;

let cachedDb: BookingDb | null = null;

/**
 * نمونهٔ Drizzle یا null (وقتی تنظیم نشده).
 * رشتهٔ اتصال نامعتبر مشابه «تنظیم نشده» رفتار می‌کند و فقط خطای کلی
 * ثبت می‌شود؛ مقدارِ رشته هرگز در پیام‌ها یا استثناه‌ها لو نمی‌رود.
 */
export function getBookingDb(): BookingDb | null {
  if (cachedDb !== null) return cachedDb;

  const rawUrl = process.env.DATABASE_URL?.trim() ?? "";
  if (rawUrl === "" || /<.*>/.test(rawUrl)) {
    // خالی یا همان placeholder سندشده → سامانه تنظیم نشده
    return null;
  }
  if (!/^postgres(?:ql)?:\/\//i.test(rawUrl)) {
    console.error(
      "[booking] DATABASE_URL تنظیم شده اما قالب آن نامعتبر است؛ باید با postgres:// یا postgresql:// آغاز شود.",
    );
    return null;
  }
  cachedDb = drizzle(neon(rawUrl));
  return cachedDb;
}
