"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { beautyServices } from "@/data/beauty-services";
import { productCategories } from "@/data/products";
import { services } from "@/data/services";

/** کلاس‌های لینک — دقیقاً همان استایل ستون خدمات فوتر (یکدستی ظاهری) */
const LINK_CLASS =
  "text-sm text-slate-400 transition-colors duration-200 hover:text-sky-400";
const ALL_CLASS =
  "text-sm font-medium text-sky-400 transition-colors duration-200 hover:text-sky-300";

type FooterServiceLink = { href: string; label: string };

type ColumnVariant = {
  /** عنوان ستون (h2) */
  heading: string;
  /** برچسب دسترس‌پذیری ناوبری ستون */
  ariaLabel: string;
  /** لینک‌های تخصصی همان بخش */
  links: FooterServiceLink[];
  /** لینک پایانی «مشاهده همه…» */
  allHref: string;
  allLabel: string;
};

/**
 * انطباق ستون خدمات فوتر با صفحهٔ جاری:
 *  - /beauty*   → لینک‌های عمیق به هر حوزهٔ خدمات زیبایی (لنگر کارت‌ها)
 *  - /products* → لینک‌های عمیق به هر دستهٔ محصولات (لنگر کارت‌ها)
 *  - بقیه صفحات → فهرست خدمات دندانپزشکی (رفتار فعلی، بدون تغییر)
 * داده‌ها فقط از فایل‌های دادهٔ واقعی خوانده می‌شود؛ چیز جدیدی
 * از خود نساخته نمی‌شود.
 */
function getColumn(pathname: string): ColumnVariant {
  if (pathname.startsWith("/beauty")) {
    return {
      heading: "خدمات زیبایی",
      ariaLabel: "فهرست خدمات زیبایی",
      links: beautyServices.map((service) => ({
        href: `/beauty#service-${service.id}`,
        label: service.title,
      })),
      allHref: "/beauty",
      allLabel: "مشاهده همه خدمات زیبایی...",
    };
  }
  if (pathname.startsWith("/products")) {
    return {
      heading: "محصولات",
      ariaLabel: "فهرست دسته‌های محصولات",
      links: productCategories.map((category) => ({
        href: `/products#category-${category.id}`,
        label: category.title,
      })),
      allHref: "/products",
      allLabel: "مشاهده همه محصولات وطندار...",
    };
  }
  return {
    heading: "خدمات",
    ariaLabel: "فهرست خدمات",
    links: services.slice(0, 5).map((service) => ({
      href: "/services",
      label: service.title,
    })),
    allHref: "/services",
    allLabel: "مشاهده همه خدمات...",
  };
}

/**
 * ستون «خدمات/محصولات» فوتر — جزیرهٔ کلاینت کوچک؛ با usePathname
 * محتوای ستون را بسته به صفحهٔ جاری عوض می‌کند. رندر اولیهٔ سمت سرور
 * هر صفحهٔ استاتیک با مسیر همان صفحه انجام می‌شود و در جابه‌جایی
 * کلاینتی هم به‌روز می‌ماند.
 */
export function FooterServicesColumn() {
  const column = getColumn(usePathname());

  return (
    <nav aria-label={column.ariaLabel}>
      <h2 className="text-sm font-bold text-slate-100">{column.heading}</h2>
      <ul className="mt-4 space-y-2.5">
        {column.links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className={LINK_CLASS}>
              {link.label}
            </Link>
          </li>
        ))}
        <li>
          <Link href={column.allHref} className={ALL_CLASS}>
            {column.allLabel}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
