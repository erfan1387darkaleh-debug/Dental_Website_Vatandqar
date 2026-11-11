CREATE TABLE "gallery_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(80) NOT NULL,
	"description" varchar(400),
	"treatment_type" varchar(40) NOT NULL,
	"before_image_url" varchar(600) NOT NULL,
	"after_image_url" varchar(600) NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gallery_cases_treatment_valid" CHECK ("gallery_cases"."treatment_type" IN ('examination', 'scaling', 'filling', 'root-canal', 'extraction', 'whitening', 'prosthesis', 'cosmetic', 'preventive')),
	CONSTRAINT "gallery_cases_description_length" CHECK ("gallery_cases"."description" IS NULL OR CHAR_LENGTH("gallery_cases"."description") <= 400)
);
--> statement-breakpoint
CREATE INDEX "gallery_cases_published_treatment_idx" ON "gallery_cases" USING btree ("is_published","treatment_type","created_at");