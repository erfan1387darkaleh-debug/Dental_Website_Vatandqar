"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  LoaderCircle,
  RotateCw,
  Star,
  Trash2,
} from "lucide-react";
import { services } from "@/data/services";
import { formatJalaliFull } from "@/lib/booking/jalali";
import { tehranDateTimeParts } from "@/lib/booking/time";
import { toPersianDigits } from "@/lib/site-config";
import type { TestimonialRecord } from "@/lib/testimonials/service";

type StatusFilter = "pending" | "approved" | "all";

const FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "pending", label: "در انتظار تأیید" },
  { value: "approved", label: "تأییدشده" },
  { value: "all", label: "همه" },
];

function serviceTitle(id: string): string {
  return services.find((service) => service.id === id)?.title ?? id;
}

/** ستاره‌های کوچک امتیاز در فهرست پنل */
function SmallStars({ rating }: { rating: number }) {
  return (
    <div
      role="img"
      aria-label={`امتیاز ${toPersianDigits(String(rating))} از ۵`}
      className="flex items-center gap-0.5"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${
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

/**
 * مدیریت نظرات بیماران در پنل پذیرش — تأیید، حذف و فهرست بر حسب وضعیت.
 * دسترسی عملی این بخش فقط به‌وسیلهٔ خود سرور کنترل می‌شود (هر مسیر API
 * توکن نشست را جداگانه سنجیده و در نبود اعتبار ۴۰۱ می‌دهد).
 */
export function TestimonialsPanel() {
  const router = useRouter();
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [rows, setRows] = useState<TestimonialRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/admin/login");
  }, [router]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setConfirmDeleteId(null);
    try {
      const response = await fetch(
        `/api/admin/testimonials?status=${encodeURIComponent(status)}`,
        { cache: "no-store" },
      );
      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          typeof data === "object" &&
            data !== null &&
            typeof (data as { message?: unknown }).message === "string"
            ? (data as { message: string }).message
            : "خواندن نظرات ناموفق بود؛ دوباره تلاش کنید.",
        );
        return;
      }
      const list =
        typeof data === "object" && data !== null
          ? (data as { testimonials?: unknown }).testimonials
          : null;
      setRows(Array.isArray(list) ? (list as TestimonialRecord[]) : []);
    } catch {
      setError("اتصال ناموفق بود؛ دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }, [status, redirectToLogin]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function act(
    method: "PATCH" | "DELETE",
    row: TestimonialRecord,
    label: string,
  ) {
    setActionPendingId(row.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/testimonials?id=${encodeURIComponent(row.id)}`,
        { method },
      );
      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        setError(
          typeof data === "object" &&
            data !== null &&
            typeof (data as { message?: unknown }).message === "string"
            ? (data as { message: string }).message
            : `${label} ناموفق بود؛ دوباره تلاش کنید.`,
        );
        return;
      }
      await refresh();
    } catch {
      setError("اتصال ناموفق بود؛ دوباره تلاش کنید.");
    } finally {
      setActionPendingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
      <div className="mt-8 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-6">
        <div>
          <h2 className="text-lg font-extrabold text-heading sm:text-xl">
            نظرات بیماران
          </h2>
          <p className="mt-1 text-sm text-muted">
            نظر تازه همیشه «در انتظار تأیید» ثبت می‌شود؛ تنها نظرات
            تأییدشده در سایت عمومی نمایش داده می‌شوند.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="فیلتر وضعیت نظرات"
            className="flex overflow-hidden rounded-full border border-line-strong bg-surface"
          >
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatus(filter.value)}
                aria-pressed={status === filter.value}
                className={`px-4 py-2 text-xs font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300 ${
                  status === filter.value
                    ? "bg-primary-700 text-white"
                    : "text-heading hover:bg-tint"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            aria-label="به‌روزرسانی فهرست"
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-2 text-xs font-bold text-heading transition-colors duration-200 hover:bg-tint disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
          >
            <RotateCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            به‌روزرسانی
          </button>
        </div>
      </div>

      {error ? (
        <p
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      ) : null}

      {rows === null ? (
        <div
          aria-hidden="true"
          className="mt-4 h-24 animate-pulse rounded-2xl border border-line bg-surface"
        />
      ) : rows.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
          نظری در این وضعیت ثبت نشده است.
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
          {rows.map((row) => {
            const date = tehranDateTimeParts(Date.parse(row.createdAt)).date;
            return (
              <li
                key={row.id}
                className="rounded-2xl border border-line bg-surface p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-heading">
                      {row.patientName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {`${serviceTitle(row.treatmentType)} — ${formatJalaliFull(date)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SmallStars rating={row.rating} />
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        row.isApproved
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                      }`}
                    >
                      {row.isApproved ? "تأییدشده" : "در انتظار تأیید"}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {row.comment}
                </p>
                <div className="mt-4 flex items-center justify-end gap-2 border-t border-dashed border-line-strong pt-3">
                  {!row.isApproved ? (
                    <button
                      type="button"
                      onClick={() => void act("PATCH", row, "تأیید نظر")}
                      disabled={actionPendingId !== null}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 py-2 text-xs font-bold text-emerald-700 transition-colors duration-200 hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-line-strong dark:text-emerald-300 dark:hover:bg-emerald-950/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
                    >
                      {actionPendingId === row.id ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      )}
                      تأیید و نمایش
                    </button>
                  ) : null}
                  {confirmDeleteId === row.id ? (
                    <span className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void act("DELETE", row, "حذف نظر")}
                        disabled={actionPendingId !== null}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                      >
                        {actionPendingId === row.id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        )}
                        حذف قطعی
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-full border border-line-strong bg-surface px-3 py-2 text-xs font-bold text-heading transition-colors duration-200 hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
                      >
                        انصراف
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(row.id)}
                      disabled={actionPendingId !== null}
                      aria-label={`حذف نظر ${row.patientName}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 py-2 text-xs font-bold text-red-700 transition-colors duration-200 hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-950/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      حذف
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
