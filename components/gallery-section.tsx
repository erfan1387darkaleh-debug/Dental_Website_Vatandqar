"use client";

import { useEffect, useState } from "react";
import { services } from "@/data/services";
import type { PublicGalleryCase } from "@/lib/gallery/service";
import { SectionHeading } from "@/components/section-heading";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { scheduleIdle } from "@/lib/schedule-idle";
import { BeforeAfterSlider } from "@/components/before-after-slider";

type PublicGalleryResult = { cases?: unknown };

/** برچسب فارسی نوع خدمت از دادهٔ مرکزی خدمات */
function serviceTitle(id: string): string {
  return services.find((service) => service.id === id)?.title ?? id;
}

/**
 * بخش «قبل و بعد درمان‌ها» در صفحهٔ اصلی — نمونه‌های منتشرشده از API
 * عمومی خوانده می‌شود (بدون هیچ دادهٔ جعلی) و با چیپ‌های فیلتر بر حسب
 * نوع خدمت نمایش داده می‌شود؛ صفحهٔ اصلی به‌صورت ایستا می‌ماند.
 */
export function GallerySection() {
  const [cases, setCases] = useState<PublicGalleryCase[] | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    async function loadCases() {
      try {
        const response = await fetch("/api/gallery");
        if (!response.ok) {
          // بخش نمونه‌کارها فرعی است؛ خطای خواندن، صفحه را مختل نمی‌کند
          console.error("[gallery] خواندن نمونه‌کارها ناموفق بود.");
          setCases([]);
          return;
        }
        const data: PublicGalleryResult | null = await response
          .json()
          .catch(() => null);
        const list =
          data !== null && typeof data === "object"
            ? (data as PublicGalleryResult).cases
            : null;
        setCases(Array.isArray(list) ? (list as PublicGalleryCase[]) : []);
      } catch {
        setCases([]);
      }
    }
    const cancelIdle = scheduleIdle(() => {
      if (!cancelled) void loadCases();
    });
    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, []);

  const rows = cases ?? [];
  const visible =
    filter === "all"
      ? rows
      : rows.filter((row) => row.treatmentType === filter);

  // چیپ‌های فیلتر فقط از خدمت‌های موجود در نمونه‌ها — به ترتیب فهرست مرکزی
  const presentTreatments = services
    .map((service) => service.id)
    .filter((id) => rows.some((row) => row.treatmentType === id));
  const chips: Array<{ id: string; label: string }> = [
    { id: "all", label: "همه" },
    ...presentTreatments.map((id) => ({ id, label: serviceTitle(id) })),
  ];

  return (
    <section
      id="gallery"
      aria-labelledby="gallery-heading"
      className="scroll-mt-20"
    >
      <Container className="py-16 sm:py-20 lg:py-24">
        <SectionHeading
          id="gallery-heading"
          eyebrow="نمونه‌کارها"
          title="قبل و بعدِ درمان‌ها"
          description="نتیجهٔ واقعی برخی درمان‌های انجام‌شده در مطب ما؛ دستگیرهٔ هر تصویر را بکشید تا تفاوت پیش و پس از درمان را ببینید."
        />

        {chips.length > 1 ? (
          <div
            role="group"
            aria-label="فیلتر نمونه‌کارها بر حسب خدمت"
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
          >
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id)}
                aria-pressed={filter === chip.id}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300 ${
                  filter === chip.id
                    ? "border-primary-700 bg-primary-700 text-white"
                    : "border-line-strong bg-surface text-heading hover:border-primary-300 hover:bg-tint hover:text-primary-800 dark:hover:border-primary-700 dark:hover:bg-primary-900/40 dark:hover:text-primary-200"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        ) : null}

        {cases === null ? null : visible.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5">
            {visible.map((galleryCase, index) => (
              <Reveal
                key={galleryCase.id}
                delay={Math.min(index, 6) * 60}
                className="h-full"
              >
                <GalleryCard galleryCase={galleryCase} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-7 text-muted">
            هنوز نمونه‌ای برای نمایش منتشر نشده است؛ به‌زودی نمونه‌های
            درمان‌های ما در این بخش قرار می‌گیرد.
          </p>
        )}
      </Container>
    </section>
  );
}

/** کارت نمایش یک نمونهٔ قبل و بعد */
function GalleryCard({ galleryCase }: { galleryCase: PublicGalleryCase }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line-strong bg-surface-2/85 p-4 backdrop-blur-md sm:p-5">
      <BeforeAfterSlider
        title={galleryCase.title}
        beforeUrl={galleryCase.beforeImageUrl}
        afterUrl={galleryCase.afterImageUrl}
      />
      <div className="mt-4 flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-bold text-heading">
          {galleryCase.title}
        </h3>
        <span className="rounded-full bg-tint px-3 py-1 text-xs font-bold text-accent">
          {serviceTitle(galleryCase.treatmentType)}
        </span>
      </div>
      {galleryCase.description ? (
        <p className="mt-2 text-sm leading-7 text-muted">
          {galleryCase.description}
        </p>
      ) : null}
    </article>
  );
}
