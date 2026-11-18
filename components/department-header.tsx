"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Menu,
  Phone,
  Send,
  ShoppingBag,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { InstagramIcon } from "@/components/instagram-icon";
import { RubikaIcon } from "@/components/rubika-icon";
import { TelegramIcon } from "@/components/telegram-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { Container } from "@/components/container";
import { DEPT_STYLES } from "@/components/department-contact";
import {
  DEPARTMENT_CONTACTS,
  INSTAGRAM_URL,
  RUBIKA_URL,
  SITE,
  toPersianDigits,
  type DepartmentKey,
} from "@/lib/site-config";

/** کلید بخش‌های همکار که هدر اختصاصی دارند (دندانپزشکی هدر اصلی سایت را دارد) */
type DepartmentHeaderKey = Exclude<DepartmentKey, "dental">;

/** یک لینک ناوبری — `desktop: false` یعنی فقط در منوی موبایل، نه ردیف دسکتاپ */
interface DepartmentNavLink {
  href: string;
  label: string;
  desktop?: boolean;
}

/**
 * پیکربندی هدر اختصاصی هر بخش — برندینگ، لنگرهای همان صفحه و کلاس‌های
 * رنگ برند. نکته‌ها:
 *  - href لنگرها باید با شناسهٔ خدمات در data/beauty-services.ts و
 *    دسته‌ها در data/products.ts هم‌خوان بماند.
 *  - برچسب‌های ناوبری عمداً کوتاه‌اند (مثل «پیکرتراشی») تا ردیف دسکتاپ
 *    همیشه در یک خط جا شود؛ عرض کانتینر هدر ~۱۰۸۸ پیکسل است و مجموع
 *    اندازهٔ واقعی آیتم‌ها با فونت وزیرمتن اندازه‌گیری و تأیید شده است.
 *  - لینک «مشاوره و تماس» (لنگر #consultation) فقط در منوی موبایل است؛
 *    در دسکتاپ دو دکمهٔ تماس و تلگرام همان مقصود را پوشش می‌دهند.
 */
const DEPARTMENT_HEADER_CONFIG: Record<
  DepartmentHeaderKey,
  {
    brandTitle: string;
    brandSubtitle: string;
    navLinks: ReadonlyArray<DepartmentNavLink>;
    /** دکمهٔ اصلی هدر (مشاوره در تلگرام) — نسخهٔ جمع‌وجور مخصوص هدر */
    ctaClass: string;
    /** رنگ هاور لینک‌های ناوبری با هویت رنگی همان بخش */
    navHoverClass: string;
    /** رنگ حلقهٔ فوکوس با هویت همان بخش */
    outlineClass: string;
  }
> = {
  beauty: {
    brandTitle: "خدمات زیبایی و جوانسازی",
    brandSubtitle: SITE.shortName,
    navLinks: [
      { href: "#service-botox", label: "بوتاکس و تزریقات" },
      { href: "#service-contouring", label: "پیکرتراشی" },
      { href: "#service-mole", label: "برداشتن خال" },
      { href: "#service-skin", label: "جوانسازی پوست" },
      { href: "#consultation", label: "مشاوره و تماس", desktop: false },
    ],
    ctaClass:
      "bg-linear-to-l from-rose-500 to-purple-600 text-white shadow-lg shadow-rose-600/25 transition duration-200 hover:shadow-xl hover:shadow-rose-600/30 hover:brightness-105 active:brightness-95 dark:shadow-rose-900/40",
    navHoverClass:
      "hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-300",
    outlineClass: "focus-visible:outline-rose-600 dark:focus-visible:outline-rose-400",
  },
  products: {
    brandTitle: "محصولات وطندار",
    brandSubtitle: "کالای اصل و منتخب",
    navLinks: [
      { href: "#category-oral-care", label: "مراقبت دهان و دندان" },
      { href: "#category-skin-care", label: "مراقبت پوست" },
      { href: "#category-more", label: "سایر محصولات" },
      { href: "#consultation", label: "مشاوره و تماس", desktop: false },
    ],
    ctaClass:
      "bg-linear-to-l from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-600/25 transition duration-200 hover:shadow-xl hover:shadow-amber-600/30 hover:brightness-105 active:brightness-95 dark:shadow-amber-900/40",
    navHoverClass:
      "hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40 dark:hover:text-amber-300",
    outlineClass: "focus-visible:outline-amber-600 dark:focus-visible:outline-amber-400",
  },
};

