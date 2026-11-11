import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// بارگذاری متغیرهای محیطی از فایل .env.local
dotenv.config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./lib/booking/schema.ts",
    "./lib/testimonials/schema.ts",
    "./lib/gallery/schema.ts",
  ],
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});