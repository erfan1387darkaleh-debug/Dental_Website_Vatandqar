ALTER TABLE "appointments" ADD COLUMN "status" varchar(16) DEFAULT 'confirmed' NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "reminder_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "confirmation_sent_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "appointments_starts_at_idx" ON "appointments" USING btree ("starts_at_utc");--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_status_valid" CHECK ("appointments"."status" IN ('confirmed', 'cancelled'));