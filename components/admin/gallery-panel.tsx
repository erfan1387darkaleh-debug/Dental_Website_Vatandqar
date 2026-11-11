"use client";
/* eslint-disable @next/next/no-img-element --
   آدرس تصاویر را پذیرش از هر دامنهٔ دلخواه وارد می‌کند و افزودن تک‌تک
   دامنه‌ها به پیکربندی next/image ممکن نیست؛ به همین دلیل از img ساده
   با بارگذاری تنبل استفاده می‌شود. */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCw,
  Trash2,
} from "lucide-react";
import { services } from "@/data/services";
import { formatJalaliFull } from "@/lib/booking/jalali";
import { tehranDateTimeParts } from "@/lib/booking/time";
import { toPersianDigits } from "@/lib/site-config";
import type { GalleryCaseRecord } from "@/lib/gallery/service";

type StatusFilter = "all" | "published" | "draft";

const FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "همه" },
  { value: "published", label: "منتشرشده" },
  { value: "draft", label: "پیش‌نویس" },
];

type FormState =
  | { mode: "create" }
  | { mode: "edit"; row: GalleryCaseRecord }
  | null;

function serviceTitle(id: string): string {
  return services.find((service) => service.id === id)?.title ?? id;
}

/** پیام فارسی از پاسخ خطای API */
function readMessage(data: unknown, fallback: string): string {
  return typeof data === "object" &&
    data !== null &&
    typeof (data as { message?: unknown }).message === "string"
    ? (data as { message: string }).message
    : fallback;
}

