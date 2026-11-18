"use client";

/*
 * اسکرول نرم سراسری با Lenis — یک نمونه برای کل سایت.
 *
 * چرا این‌جا؟ چیدمان ریشه (app/layout.tsx) در جابه‌جایی بین صفحه‌ها
 * از نو سوار نمی‌شود؛ پس Lenis فقط یک بار ساخته می‌شود، یک حلقهٔ
 * requestAnimationFrame دارد (autoRaf خودِ کتابخانه) و با unmount شدن
 * کامل پاک‌سازی می‌شود. استفاده از <ReactLenis root /> رسمی این پکیج،
 * نمونهٔ سراسری را بدون هیچ wrapper اضافی در DOM می‌سازد.
 *
 * تنظیم‌ها:
 *  - lerp: 0.1 → همان مقدار پیش‌فرض و آزمودهٔ Lenis؛ مومنتوم طبیعی
 *    چرخ ماوس بدون شتاب یا توقف مصنوعی.
 *  - smoothWheel: فقط چرخ ماوس نرم می‌شود؛ syncTouch خاموش است تا
 *    لمس موبایل همان اسکرول بومی و طبیعی مرورگر بماند.
 *  - respectReducedMotion: وقتی کاربر «کاهش حرکت» را انتخاب کرده،
 *    Lenis نرم‌سازی را کنار می‌گذارد و پرش‌ها فوری می‌شوند (حتی اگر
 *    تنظیم سیستم در همان نشست عوض شود).
 *  - stopInertiaOnNavigate: با کلیک روی لینک صفحهٔ دیگر، مومنتوم
 *    اسکرول متوقف می‌شود تا صفحهٔ جدید از بالا و آرام باز شود.
 *
 * ناوبری لنگرها (مثل «تماس با ما» → ‎/#contact‎) در SmoothAnchors
 * با همان lenis.scrollTo انجام می‌شود؛ Lenis خودش scroll-margin-top
 * مقصد (کلاس‌های scroll-mt-*) را رعایت می‌کند، پس هدر چسبان روی
 * عنوان بخش نمی‌افتد.
 */

import "lenis/dist/lenis.css";
import type { LenisOptions } from "lenis";
import { ReactLenis, useLenis } from "lenis/react";
import { useEffect } from "react";

/* شیء ثابت در سطح ماژول: اگر داخل رندر ساخته شود، آداپتور React در هر
 * رندر نمونهٔ تازه می‌سازد (وابستگی‌اش JSON همین گزینه‌هاست). */
const LENIS_OPTIONS: LenisOptions = {
  autoRaf: true,
  lerp: 0.1,
  smoothWheel: true,
  syncTouch: false,
  wheelMultiplier: 1,
  touchMultiplier: 1,
  autoResize: true,
  overscroll: true,
  respectReducedMotion: true,
  stopInertiaOnNavigate: true,
};

/**
 * کلیک روی لینک‌های لنگرِ همان صفحه را به Lenis می‌سپارد تا هم نرم
 * باشد و هم اسکرول بومی مرورگر با آن رقابت نکند. در فاز capture اجرا
 * می‌شود تا پیش از <Link> نکست جلوگیری از رفتار پیش‌فرض انجام شود؛
 * handlerهای خود لینک (مثل بستن منوی موبایل) دست‌نخورده می‌مانند.
 */
function SmoothAnchors() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const source = event.target;
      if (!(source instanceof Element)) return;

      const anchor = source.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      // لینک‌های ویژه (مثل «پرش به محتوای اصلی») باید فوری بپرند.
      if (anchor.dataset.skipSmoothScroll !== undefined) return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin) return;
      if (!url.hash || url.hash === "#") return;
      // فقط لنگرهای همین صفحه؛ لینک به صفحهٔ دیگر را نکست ناوبری می‌کند.
      if (
        url.pathname !== window.location.pathname ||
        url.search !== window.location.search
      ) {
        return;
      }

      const target = document.getElementById(
        decodeURIComponent(url.hash.slice(1)),
      );
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target);

      if (window.location.hash === url.hash) {
        window.history.replaceState(null, "", url.hash);
      } else {
        window.history.pushState(null, "", url.hash);
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () =>
      document.removeEventListener("click", handleClick, { capture: true });
  }, [lenis]);

  return null;
}

export function SmoothScroll() {
  return (
    <>
      <ReactLenis root options={LENIS_OPTIONS} />
      <SmoothAnchors />
    </>
  );
}
