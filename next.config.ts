import type { NextConfig } from "next";

/*
 * ────────────────────────────────────────────────────────────────
 *  سرصفحه‌های امنیتی (Security Headers) — طبق راهنمای رسمی CSP
 * ────────────────────────────────────────────────────────────────
 *  CSP بدون nonce (الگوی رسمی «Without Nonces»): این پروژه با
 *  cacheComponents/PPR صفحات را ایستا پیش‌رندر می‌کند و CSP مبتنی بر
 *  nonce به رندر دینامیکِ همهٔ صفحه‌ها نیاز دارد و با PPR ناسازگار است
 *  (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
 *  بنابراین script-src به «unsafe-inline» نیاز دارد (اسکریپت‌های درونی
 *  فریم‌ورک برای آب‌رسانی) — هیچ اسکریپت/استایل بیرونی‌ای در سایت نیست.
 *  در حالت توسعه، React برای اشکال‌زدایی به «unsafe-eval» نیاز دارد.
 *
 *  img-src شامل https: است: آدرس تصاویر نمونه‌کارها را پذیرش از هر
 *  میزبان https دلخواه وارد می‌کند (تماس مستقیم <img>، بدون بهینه‌ساز).
 *  فونت وزیرمتن خودمیزبان است (font-src 'self') و همهٔ fetchها هم‌مبدأ
 *  هستند (connect-src 'self').
 * ────────────────────────────────────────────────────────────────
 */
const isDev = process.env.NODE_ENV === "development";

const contentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' https:;
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // جلوگیری از clickjacking برای مرورگرهای قدیمی‌تر (CSP هم frame-ancestors دارد)
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // HSTS دو سال + زیردامنه‌ها؛ «preload» عمداً ست نمی‌شود (تصمیم یک‌طرفه و سخت‌برگشت)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [
      {
        // همهٔ مسیرها — صفحات و API
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