/** نشان بخش — همان زبان نشان‌گذاری جعبهٔ مشاورهٔ هر بخش (اسپارکل/سبد خرید) */
const DEPARTMENT_GLYPHS: Record<DepartmentHeaderKey, LucideIcon> = {
  beauty: Sparkles,
  products: ShoppingBag,
};

/**
 * هدر اختصاصی بخش زیبایی یا محصولات — دقیقاً با همان معماری هدر اصلی
 * (شیشه‌ای چسبان، راست‌به‌چپ، منوی موبایل و بستن با Escape) با این
 * تفاوت‌ها: برندینگ همان بخش، پیوند بازگشت به صفحهٔ اصلی دندانپزشکی،
 * لنگرهای بخش خودش به‌جای لینک‌های سراسری، و دکمهٔ اصلی مشاوره به
 * کانال تلگرام و تماس همان بخش (از DEPARTMENT_CONTACTS در site-config).
 *
 * چیدمان یک‌خطی دسکتاپ (همهٔ آیتم‌ها whitespace-nowrap و shrink-0 و بدون
 * هیچ موقعیت‌دهی مطلق):
 *  - ردیف لنگرها از lg نمایان می‌شود (زیر lg منوی همبرگری + کشو).
 *  - دکمهٔ «مشاوره در تلگرام» از xl اضافه می‌شود تا در lg جا شود.
 *  - دکمهٔ گرد آیکون تماس در همهٔ عرض‌ها هست؛ شمارهٔ کامل در کشوی
 *    موبایل، جعبهٔ مشاورهٔ صفحه و فوتر است.
 */
