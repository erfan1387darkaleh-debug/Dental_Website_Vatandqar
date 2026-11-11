"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { InstagramIcon } from "@/components/instagram-icon";
import { TelegramIcon } from "@/components/telegram-icon";
import { RubikaIcon } from "@/components/rubika-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, Phone, X } from "lucide-react";
import {
  BRANCHES,
  CONSULTANTS,
  INSTAGRAM_URL,
  NAV_LINKS,
  RUBIKA_URL,
  SITE,
  TELEGRAM_URL,
  toPersianDigits,
} from "@/lib/site-config";
import { ToothLogo } from "@/components/tooth-logo";
import { Container } from "@/components/container";

/** لینک‌های ناوبری هدر — همان NAV_LINKS به‌علاوه لینک مستقیم به
 *  سامانهٔ نوبت‌دهی (فوتر فقط از NAV_LINKS استفاده می‌کند) */
const HEADER_NAV_LINKS: { href: string; label: string }[] = [
  ...NAV_LINKS,
  { href: "/booking", label: "رزرو نوبت" },
];

/** هدر اصلی سایت — ناوبری دسکتاپ + منوی موبایل + انتخاب شعبه برای تماس */
export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const callRef = useRef<HTMLDivElement>(null);

  // بستن منو و پاپ‌آور انتخاب شعبه با کلید Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setCallOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // بستن پاپ‌آور انتخاب شعبه با کلیک بیرون از آن
  useEffect(() => {
    if (!callOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (callRef.current && !callRef.current.contains(event.target as Node)) {
        setCallOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown);
  }, [callOpen]);

  const isActiveLink = (href: string) => {
    if (href.startsWith("/#")) return false; // لینک‌های داخل صفحه فعال‌سازی دائمی ندارند
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-3 lg:h-20">
        {/* لوگو و نام دندانپزشکی */}
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
          aria-label={SITE.name}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-700 text-white shadow-sm">
            <ToothLogo className="h-6 w-6" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-extrabold text-heading sm:text-lg">
              {SITE.shortName}
            </span>
            <span className="text-[11px] font-medium text-subtle">
              {SITE.subtitle}
            </span>
          </span>
        </Link>

        {/* ناوبری دسکتاپ */}
        <nav aria-label="ناوبری اصلی" className="hidden items-center gap-1 md:flex">
          {HEADER_NAV_LINKS.map((link) => {
            const active = isActiveLink(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  active
                    ? "bg-tint text-accent-strong"
                    : "text-muted hover:bg-surface-2 hover:text-heading"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* اقدامات سمت چپ هدر */}
        <div className="flex items-center gap-2">
          {/* دکمه تغییر حالت روشن/تاریک */}
          <ThemeToggle />

          {/* انتخاب شعبه برای تماس — پاپ‌آور دو شعبه (دسکتاپ و موبایل) */}
          <div ref={callRef} className="relative">
            <button
              type="button"
              onClick={() => setCallOpen((prev) => !prev)}
              aria-expanded={callOpen}
              aria-controls="branch-call-menu"
              aria-haspopup="true"
              className="hidden items-center gap-2 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-800 dark:hover:bg-primary-600 lg:inline-flex"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              تماس با شعبه‌ها
            </button>

            <button
              type="button"
              onClick={() => setCallOpen((prev) => !prev)}
              aria-expanded={callOpen}
              aria-controls="branch-call-menu"
              aria-haspopup="true"
              aria-label="تماس با شعبه‌ها"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-700 text-white shadow-sm transition-colors duration-200 hover:bg-primary-800 dark:hover:bg-primary-600 lg:hidden"
            >
              <Phone className="h-5 w-5" aria-hidden="true" />
            </button>

            {callOpen ? (
              <div
                id="branch-call-menu"
                aria-label="تماس با شعبه‌ها و مشاوران"
                className="absolute left-0 top-full z-10 mt-2 w-72 rounded-2xl border border-line bg-surface p-2 shadow-xl shadow-slate-900/10 dark:shadow-black/40"
              >
                {/* گروه اول: شعبه‌ها */}
                <p className="px-3 pb-1 pt-2 text-xs font-bold text-subtle">
                  تماس با شعبه‌ها
                </p>
                {BRANCHES.map((branch) => (
                  <a
                    key={branch.id}
                    href={branch.telHref}
                    aria-label={`تماس با ${branch.descriptor}`}
                    onClick={() => setCallOpen(false)}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors duration-200 hover:bg-surface-2"
                  >
                    <span className="flex min-w-0 flex-col text-start">
                      <span className="text-xs font-medium text-subtle">
                        {branch.descriptor}
                      </span>
                      <span className="text-sm font-extrabold text-heading">
                        {`شعبه ${branch.name}`}
                      </span>
                    </span>
                    <span
                      dir="ltr"
                      className="shrink-0 text-sm font-extrabold text-accent"
                    >
                      {toPersianDigits(branch.displayPhone)}
                    </span>
                  </a>
                ))}

                {/* جداکننده ظریف دو گروه */}
                <div
                  className="mx-3 my-1 border-t border-line"
                  aria-hidden="true"
                />

                {/* گروه دوم: مشاوران */}
                <p className="px-3 pb-1 pt-2 text-xs font-bold text-subtle">
                  تماس با مشاوران
                </p>
                {CONSULTANTS.map((consultant, index) => (
                  <a
                    key={consultant.name}
                    href={consultant.telHref}
                    aria-label={`تماس با مشاور ${consultant.name}`}
                    onClick={() => setCallOpen(false)}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors duration-200 hover:bg-surface-2"
                  >
                    <span className="flex min-w-0 flex-col text-start">
                      <span className="text-xs font-medium text-subtle">
                        {`مشاور ${toPersianDigits(String(index + 1))}`}
                      </span>
                      <span className="text-sm font-extrabold text-heading">
                        {consultant.name}
                      </span>
                    </span>
                    <span
                      dir="ltr"
                      className="shrink-0 text-sm font-extrabold text-accent"
                    >
                      {toPersianDigits(consultant.displayPhone)}
                    </span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {/* دکمه باز و بسته کردن منوی موبایل */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line-strong text-body transition-colors duration-200 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300 md:hidden"
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </Container>

      {/* منوی موبایل */}
      {menuOpen ? (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full border-b border-line bg-canvas shadow-xl shadow-slate-900/5 md:hidden dark:shadow-black/30"
        >
          <nav aria-label="ناوبری موبایل" className="flex flex-col gap-1 px-4 py-4">
            {HEADER_NAV_LINKS.map((link) => {
              const active = isActiveLink(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl px-4 py-3 text-base font-medium transition-colors duration-200 ${
                    active
                      ? "bg-tint text-accent-strong"
                      : "text-body hover:bg-surface-2 hover:text-heading"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* دسترسی سریع به تماس با شعبه‌ها در منوی موبایل */}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-4">
              {BRANCHES.map((branch) => (
                <a
                  key={branch.id}
                  href={branch.telHref}
                  aria-label={`تماس با ${branch.descriptor}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl bg-primary-700 px-4 py-3 text-white transition-colors duration-200 hover:bg-primary-800 dark:hover:bg-primary-600"
                >
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {`شعبه ${branch.name}`}
                  </span>
                  <span dir="ltr" className="text-xs font-semibold text-primary-100">
                    {toPersianDigits(branch.displayPhone)}
                  </span>
                </a>
              ))}
            </div>

            {/* شبکه‌های اجتماعی در منوی موبایل */}
            <div className="mt-2 flex items-center gap-2">
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="تلگرام بازرگانی وطندار"
                className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-line-strong transition-colors duration-200 hover:bg-surface-2 hover:border-primary-300 dark:hover:border-primary-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
              >
                <TelegramIcon className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href={RUBIKA_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="روبیکا بازرگانی وطندار"
                className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-line-strong transition-colors duration-200 hover:bg-surface-2 hover:border-primary-300 dark:hover:border-primary-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
              >
                <RubikaIcon className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="اینستاگرام بازرگانی وطندار"
                className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-line-strong transition-colors duration-200 hover:bg-surface-2 hover:border-primary-300 dark:hover:border-primary-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
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