/** بندانگشتی تصویر با برچسب قبل/بعد در فهرست و پیش‌نمایش فرم */
function Thumb({
  url,
  label,
  className = "h-16 w-16",
}: {
  url: string;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-lg border border-line ${className}`}
    >
      <img
        src={url}
        alt={label}
        loading="lazy"
        className="h-full w-full object-cover"
      />
      <span className="absolute bottom-0 start-0 rounded-tl-lg bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white">
        {label}
      </span>
    </span>
  );
}

/**
 * مدیریت نمونه‌کارهای قبل و بعد در پنل پذیرش — افزودن، ویرایش،
 * انتشار/پنهان‌سازی و حذف. دسترسی عملی این بخش فقط به‌وسیلهٔ خود سرور
 * کنترل می‌شود (هر مسیر API توکن نشست را جداگانه سنجیده و در نبود
 * اعتبار ۴۰۱ می‌دهد).
 */
export function GalleryPanel() {
  const router = useRouter();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [rows, setRows] = useState<GalleryCaseRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/admin/login");
  }, [router]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setConfirmDeleteId(null);
    try {
      const response = await fetch(
        `/api/admin/gallery?status=${encodeURIComponent(status)}`,
        { cache: "no-store" },
      );
      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readMessage(data, "خواندن نمونه‌کارها ناموفق بود؛ دوباره تلاش کنید."));
        return;
      }
      const list =
        typeof data === "object" && data !== null
          ? (data as { cases?: unknown }).cases
          : null;
      setRows(Array.isArray(list) ? (list as GalleryCaseRecord[]) : []);
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

  /** درخواست نوشتنی مشترک (PATCH/DELETE) روی یک ردیف */
  async function act(
    method: "PATCH" | "DELETE",
    row: GalleryCaseRecord,
    body: unknown,
    label: string,
  ) {
    setActionPendingId(row.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/gallery?id=${encodeURIComponent(row.id)}`,
        {
          method,
          headers: body === undefined ? undefined : { "Content-Type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
        },
      );
      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        setError(readMessage(data, `${label} ناموفق بود؛ دوباره تلاش کنید.`));
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
            نمونه‌کارهای قبل و بعد
          </h2>
          <p className="mt-1 text-sm text-muted">
            نمونه‌های منتشرشده در بخش «قبل و بعدِ درمان‌ها» صفحهٔ اصلی نمایش
            داده می‌شوند؛ پیش‌نویس‌ها فقط اینجا دیده می‌شوند.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="فیلتر وضعیت نمونه‌کارها"
            className="flex overflow-hidden rounded-full border border-line-strong bg-surface"
          >
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setStatus(filter.value);
                  setForm(null);
                }}
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
          <button
            type="button"
            onClick={() =>
              setForm(form?.mode === "create" ? null : { mode: "create" })
            }
            className="inline-flex items-center gap-1.5 rounded-full bg-primary-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors duration-200 hover:bg-primary-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:hover:bg-primary-600"
          >
            {form?.mode === "create" ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            افزودن نمونه
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

      {form ? (
        <GalleryCaseForm
          form={form}
          onDone={() => {
            setForm(null);
            void refresh();
          }}
          onCancel={() => setForm(null)}
          onSessionExpired={redirectToLogin}
        />
      ) : null}

      {rows === null ? (
        <div
          aria-hidden="true"
          className="mt-4 h-24 animate-pulse rounded-2xl border border-line bg-surface"
        />
      ) : rows.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
          نمونه‌ای در این وضعیت ثبت نشده است.
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
                <div className="flex items-start gap-3">
                  <div className="flex gap-1.5">
                    <Thumb url={row.beforeImageUrl} label="قبل" />
                    <Thumb url={row.afterImageUrl} label="بعد" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-bold text-heading">
                        {row.title}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          row.isPublished
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}
                      >
                        {row.isPublished ? "منتشرشده" : "پیش‌نویس"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {`${serviceTitle(row.treatmentType)} — ${formatJalaliFull(date)}`}
                    </p>
                    {row.description ? (
                      <p className="mt-1.5 line-clamp-2 text-xs leading-6 text-muted">
                        {row.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2 border-t border-dashed border-line-strong pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ mode: "edit", row });
                      setConfirmDeleteId(null);
                    }}
                    disabled={actionPendingId !== null}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 py-2 text-xs font-bold text-heading transition-colors duration-200 hover:bg-tint disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    ویرایش
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void act(
                        "PATCH",
                        row,
                        { isPublished: !row.isPublished },
                        row.isPublished ? "پنهان‌سازی نمونه" : "انتشار نمونه",
                      )
                    }
                    disabled={actionPendingId !== null}
                    className={`inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 py-2 text-xs font-bold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300 ${
                      row.isPublished
                        ? "text-heading hover:bg-tint"
                        : "text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                    }`}
                  >
                    {actionPendingId === row.id ? (
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : row.isPublished ? (
                      <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {row.isPublished ? "پنهان‌سازی" : "انتشار"}
                  </button>
                  {confirmDeleteId === row.id ? (
                    <span className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void act("DELETE", row, undefined, "حذف نمونه")}
                        disabled={actionPendingId !== null}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                      >
                        {actionPendingId === row.id ? (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
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
                      aria-label={`حذف نمونهٔ ${row.title}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 py-2 text-xs font-bold text-red-700 transition-colors duration-200 hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-950/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
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

/* ─────────────────────── فرم افزودن/ویرایش ─────────────────────── */

const EMPTY_FORM = {
  title: "",
  description: "",
  treatmentType: services[0].id,
  beforeImageUrl: "",
  afterImageUrl: "",
  isPublished: true,
};

type FormValues = typeof EMPTY_FORM;

function valuesOf(row: GalleryCaseRecord): FormValues {
  return {
    title: row.title,
    description: row.description ?? "",
    treatmentType: row.treatmentType,
    beforeImageUrl: row.beforeImageUrl,
    afterImageUrl: row.afterImageUrl,
    isPublished: row.isPublished,
  };
}

function GalleryCaseForm({
  form,
  onDone,
  onCancel,
  onSessionExpired,
}: {
  form: NonNullable<FormState>;
  onDone: () => void;
  onCancel: () => void;
  onSessionExpired: () => void;
}) {
  const initial = form.mode === "edit" ? valuesOf(form.row) : EMPTY_FORM;
  const [values, setValues] = useState<FormValues>(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    setPending(true);
    setError(null);
    const payload = {
      title: values.title,
      description: values.description,
      treatmentType: values.treatmentType,
      beforeImageUrl: values.beforeImageUrl,
      afterImageUrl: values.afterImageUrl,
      isPublished: values.isPublished,
    };
    try {
      const isEdit = form.mode === "edit";
      const response = await fetch(
        isEdit
          ? `/api/admin/gallery?id=${encodeURIComponent(form.row.id)}`
          : "/api/admin/gallery",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        onSessionExpired();
        return;
      }
      if (!response.ok) {
        setError(readMessage(data, "ذخیرهٔ نمونه ناموفق بود؛ دوباره تلاش کنید."));
        return;
      }
      onDone();
    } catch {
      setError("اتصال ناموفق بود؛ دوباره تلاش کنید.");
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-heading transition-colors duration-200 focus:border-primary-400 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300";
  const labelClass = "block text-sm font-bold text-heading";

  return (
    <form
      className="mt-4 grid gap-4 rounded-2xl border border-line-strong bg-surface p-4 sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!pending) void submit();
      }}
    >
      <p className="text-sm font-bold text-heading">
        {form.mode === "edit" ? `ویرایش «${form.row.title}»` : "افزودن نمونهٔ تازه"}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="gallery-title" className={labelClass}>
            عنوان نمونه
          </label>
          <input
            id="gallery-title"
            type="text"
            required
            minLength={3}
            maxLength={80}
            value={values.title}
            onChange={(event) => set("title", event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="gallery-treatment" className={labelClass}>
            نوع خدمت
          </label>
          <select
            id="gallery-treatment"
            value={values.treatmentType}
            onChange={(event) => set("treatmentType", event.target.value)}
            className={inputClass}
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="gallery-before" className={labelClass}>
            آدرس تصویر «قبل»
          </label>
          <input
            id="gallery-before"
            type="text"
            required
            dir="ltr"
            placeholder="/before-after/case-1-before.jpg"
            value={values.beforeImageUrl}
            onChange={(event) => set("beforeImageUrl", event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="gallery-after" className={labelClass}>
            آدرس تصویر «بعد»
          </label>
          <input
            id="gallery-after"
            type="text"
            required
            dir="ltr"
            placeholder="/before-after/case-1-after.jpg"
            value={values.afterImageUrl}
            onChange={(event) => set("afterImageUrl", event.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      {values.beforeImageUrl.trim() !== "" || values.afterImageUrl.trim() !== "" ? (
        <div className="flex items-center gap-3">
          {values.beforeImageUrl.trim() !== "" ? (
            <Thumb
              url={values.beforeImageUrl.trim()}
              label="قبل"
              className="h-20 w-20"
            />
          ) : null}
          {values.afterImageUrl.trim() !== "" ? (
            <Thumb
              url={values.afterImageUrl.trim()}
              label="بعد"
              className="h-20 w-20"
            />
          ) : null}
          <p className="text-xs text-muted">
            پیش‌نمایش تصاویر — آدرس باید مسیر سایت یا نشانی https باشد.
          </p>
        </div>
      ) : null}
      <div>
        <label htmlFor="gallery-description" className={labelClass}>
          توضیح (اختیاری)
        </label>
        <textarea
          id="gallery-description"
          rows={3}
          maxLength={400}
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
          className={`${inputClass} resize-y leading-7`}
        />
        <p className="mt-1 text-xs text-muted">
          {`${toPersianDigits(String(values.description.length))} از ۴۰۰ نویسه`}
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm text-heading">
        <input
          type="checkbox"
          checked={values.isPublished}
          onChange={(event) => set("isPublished", event.target.checked)}
          className="h-4 w-4 rounded border-line-strong accent-primary-700"
        />
        نمایش در سایت عمومی (پیش‌نویس = بدون تیک)
      </label>
      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-line-strong bg-surface px-4 py-2.5 text-sm font-bold text-heading transition-colors duration-200 hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
        >
          انصراف
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-primary-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:hover:bg-primary-600"
        >
          {pending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          {form.mode === "edit" ? "ذخیرهٔ تغییرات" : "افزودن نمونه"}
        </button>
      </div>
    </form>
  );
}

/* ─────────────────────── پایان فرم ─────────────────────── */
