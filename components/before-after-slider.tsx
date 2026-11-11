"use client";
/* eslint-disable @next/next/no-img-element --
   آدرس تصاویر را پذیرش از هر دامنهٔ دلخواه وارد می‌کند و افزودن تک‌تک
   دامنه‌ها به پیکربندی next/image ممکن نیست؛ به همین دلیل از img ساده
   با بارگذاری تنبل استفاده می‌شود. */

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ChevronsLeftRight } from "lucide-react";
import { toPersianDigits } from "@/lib/site-config";

type BeforeAfterSliderProps = {
  /** برای برچسب aria تصاویر و دستگیره */
  title: string;
  beforeUrl: string;
  afterUrl: string;
};

/**
 * اسلایدر مقایسهٔ «قبل و بعد» — تصویر «بعد» پایه است و تصویر «قبل» با
 * clip-path از چپ نمایان می‌شود؛ دستگیره با کشیدن ماوس/لمس، کلیک روی
 * تصویر و کلیدهای جهت‌دار جابه‌جا می‌شود (role="slider" برای صفحه‌خوان).
 * موقعیت‌دهی کاملاً فیزیکی است تا در صفحهٔ راست‌به‌چپ هم درست کار کند.
 */
export function BeforeAfterSlider({
  title,
  beforeUrl,
  afterUrl,
}: BeforeAfterSliderProps) {
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  function moveTo(clientX: number) {
    const element = containerRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0) return;
    const percent = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, percent)));
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    draggingRef.current = true;
    setDragging(true);
    // گرفتن اشاره‌گر: کشیدن تا خارجِ کادر هم ادامه می‌یابد
    containerRef.current?.setPointerCapture(event.pointerId);
    moveTo(event.clientX);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (draggingRef.current) moveTo(event.clientX);
  }

  function endDrag() {
    draggingRef.current = false;
    setDragging(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setPos((value) => Math.max(0, value - 4));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setPos((value) => Math.min(100, value + 4));
    } else if (event.key === "Home") {
      event.preventDefault();
      setPos(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setPos(100);
    }
  }

  const smooth = "transition-[clip-path,left] duration-200 ease-out";

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="relative aspect-[4/3] w-full cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-xl bg-canvas"
    >
      {/* لایهٔ پایه: تصویر «بعد» */}
      <img
        src={afterUrl}
        alt={`بعد — ${title}`}
        loading="lazy"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      {/* لایهٔ رویی: تصویر «قبل» — فقط تا موقعیت دستگیره نمایان است */}
      <div
        className={`pointer-events-none absolute inset-0 ${dragging ? "" : smooth}`}
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img
          src={beforeUrl}
          alt={`قبل — ${title}`}
          loading="lazy"
          draggable={false}
          className="h-full w-full object-cover"
        />
      </div>

      {/* برچسب‌های گوشه */}
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
        قبل
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
        بعد
      </span>

      {/* خط و دستگیرهٔ مقایسه */}
      <div
        className={`absolute inset-y-0 -translate-x-1/2 ${dragging ? "" : smooth}`}
        style={{ left: `${pos}%` }}
      >
        <div
          aria-hidden="true"
          className="mx-auto h-full w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.45)]"
        />
        <div
          role="slider"
          tabIndex={0}
          aria-label={`خط مقایسهٔ قبل و بعد — «${title}»`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={`${toPersianDigits(String(Math.round(pos)))} درصد نمای تصویر قبل`}
          onKeyDown={onKeyDown}
          className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10 transition-transform duration-150 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
        >
          <ChevronsLeftRight
            className="h-5 w-5 text-primary-800"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
