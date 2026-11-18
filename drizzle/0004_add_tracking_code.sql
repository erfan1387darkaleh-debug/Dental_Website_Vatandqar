-- ─────────────────────────────────────────────────────────────
--  کد رهگیری نوبت (نظم ۰۰۰۴)
--  ستون varchar(6) با قید یکتا و قید قالب (شش رقم بدون صفر آغازین).
--  برای سازگاری با جدول‌های غیرخالیِ پایگاه‌دادهٔ عملیاتی، ستون اول
--  «پذیرا» افزوده می‌شود، ردیف‌های موجود با شماره‌گذاری ترتیبی
--  (یکتا و انسانی: 100001، 100002، …) پر می‌شوند و سپس NOT NULL و
--  قیدهای یکتا/قالب اعمال می‌گردند.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "appointments" ADD COLUMN "tracking_code" varchar(6);--> statement-breakpoint
UPDATE "appointments" SET "tracking_code" = "t"."code"
FROM (
  SELECT "id", (100000 + ROW_NUMBER() OVER (ORDER BY "created_at", "id"))::varchar(6) AS "code"
  FROM "appointments"
) AS "t"
WHERE "appointments"."id" = "t"."id";--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "tracking_code" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_tracking_code_uq" ON "appointments" USING btree ("tracking_code");--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tracking_code_format" CHECK ("appointments"."tracking_code" ~ '^[1-9][0-9]{5}$');
