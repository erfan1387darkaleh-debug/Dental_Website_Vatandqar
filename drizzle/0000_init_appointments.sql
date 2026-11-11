CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" varchar(40) NOT NULL,
	"starts_at_utc" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 10 NOT NULL,
	"patient_name" varchar(80) NOT NULL,
	"patient_phone" varchar(11) NOT NULL,
	"source" varchar(8) DEFAULT 'public' NOT NULL,
	"created_by" varchar(40),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointments_branch_id_valid" CHECK ("appointments"."branch_id" IN ('hediye-yousef', 'vatandar')),
	CONSTRAINT "appointments_source_valid" CHECK ("appointments"."source" IN ('public', 'staff')),
	CONSTRAINT "appointments_phone_format" CHECK ("appointments"."patient_phone" ~ '^09[0-9]{9}$'),
	CONSTRAINT "appointments_duration_fixed" CHECK ("appointments"."duration_minutes" = 10),
	CONSTRAINT "appointments_slot_grid" CHECK (EXTRACT(SECOND FROM "appointments"."starts_at_utc") = 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_branch_slot_uq" ON "appointments" USING btree ("branch_id","starts_at_utc");