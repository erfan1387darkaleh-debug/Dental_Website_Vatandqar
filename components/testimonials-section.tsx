"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, PenLine, Quote, Star } from "lucide-react";
import { services } from "@/data/services";
import { btnPrimary, btnSecondary } from "@/lib/styles";
import { toPersianDigits } from "@/lib/site-config";
import { formatJalaliFull } from "@/lib/booking/jalali";
import { tehranDateTimeParts } from "@/lib/booking/time";
import type { TestimonialRecord } from "@/lib/testimonials/service";
import { SectionHeading } from "@/components/section-heading";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { scheduleIdle } from "@/lib/schedule-idle";

type PublicTestimonialsResult = { testimonials?: unknown };

/** ستاره‌های امتیاز — پرشده تا اندازهٔ امتیاز، خالی برای باقی */
function RatingStars({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  return (
    <div
      role="img"
      aria-label={`امتیاز ${toPersianDigits(String(rating))} از ۵`}
      className="flex items-center gap-0.5"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={`${size} ${
            index < rating
              ? "fill-amber-400 text-amber-400"
              : "text-line-strong dark:text-line"
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/** برچسب فارسی نوع خدمت از دادهٔ مرکزی خدمات */
function serviceTitle(id: string): string {
  return services.find((service) => service.id === id)?.title ?? id;
}

/**
 * بخش «نظر بیماران» در صفحهٔ اصلی — کارت‌های نظرات تأییدشده (خوانده از
 * API عمومی؛ بدون هیچ دادهٔ جعلی) و فرم ثبت نظر تازه. نظر تازه پس از
 * تأیید پذیرش در همین بخش نمایش داده می‌شود.
 */
export function TestimonialsSection() {
  const [rows, setRows] = useState<TestimonialRecord[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const loadApproved = useCallback(async () => {
    try {
      const response = await fetch("/api/testimonials");
      if (!response.ok) {
        // بخش نظرات فرعی است؛ خطای خواندن، صفحه را مختل نمی‌کند
        console.error("[testimonials] خواندن نظرات ناموفق بود.");
        setRows([]);
        return;
      }
      const data: PublicTestimonialsResult | null = await response
        .json()
        .catch(() => null);
      const list =
        data !== null && typeof data === "object"
          ? (data as PublicTestimonialsResult).testimonials
          : null;
      setRows(Array.isArray(list) ? (list as TestimonialRecord[]) : []);
    } catch {
      setRows([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cancelIdle = scheduleIdle(() => {
      if (!cancelled) void loadApproved();
    });
    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, [loadApproved]);

  const hasApproved = (rows?.length ?? 0) > 0;

  return (
    <section aria-labelledby="testimonials-heading">
      <Container className="py-16 sm:py-20 lg:py-24">
        <SectionHeading
          id="testimonials-heading"
          eyebrow="نظر بیماران"
          title="تجربهٔ مراجعان ما"
          description="گفتهٔ واقعی بیمارانی که از خدمات ما استفاده کرده‌اند؛ هر نظر پیش از نمایش، توسط پذیرش بررسی و تأیید می‌شود."
        />

        {rows === null ? null : hasApproved ? (
          <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {rows.map((testimonial, index) => (
              <Reveal
                key={testimonial.id}
                delay={Math.min(index, 8) * 60}
                className="h-full"
              >
                <TestimonialCard testimonial={testimonial} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-7 text-muted">
            هنوز نظری برای نمایش تأیید نشده است؛ اگر از خدمات ما استفاده
            کرده‌اید، خوشحال می‌شویم نظر خود را ثبت کنید.
          </p>
        )}

        <div className="mt-8 text-center">
          {formOpen ? (
            <TestimonialForm
              onDone={() => {
                setFormOpen(false);
                void loadApproved();
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className={btnSecondary}
            >
              <PenLine className="h-4 w-4" aria-hidden="true" />
              ثبت نظر شما
            </button>
          )}
        </div>
      </Container>
    </section>
  );
}

/** کارت نمایش یک نظر تأییدشده */
function TestimonialCard({ testimonial }: { testimonial: TestimonialRecord }) {
  const date = tehranDateTimeParts(Date.parse(testimonial.createdAt)).date;
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line-strong bg-surface-2/85 p-6 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <Quote className="h-6 w-6 shrink-0 text-primary-200 dark:text-primary-800" aria-hidden="true" />
        <RatingStars rating={testimonial.rating} />
      </div>
      <p className="mt-4 text-sm leading-7 text-muted">
        {testimonial.comment}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-line-strong pt-4">
        <div>
          <p className="text-sm font-bold text-heading">
            {testimonial.patientName}
          </p>
          <p className="mt-0.5 text-xs text-muted">{formatJalaliFull(date)}</p>
        </div>
        <span className="rounded-full bg-tint px-3 py-1 text-xs font-bold text-accent">
          {serviceTitle(testimonial.treatmentType)}
        </span>
      </div>
    </article>
  );
}

/** فرم ثبت نظر — ارسال به API عمومی؛ نمایش فقط پس از تأیید پذیرش */
function TestimonialForm({ onDone }: { onDone: () => void }) {
  const [patientName, setPatientName] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [treatmentType, setTreatmentType] = useState(services[0].id);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit() {
    if (rating < 1) {
      setError("امتیاز باید عددی بین ۱ تا ۵ باشد.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientName, comment, rating, treatmentType }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (response.ok) {
        setSuccess(
          typeof data === "object" &&
            data !== null &&
            typeof (data as { message?: unknown }).message === "string"
            ? (data as { message: string }).message
            : "نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود.",
        );
        // کمی فرصت برای خواندن پیام، سپس بازگشت به حالت عادی
        window.setTimeout(onDone, 2500);
        return;
      }
      setError(
        typeof data === "object" &&
          data !== null &&
          typeof (data as { message?: unknown }).message === "string"
          ? (data as { message: string }).message
          : "ثبت نظر ناموفق بود؛ دوباره تلاش کنید.",
      );
    } catch {
      setError("اتصال ناموفق بود؛ دوباره تلاش کنید.");
    } finally {
      setPending(false);
    }
  }

  if (success !== null) {
    return (
      <div className="mx-auto max-w-2xl">
        <p
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          role="status"
          aria-live="polite"
        >
          {success}
        </p>
      </div>
    );
  }

  return (
    <form
      className="mx-auto grid max-w-2xl gap-4 rounded-2xl border border-line-strong bg-surface-2/85 p-6 text-start backdrop-blur-md"
      onSubmit={(event) => {
        event.preventDefault();
        if (!pending) void submit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="testimonial-name"
            className="block text-sm font-bold text-heading"
          >
            نام و نام خانوادگی
          </label>
          <input
            id="testimonial-name"
            type="text"
            required
            minLength={2}
            maxLength={60}
            value={patientName}
            onChange={(event) => setPatientName(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-line-strong bg-canvas px-3 py-2.5 text-sm text-heading transition-colors duration-200 focus:border-primary-400 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
          />
        </div>
        <div>
          <label
            htmlFor="testimonial-treatment"
            className="block text-sm font-bold text-heading"
          >
            خدمت دریافتی
          </label>
          <select
            id="testimonial-treatment"
            value={treatmentType}
            onChange={(event) => setTreatmentType(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-line-strong bg-canvas px-3 py-2.5 text-sm text-heading transition-colors duration-200 focus:border-primary-400 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className="block text-sm font-bold text-heading">امتیاز شما</span>
        <div className="mt-1.5 flex items-center gap-1">
          {Array.from({ length: 5 }, (_, index) => {
            const value = index + 1;
            const active = value <= rating;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                aria-label={`ثبت امتیاز ${toPersianDigits(String(value))} از ۵`}
                aria-pressed={active}
                className="rounded-lg p-1 transition-colors duration-200 hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
              >
                <Star
                  className={`h-6 w-6 ${
                    active
                      ? "fill-amber-400 text-amber-400"
                      : "text-line-strong dark:text-line"
                  }`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor="testimonial-comment"
          className="block text-sm font-bold text-heading"
        >
          متن نظر
        </label>
        <textarea
          id="testimonial-comment"
          required
          minLength={10}
          maxLength={500}
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="mt-1.5 w-full resize-y rounded-xl border border-line-strong bg-canvas px-3 py-2.5 text-sm leading-7 text-heading transition-colors duration-200 focus:border-primary-400 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
        />
        <p className="mt-1 text-xs text-muted">
          {`${toPersianDigits(String(comment.length))} از ۵۰۰ نویسه`}
        </p>
      </div>

      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {pending ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : null}
        ارسال نظر
      </button>
    </form>
  );
}
