CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_name" varchar(80) NOT NULL,
	"comment" varchar(500) NOT NULL,
	"rating" integer NOT NULL,
	"treatment_type" varchar(40) NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "testimonials_rating_range" CHECK ("testimonials"."rating" BETWEEN 1 AND 5),
	CONSTRAINT "testimonials_treatment_valid" CHECK ("testimonials"."treatment_type" IN ('examination', 'scaling', 'filling', 'root-canal', 'extraction', 'whitening', 'prosthesis', 'cosmetic', 'preventive')),
	CONSTRAINT "testimonials_comment_length" CHECK (CHAR_LENGTH("testimonials"."comment") <= 500)
);
--> statement-breakpoint
CREATE INDEX "testimonials_approved_created_idx" ON "testimonials" USING btree ("is_approved","created_at");