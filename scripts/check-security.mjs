/**
 * ────────────────────────────────────────────────────────────────
 *  بازرسی امنیت مخازن/کد — اجرا: npm run check:security
 * ────────────────────────────────────────────────────────────────
 *  بررسی‌های سریع و بدون وابستگی (node خالص) برای خطای ساخت CI:
 *    ۱) هیچ متغیر NEXT_PUBLIC_ای در کد نیست (رازها به کلاینت نمی‌روند)
 *    ۲) هیچ فایل .envای رهگیری (tracked) در گیت نیست
 *    ۳) هیچ کلید/رازی به‌صورت مقدار جایگزین در process.env نیست
 *       (همان حفره‌ای که باید همیشه بسته بماند)
 *    ۴) dangerouslySetInnerHTML فقط در محل‌های مجاز (ثابت‌های سمت سرور)
 *  در صورت یافتن هر مورد، با کد خروج ۱ و فهرست موارد به پایان می‌رسد.
 * ────────────────────────────────────────────────────────────────
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const problems = [];
const SCAN_DIRS = ["app", "components", "lib", "tests", "scripts"];
const SCAN_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".css",
  ".json",
]);

/** گردآوری فایل‌های قابل پویش (بدون node_modules و .next) */
function collectFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (full.includes(`${sep}node_modules`) || full.includes(`${sep}.next`)) {
      continue;
    }
    const info = statSync(full);
    if (info.isDirectory()) collectFiles(full, files);
    else if (SCAN_EXT.has(entry.slice(entry.lastIndexOf(".")))) {
      files.push(full);
    }
  }
  return files;
}

const files = SCAN_DIRS.flatMap((dir) => {
  try {
    return collectFiles(join(root, dir));
  } catch {
    return []; // پوشه نبود — اشکالی ندارد
  }
}).filter(
  // خودِ اسکریپت بازرسی الگوها را درون متن خودش دارد؛ از پویش مستثناست
  (file) => !file.endsWith("check-security.mjs"),
);

/** مسیر نسبی با جداکنندهٔ یکسان (اسلش) — مستقل از سیستم‌عامل */
function relPath(file) {
  return relative(root, file).replaceAll("\\", "/");
}

/* ── ۱) NEXT_PUBLIC_ — هیچ رازی نباید به بستهٔ کلاینت برود ── */
for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (/NEXT_PUBLIC_/.test(text)) {
    problems.push(
      `NEXT_PUBLIC_ یافت شد در ${relPath(file)} — هر مقدار NEXT_PUBLIC_ به کد کلاینت می‌رود؛ از آن برای راز استفاده نکنید.`,
    );
  }
}

/* ── ۲) فایل‌های env نباید در گیت رهگیری شده باشند ── */
let trackedEnvFiles = [];
try {
  const tracked = execFileSync("git", ["ls-files", "--", ".env*", "**/.env*"], {
    cwd: root,
    encoding: "utf8",
  });
  trackedEnvFiles = tracked.split("\n").map((line) => line.trim()).filter(Boolean);
  for (const name of trackedEnvFiles) {
    problems.push(
      `فایل محیطی «${name}» در گیت رهگیری شده است — از رهگیری خارج کنید (git rm --cached) چون ممکن است راز داشته باشد.`,
    );
  }
} catch {
  console.log("! git در دسترس نیست؛ بررسی رهگیری .env نادیده گرفته شد.");
}

/* ── ۳) هیچ رازی نباید مقدار جایگزین سخت‌کدشده داشته باشد ── */
const SECRET_ENVS =
  /(process\.env\.(?:[A-Z0-9_]*(?:DATABASE_URL|SECRET|PASSWORD|KEY|TOKEN)[A-Z0-9_]*))(?![A-Z0-9_])/g;
const FALLBACK = /\?\?\s*["'][^"']{4,}["']|\|\|\s*["'][^"']{4,}["']/;
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(SECRET_ENVS)) {
    // پنجرهٔ ۱۲۰ نویسه پس از هر ارجاع به راز — الگوی جایگزین (fallback)
    const window = text.slice(match.index, match.index + 120);
    if (FALLBACK.test(window)) {
      problems.push(
        `مقدار جایگزین برای متغیر محیطی راز (${match[1]}) در ${relPath(file)} — رازها باید «شکست صریح» داشته باشند، نه مقدار پیش‌فرض.`,
      );
    }
  }
}

/* ── ۴) dangerouslySetInnerHTML فقط در ثابت‌های سمت سرور ── */
const ALLOWED_HTML_INJECTION = new Set([
  "app/layout.tsx", // اسکریپت ثابت مقداردهی تم (بدون ورودی کاربر)
  "app/(site)/layout.tsx", // JSON-LD ثابت سمت سرور
  "app/(beauty)/layout.tsx", // همان JSON-LD ثابت BUSINESS_JSON_LD
  "app/(products)/layout.tsx", // همان JSON-LD ثابت BUSINESS_JSON_LD
]);
for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (text.includes("dangerouslySetInnerHTML")) {
    const rel = relPath(file);
    if (!ALLOWED_HTML_INJECTION.has(rel)) {
      problems.push(
        `dangerouslySetInnerHTML در ${rel} — محل مجاز نیست؛ ورودی کاربر هرگز به HTML خام نمی‌رسد.`,
      );
    }
  }
}

/* ── نتیجه ── */
if (problems.length > 0) {
  console.error("بازرسی امنیت: موارد زیر را اصلاح کنید:");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}
console.log(
  `بازرسی امنیت: ${files.length} فایل بررسی شد؛ هیچ مشکلی یافت نشد.`,
);