export function DepartmentHeader({
  department,
}: {
  department: DepartmentHeaderKey;
}) {
  const config = DEPARTMENT_HEADER_CONFIG[department];
  const dept = DEPARTMENT_CONTACTS[department];
  const style = DEPT_STYLES[department];
  const Glyph = DEPARTMENT_GLYPHS[department];
  const [menuOpen, setMenuOpen] = useState(false);

  // بستن منوی موبایل با کلید Escape — همان رفتار هدر اصلی سایت
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/70 shadow-[0_1px_0_0_rgb(255_255_255/0.6)_inset] backdrop-blur-xl dark:bg-canvas/60 dark:shadow-none">
      <Container className="flex h-16 items-center justify-between gap-2 lg:h-20">
        {/* برندینگ بخش + پیوند بازگشت به صفحهٔ اصلی دندانپزشکی */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <Link
            href="/"
            aria-label={`بازگشت به صفحهٔ اصلی ${SITE.name}`}
            className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 ${config.outlineClass}`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${style.tile}`}
            >
              <Glyph className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="flex flex-col whitespace-nowrap leading-tight">
              <span className="text-base font-extrabold text-heading">
                {config.brandTitle}
              </span>
              <span className="text-[11px] font-medium text-subtle">
                {config.brandSubtitle}
              </span>
            </span>
          </Link>

          {/* پیوند بازگشت — در جریان عادی فلکس با فاصلهٔ استاندارد؛
              روی موبایل در گزینهٔ نخست منو هست */}
          <Link
            href="/"
            className={`hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-line-strong px-2 py-1.5 text-xs font-semibold text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-heading focus-visible:outline-2 focus-visible:outline-offset-2 sm:inline-flex ${config.outlineClass}`}
          >
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            بازگشت به صفحهٔ اصلی
          </Link>
        </div>

        {/* ناوبری دسکتاپ — فقط لنگرهای همین بخش، همیشه یک خط */}
        <nav
          aria-label={`ناوبری ${config.brandTitle}`}
          className="hidden shrink-0 flex-nowrap items-center gap-1 lg:flex"
        >
          {config.navLinks
            .filter((link) => link.desktop !== false)
            .map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:text-heading ${config.navHoverClass}`}
              >
                {link.label}
              </a>
            ))}
        </nav>

        {/* اقدامات سمت چپ هدر */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* دکمه تغییر حالت روشن/تاریک */}
          <ThemeToggle />

          {/* تماس تلفنی بخش — دکمهٔ گرد آیکون در همهٔ عرض‌ها (یک ضربه، تماس مستقیم) */}
          <a
            href={dept.phoneHref}
            aria-label={`تماس تلفنی — ${dept.title}`}
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition duration-200 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 ${style.tile} ${config.outlineClass}`}
          >
            <Phone className="h-5 w-5" aria-hidden="true" />
          </a>

          {/* مشاوره در تلگرام — از نمای xl به بعد؛ کانال جعبهٔ مشاورهٔ همین بخش */}
          <a
            href={dept.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 xl:inline-flex ${config.ctaClass} ${config.outlineClass}`}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            مشاوره در تلگرام
          </a>

          {/* دکمه باز و بسته کردن منو — تا زیر lg که ردیف لنگرها نیست */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-controls="department-mobile-menu"
            aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-body transition-colors duration-200 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 lg:hidden ${config.outlineClass}`}
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </Container>

      {/* منوی موبایل — تا زیر lg */}
      {menuOpen ? (
        <div
          id="department-mobile-menu"
          className="absolute inset-x-0 top-full border-b border-line bg-canvas/95 shadow-xl shadow-slate-900/5 backdrop-blur-xl lg:hidden dark:shadow-black/30"
        >
          <nav
            aria-label={`ناوبری موبایل ${config.brandTitle}`}
            className="flex flex-col gap-1 px-4 py-4"
          >
            {/* بازگشت به صفحهٔ اصلی دندانپزشکی — گزینهٔ نخست */}
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-base font-medium text-body transition-colors duration-200 hover:bg-surface-2 hover:text-heading ${config.outlineClass}`}
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              بازگشت به صفحهٔ اصلی
            </Link>

            {/* لنگرهای بخش — شامل «مشاوره و تماس» */}
            {config.navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`whitespace-nowrap rounded-xl px-4 py-3 text-base font-medium text-body transition-colors duration-200 hover:bg-surface-2 hover:text-heading ${config.outlineClass}`}
              >
                {link.label}
              </a>
            ))}

            {/* دسترسی سریع به دو راه ارتباطی بخش (تلگرام + تماس) */}
            <div className="mt-3 grid gap-2 border-t border-line pt-4">
              <a
                href={dept.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className={style.btn}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                مشاوره در تلگرام
              </a>
              <a
                href={dept.phoneHref}
                aria-label={`تماس تلفنی — ${dept.title}`}
                onClick={() => setMenuOpen(false)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-3 text-white shadow-sm transition duration-200 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 ${style.tile} ${config.outlineClass}`}
              >
                <span className="inline-flex items-center gap-1.5 text-sm font-bold">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  تماس تلفنی
                </span>
                <span dir="ltr" className="text-xs font-semibold text-white/85">
                  {toPersianDigits(dept.phoneDisplay)}
                </span>
              </a>
            </div>

            {/* شبکه‌های اجتماعی در منوی موبایل — همان کانال‌های کسب‌وکار */}
            <div className="mt-2 flex items-center gap-2">
              <a
                href={dept.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="تلگرام بازرگانی وطندار"
                onClick={() => setMenuOpen(false)}
                className={`inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-line-strong transition-colors duration-200 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 ${config.outlineClass}`}
              >
                <TelegramIcon className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href={RUBIKA_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="روبیکا بازرگانی وطندار"
                onClick={() => setMenuOpen(false)}
                className={`inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-line-strong transition-colors duration-200 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 ${config.outlineClass}`}
              >
                <RubikaIcon className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="اینستاگرام بازرگانی وطندار"
                onClick={() => setMenuOpen(false)}
                className={`inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-line-strong transition-colors duration-200 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 ${config.outlineClass}`}
              >
                <InstagramIcon className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
