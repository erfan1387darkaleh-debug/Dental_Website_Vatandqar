"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/site-config";

/** کلاس لینک‌ها — دقیقاً همان استایل قبلی ستون دسترسی سریع فوتر */
const LINK_CLASS =
  "text-sm text-slate-400 transition-colors duration-200 hover:text-sky-400";

/**
 * مقصد زمینه‌ای لینک «تماس و مشاوره» — بسته به صفحهٔ جاری به بخش
 * تماس همان صفحه اسکرول می‌شود:
 *  - «/»        → ‎#contact (بخش یکپارچهٔ تماس و مشاورهٔ صفحهٔ اصلی)
 *  - «/beauty»  → ‎#consultation (جعبهٔ مشاورهٔ بخش زیبایی در همان صفحه)
 *  - «/products» → ‎#consultation (جعبهٔ مشاورهٔ بخش محصولات در همان صفحه)
 *  - بقیهٔ صفحات دندانپزشکی → ‎/#contact (همان رفتار قبلی: پرش به تماسِ صفحهٔ اصلی)
 */
function contactHref(pathname: string): string {
  if (pathname.startsWith("/beauty") || pathname.startsWith("/products")) {
    return "#consultation";
  }
  if (pathname === "/") {
    return "#contact";
  }
  return "/#contact";
}

/**
 * ستون «دسترسی سریع» فوتر — جزیرهٔ کلاینت کوچک؛ همان NAV_LINKS را رندر
 * می‌کند با این تفاوت که مقصد لینک «تماس و مشاوره» بسته به صفحهٔ جاری
 * انطباق می‌یابد. لینک‌های هم‌صفحه (شروع با #) با <a> ساده رندر می‌شوند
 * تا اسکرول نرم بومی مرورگر (به‌همراه پشتیبانی reduced-motion) اجرا شود.
 */
export function FooterQuickLinks() {
  const pathname = usePathname();

  return (
    <nav aria-label="دسترسی سریع">
      <h2 className="text-sm font-bold text-slate-100">دسترسی سریع</h2>
      <ul className="mt-4 space-y-2.5">
        {NAV_LINKS.map((link) => {
          const href =
            link.href === "/#contact" ? contactHref(pathname) : link.href;
          return (
            <li key={link.href}>
              {href.startsWith("#") ? (
                <a href={href} className={LINK_CLASS}>
                  {link.label}
                </a>
              ) : (
                <Link
                  href={href}
                  target={link.newTab ? "_blank" : undefined}
                  rel={link.newTab ? "noopener noreferrer" : undefined}
                  className={LINK_CLASS}
                >
                  {link.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
