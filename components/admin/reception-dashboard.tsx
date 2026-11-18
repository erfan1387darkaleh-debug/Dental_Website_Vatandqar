"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  LoaderCircle,
  LogOut,
  Plus,
  RotateCw,
  Search,
  Trash2,
} from "lucide-react";
import { BRANCHES, toPersianDigits } from "@/lib/site-config";
import { btnPrimary } from "@/lib/styles";
import { formatJalaliFull, formatTimeFa } from "@/lib/booking/jalali";
import { appointmentMatchesQuery, normalizeSearchQuery } from "@/lib/booking/search";
import { slotTimesForBranchDate } from "@/lib/booking/slots";
import { useClientToday } from "@/lib/booking/use-client-today";
import type { TehranDate, TimeOfDay } from "@/lib/booking/time";
import type { AppointmentRow } from "@/lib/booking/service";
import { JalaliMonthGrid } from "@/components/booking/jalali-month-grid";

/**
 * وضعیت جستجوی سراسری کد رهگیری — مستقل از روز انتخابی.
 * وقتی کد ۶ رقمی در فهرست روز پیدا نشود، سرور همهٔ روزها و شعبه‌ها را
 * می‌گردد تا نوبتِ روز/شعبهٔ دیگر هم پیدا شود.
 */
type TrackingLookup =
  | { status: "idle" }
  | { status: "loading"; code: string }
  | { status: "done"; code: string; rows: AppointmentRow[] }
  | { status: "error"; code: string; message: string };

/**
 * داشبورد پذیرش — مشاهده، ثبت دستی و حذف نوبت‌ها.
 * دسترسی عملی این بخش فقط به‌وسیلهٔ خود سرور کنترل می‌شود (هر مسیر API
 * پذیرش توکن نشست را جداگانه سنجیده و در نبود اعتبار ۴۰۱ می‌دهد؛ این
 * مؤلفه صرفاً رابط کاربری است). پاسخ ۴۰۱ کاربر را به‌طور خودکار به
 * صفحهٔ ورود می‌برد.
 */
export function ReceptionDashboard({ username }: { username: string }) {
  const router = useRouter();
  const today = useClientToday();

  const [branchId, setBranchId] = useState<string>(BRANCHES[0].id);
  const [anchor, setAnchor] = useState<TehranDate | null>(null);
  const [selectedDate, setSelectedDate] = useState<TehranDate | null>(null);

  const [rows, setRows] = useState<AppointmentRow[] | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [formTime, setFormTime] = useState<TimeOfDay | "">("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [createPending, setCreatePending] = useState(false);
  const [createMessage, setCreateMessage] = useState<
    { ok: boolean; text: string } | null
  >(null);

  const [logoutPending, setLogoutPending] = useState(false);

  /** ورودی جستجو — فیلتر زندهٔ فهرست با کد رهگیری/نام/موبایل */
  const [searchQuery, setSearchQuery] = useState("");
  /** نتیجهٔ جستجوی سراسری کد رهگیری (وقتی در روز انتخابی نباشد) */
  const [trackingLookup, setTrackingLookup] = useState<TrackingLookup>({
    status: "idle",
  });

  const determineDate = selectedDate ?? today;
  const gridAnchor = anchor ?? today;

  const redirectToLogin = useCallback(() => {
    router.replace("/admin/login");
  }, [router]);

  /** خواندن فهرست نوبت‌های یک روز — از رخدادهای کاربر یا بارگیری اولیه */
  const refreshList = useCallback(
    async (date: TehranDate) => {
      setListLoading(true);
      setListError(null);
      setDeleteError(null);
      setConfirmDeleteId(null);
      try {
        const response = await fetch(
          `/api/admin/appointments?branch=${encodeURIComponent(branchId)}&date=${encodeURIComponent(date)}`,
          { cache: "no-store" },
        );
        if (response.status === 401) {
          redirectToLogin();
          return;
        }
        const data: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          setListError(
            readErrorMessage(
              data,
              "خواندن نوبت‌ها ناموفق بود؛ دوباره تلاش کنید.",
            ),
          );
          return;
        }
        const list =
          data !== null && typeof data === "object"
            ? (data as { appointments?: unknown }).appointments
            : null;
        setRows(Array.isArray(list) ? (list as AppointmentRow[]) : []);
      } catch {
        setListError("اتصال ناموفق بود؛ دوباره تلاش کنید.");
      } finally {
        setListLoading(false);
      }
    },
    [branchId, redirectToLogin],
  );

  // بارگیری اولیه و واکنش به تغییر شعبه/روز — به‌طور هم‌زمان از بدنهٔ
  // effect جدا شده (میکروتسک) تا تولید رندر آبشاری نباشد.
  useEffect(() => {
    if (!determineDate) return;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void refreshList(determineDate);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshList, determineDate]);

  /* ── جستجوی سراسری کد رهگیری (مستقل از روز) ──
     پذیرش ممکن است کد ۶ رقمی مراجعی را بزند که نوبتش امروز نیست (یا در
     شعبهٔ دیگر است). اگر کد در فهرست همین روز پیدا نشد، پس از یک وقفهٔ
     کوتاه سرور همهٔ روزها و هر دو شعبه را می‌گردد و نتیجه همراه با
     تاریخ و شعبه نمایش داده می‌شود. */
  const normalizedQuery = normalizeSearchQuery(searchQuery);
  const trackingQuery = /^[0-9]{6}$/.test(normalizedQuery)
    ? normalizedQuery
    : null;
  const localTrackingMatch =
    trackingQuery !== null &&
    rows !== null &&
    rows.some((row) => row.trackingCode === trackingQuery);

  useEffect(() => {
    if (trackingQuery === null || rows === null) return;
    if (rows.some((row) => row.trackingCode === trackingQuery)) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setTrackingLookup({ status: "loading", code: trackingQuery });
      void (async () => {
        try {
          const response = await fetch(
            `/api/admin/appointments?trackingCode=${encodeURIComponent(trackingQuery)}`,
            { cache: "no-store", signal: controller.signal },
          );
          if (response.status === 401) {
            redirectToLogin();
            return;
          }
          const data: unknown = await response.json().catch(() => null);
          if (!response.ok) {
            setTrackingLookup({
              status: "error",
              code: trackingQuery,
              message: readErrorMessage(
                data,
                "جستجوی سراسری کد رهگیری ناموفق بود؛ دوباره تلاش کنید.",
              ),
            });
            return;
          }
          const list =
            data !== null && typeof data === "object"
              ? (data as { appointments?: unknown }).appointments
              : null;
          setTrackingLookup({
            status: "done",
            code: trackingQuery,
            rows: Array.isArray(list) ? (list as AppointmentRow[]) : [],
          });
        } catch {
          if (controller.signal.aborted) return;
          setTrackingLookup({
            status: "error",
            code: trackingQuery,
            message: "اتصال ناموفق بود؛ دوباره تلاش کنید.",
          });
        }
      })();
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trackingQuery, rows, redirectToLogin]);

  async function createAppointment() {
    if (!determineDate || formTime === "") return;
    setCreatePending(true);
    setCreateMessage(null);
    try {
      const response = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          date: determineDate,
          time: formTime,
          patientName: formName,
          patientPhone: formPhone,
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (response.status === 201) {
        const created =
          data !== null && typeof data === "object"
            ? (data as { appointment?: { trackingCode?: unknown } }).appointment
            : null;
        const code =
          created && typeof created.trackingCode === "string"
            ? created.trackingCode
            : null;
        setCreateMessage({
          ok: true,
          text: code
            ? `نوبت دستی با موفقیت ثبت شد؛ کد رهگیری: ${code}`
            : "نوبت دستی با موفقیت ثبت شد.",
        });
        setFormTime("");
        setFormName("");
        setFormPhone("");
        await refreshList(determineDate);
        return;
      }
      setCreateMessage({
        ok: false,
        text: readErrorMessage(data, "ثبت نوبت ناموفق بود؛ دوباره تلاش کنید."),
      });
    } catch {
      setCreateMessage({
        ok: false,
        text: "اتصال ناموفق بود؛ دوباره تلاش کنید.",
      });
    } finally {
      setCreatePending(false);
    }
  }

  async function deleteAppointment(rowId: string) {
    setDeletePending(true);
    setDeleteError(null);
    try {
      const response = await fetch(
        `/api/admin/appointments?id=${encodeURIComponent(rowId)}`,
        { method: "DELETE" },
      );
      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      const data: unknown = await response.json().catch(() => null);
      if (response.ok) {
        setConfirmDeleteId(null);
        if (determineDate) await refreshList(determineDate);
        return;
      }
      setDeleteError(readErrorMessage(data, "حذف نوبت ناموفق بود؛ دوباره تلاش کنید."));
    } catch {
      setDeleteError("اتصال ناموفق بود؛ دوباره تلاش کنید.");
    } finally {
      setDeletePending(false);
    }
  }

  async function logout() {
    setLogoutPending(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // حتی اگر فراخوانی خروج ناموفق بود، به صفحهٔ ورود می‌رویم؛ نشست
      // خواهد گذشت و هیچ دسترسی‌ای از رابط کاربری به جا نمی‌ماند.
    }
    router.replace("/admin/login");
    router.refresh();
  }

  const selectedBranch =
    BRANCHES.find((branch) => branch.id === branchId) ?? BRANCHES[0];
  const bookedTimes = new Set((rows ?? []).map((row) => row.time));
  /** فیلتر زنده — نوبت‌های خوانده‌شدهٔ روز با ورودی جستجوی پذیرش */
  const isFiltering = searchQuery.trim() !== "";
  /** جستجو با کد ۶ رقمی که در فهرست همین روز پیدا نشده است */
  const isTrackingSearch = trackingQuery !== null && !localTrackingMatch;
  /** نتیجهٔ متناظر با همین کد؛ نتیجهٔ کدِ قبلی هرگز نمایش داده نمی‌شود */
  const trackingDisplay =
    trackingLookup.status !== "idle" && trackingLookup.code === trackingQuery
      ? trackingLookup
      : null;
  const visibleRows =
    rows === null
      ? null
      : rows.filter((row) => appointmentMatchesQuery(row, searchQuery));
  const slotOptions =
    determineDate !== null
      ? slotTimesForBranchDate(branchId, determineDate)
      : [];
  const totalSlots = slotOptions.length;
  const bookedCount = (rows ?? []).length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* سربرگ داشبورد */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-heading sm:text-2xl">
            داشبورد پذیرش
          </h1>
          <p className="mt-1 text-sm text-muted">
            {`کاربر: ${username} — اختیارات: مشاهده، ثبت دستی و حذف نوبت‌های دو شعبه.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {today ? (
            <button
              type="button"
              onClick={() => {
                setAnchor(today);
                setSelectedDate(today);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 py-2 text-xs font-bold text-heading transition-colors duration-200 hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              برو به امروز
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void logout()}
            disabled={logoutPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 py-2 text-xs font-bold text-heading transition-colors duration-200 hover:bg-tint disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
          >
            {logoutPending ? (
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden="true" />
            )}
            خروج
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* فیلتر شعبه و تاریخ */}
        <section
          aria-label="فیلتر شعبه و روز"
          className="rounded-2xl border border-line bg-surface p-4 sm:p-5"
        >
          <h2 className="text-base font-extrabold text-heading">
            شعبه و روز موردنظر
          </h2>
          <label
            htmlFor="admin-branch"
            className="mt-4 block text-sm font-bold text-heading"
          >
            شعبه
          </label>
          <select
            id="admin-branch"
            value={branchId}
            onChange={(event) => {
              setBranchId(event.target.value);
              setCreateMessage(null);
            }}
            className="mt-1.5 w-full rounded-xl border border-line-strong bg-canvas px-3 py-2.5 text-sm text-heading transition-colors duration-200 focus:border-primary-400 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
          >
            {BRANCHES.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {`شعبه ${branch.name} — ${branch.area}`}
              </option>
            ))}
          </select>
          <div className="mt-4">
            {gridAnchor ? (
              <JalaliMonthGrid
                anchor={gridAnchor}
                onAnchorChange={(next) => setAnchor(next)}
                selected={determineDate}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setCreateMessage(null);
                }}
                canGoPreviousMonth={true}
                canGoNextMonth={true}
                isDateDisabled={() => false}
                dateMeta={(date) =>
                  date === today
                    ? "امروز"
                    : slotTimesForBranchDate(branchId, date).length === 0
                      ? "تعطیل"
                      : null
                }
              />
            ) : null}
          </div>
        </section>

        {/* فهرست نوبت‌های روز */}
        <section
          aria-label="نوبت‌های روز انتخابی"
          className="rounded-2xl border border-line bg-surface p-4 sm:p-5 lg:col-span-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-heading">
              {determineDate
                ? `نوبت‌های شعبهٔ ${selectedBranch.name} در ${formatJalaliFull(determineDate)}`
                : "نوبت‌های روز انتخابی"}
            </h2>
            <button
              type="button"
              onClick={() => {
                if (determineDate) void refreshList(determineDate);
              }}
              disabled={listLoading || determineDate === null}
              aria-label="نوسازی فهرست نوبت‌ها"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-heading transition-colors duration-200 hover:bg-tint disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
            >
              <RotateCw
                className={`h-4.5 w-4.5 ${listLoading ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
            </button>
          </div>

          {/* جستجوی زندهٔ پذیرش — کد رهگیری، نام بیمار یا شمارهٔ موبایل */}
          <div className="mt-3">
            <label htmlFor="admin-search" className="sr-only">
              جستجوی نوبت‌ها
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-subtle"
                aria-hidden="true"
              />
              <input
                id="admin-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="جستجو با کد رهگیری (همهٔ روزها) یا نام بیمار…"
                className="w-full rounded-xl border border-line-strong bg-canvas pe-3 ps-9 py-2.5 text-sm text-heading transition-colors duration-200 focus:border-primary-400 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
              />
            </div>
          </div>

          {/* نتیجهٔ جستجوی سراسری کد رهگیری — وقتی کد در فهرست همین روز
              نیست، نوبتِ روز یا شعبهٔ دیگر اینجا با تاریخ و شعبه نمایش
              داده می‌شود تا پذیرش بی‌درنگ متوجه اشتباه روز/شعبه شود. */}
          {isTrackingSearch ? (
            <div
              className="mt-3 rounded-xl border border-sky-200 bg-sky-50/80 p-3 text-xs dark:border-sky-900/50 dark:bg-sky-950/30"
              aria-live="polite"
            >
              {trackingDisplay === null ||
              trackingDisplay.status === "loading" ? (
                <p className="flex items-center gap-2 text-subtle">
                  <LoaderCircle
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  {`در حال جستجوی کد ${trackingQuery} در همهٔ روزها و شعبه‌ها…`}
                </p>
              ) : trackingDisplay.status === "error" ? (
                <p
                  className="font-bold text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {trackingDisplay.message}
                </p>
              ) : trackingDisplay.rows.length === 0 ? (
                <p className="text-subtle">
                  {`نوبتی با کد رهگیری ${trackingQuery} در هیچ روزی ثبت نشده است.`}
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="font-bold text-heading">
                    این کد در نوبت‌های روز انتخابی نیست؛ نتیجهٔ جستجوی سراسری:
                  </p>
                  <ul className="grid gap-2">
                    {trackingDisplay.rows.map((row) => {
                      const branchName =
                        BRANCHES.find((branch) => branch.id === row.branchId)
                          ?.name ?? row.branchId;
                      const isAnotherDay = row.date !== determineDate;
                      return (
                        <li
                          key={row.id}
                          className="rounded-lg border border-line-strong bg-surface px-3 py-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-heading">
                                {row.patientName}
                              </span>
                              <span
                                dir="ltr"
                                title="کد رهگیری نوبت"
                                className="rounded-md bg-tint px-1.5 py-0.5 font-extrabold text-primary-800 dark:text-primary-200"
                              >
                                {row.trackingCode}
                              </span>
                              <span dir="ltr" className="text-subtle">
                                {toPersianDigits(row.patientPhone)}
                              </span>
                            </div>
                            {isAnotherDay ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                                روز دیگر
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-subtle">
                            <span>{`شعبه ${branchName}`}</span>
                            <span>{formatJalaliFull(row.date)}</span>
                            <span>{`ساعت ${formatTimeFa(row.time)}`}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setBranchId(row.branchId);
                                setAnchor(row.date);
                                setSelectedDate(row.date);
                                setSearchQuery("");
                              }}
                              className="rounded-lg border border-primary-200 px-2.5 py-1 font-bold text-primary-800 transition-colors duration-200 hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:border-primary-800 dark:text-primary-200 dark:focus-visible:outline-primary-300"
                            >
                              رفتن به این روز
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          ) : null}

          {determineDate && rows !== null && totalSlots > 0 ? (
            <p className="mt-2 text-xs text-subtle">
              ظرفیت روز: {toPersianDigits(String(totalSlots))} نوبت ۱۰ دقیقه‌ای؛
              ثبت‌شده: {toPersianDigits(String(bookedCount))}؛ خالی:{" "}
              {toPersianDigits(String(Math.max(totalSlots - bookedCount, 0)))}
            </p>
          ) : null}
          {isFiltering &&
          rows !== null &&
          rows.length > 0 &&
          (trackingQuery === null || localTrackingMatch) ? (
            <p className="mt-1 text-xs text-subtle" aria-live="polite">
              نتیجهٔ جستجو: {toPersianDigits(String(visibleRows?.length ?? 0))} از{" "}
              {toPersianDigits(String(rows.length))} نوبت
            </p>
          ) : null}

          <div className="mt-4" aria-live="polite">
            {listLoading && rows === null ? (
              <p className="flex items-center gap-2 py-6 text-sm text-subtle">
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                در حال خواندن نوبت‌ها…
              </p>
            ) : listError ? (
              <p
                className="py-2 text-sm font-bold text-red-600 dark:text-red-400"
                role="alert"
              >
                {listError}
              </p>
            ) : rows !== null && rows.length === 0 && !isTrackingSearch ? (
              <p className="py-6 text-sm text-subtle">
                {totalSlots === 0
                  ? "شعبه در این روز تعطیل است."
                  : "نوبتی در این روز ثبت نشده است."}
              </p>
            ) : visibleRows !== null &&
              visibleRows.length === 0 &&
              !isTrackingSearch ? (
              <p className="py-6 text-sm text-subtle">
                نوبتی با این جستجو یافت نشد؛ کد رهگیری، نام یا شمارهٔ دیگری را
                بیازمایید.
              </p>
            ) : visibleRows !== null && visibleRows.length > 0 ? (
              <ul className="grid gap-2">
                {visibleRows.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="shrink-0 rounded-lg bg-tint px-2.5 py-1 text-sm font-extrabold text-primary-800 dark:text-primary-200">
                        {formatTimeFa(row.time)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-heading">
                          {row.patientName}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-subtle">
                          <span dir="ltr" className="text-left">
                            {toPersianDigits(row.patientPhone)}
                          </span>
                          <span
                            dir="ltr"
                            title="کد رهگیری نوبت"
                            className="rounded-md bg-tint px-1.5 py-0.5 text-left font-extrabold text-primary-800 dark:text-primary-200"
                          >
                            {row.trackingCode}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-line-strong px-2.5 py-1 text-[11px] font-bold text-subtle">
                        {row.source === "public"
                          ? "رزرو آنلاین"
                          : row.createdBy
                            ? `ثبت دستی (${row.createdBy})`
                            : "ثبت دستی"}
                      </span>
                      {confirmDeleteId === row.id ? (
                        <span className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void deleteAppointment(row.id)}
                            disabled={deletePending}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                          >
                            {deletePending ? "در حال حذف…" : "تأیید حذف"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={deletePending}
                            className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-bold text-heading transition-colors duration-200 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
                          >
                            انصراف
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(row.id)}
                          disabled={deletePending}
                          aria-label={`حذف نوبت ${row.patientName} ساعت ${formatTimeFa(row.time)}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-600 transition-colors duration-200 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          حذف
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            {deleteError ? (
              <p
                className="mt-3 text-sm font-bold text-red-600 dark:text-red-400"
                role="alert"
              >
                {deleteError}
              </p>
            ) : null}
          </div>
        </section>
      </div>

      {/* ثبت دستی نوبت */}
      <section
        aria-label="ثبت دستی نوبت"
        className="mt-6 rounded-2xl border border-line bg-surface p-4 sm:p-5"
      >
        <h2 className="flex items-center gap-2 text-base font-extrabold text-heading">
          <Plus className="h-4.5 w-4.5 text-accent" aria-hidden="true" />
          ثبت دستی نوبت
        </h2>
        <p className="mt-1 text-xs leading-6 text-subtle">
          تاریخ و شعبه از انتخاب‌های بالای همین صفحه گرفته می‌شود. ثبت نوبت برای
          روزهای گذشته نیز مجاز است (مثلاً برای نوبت‌های ثبت‌شده با تلفن). اگر
          همان ساعت در همین شعبه پیش‌تر اشغال شده باشد، پایگاه‌داده اجازهٔ ثبت
          دوباره نمی‌دهد.
        </p>
        {determineDate ? (
          <form
            className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!createPending) void createAppointment();
            }}
          >
            <div>
              <span className="block text-sm font-bold text-heading">
                تاریخ
              </span>
              <span className="mt-1.5 block truncate rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-muted">
                {formatJalaliFull(determineDate)}
              </span>
            </div>
            <div>
              <label
                htmlFor="admin-create-time"
                className="block text-sm font-bold text-heading"
              >
                ساعت نوبت
              </label>
              {slotOptions.length === 0 ? (
                <span className="mt-1.5 block rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-subtle">
                  شعبه در این روز تعطیل است
                </span>
              ) : (
                <select
                  id="admin-create-time"
                  value={formTime}
                  onChange={(event) => setFormTime(event.target.value)}
                  required
                  className="mt-1.5 w-full rounded-xl border border-line-strong bg-canvas px-3 py-2.5 text-sm text-heading transition-colors duration-200 focus:border-primary-400 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
                >
                  <option value="" disabled>
                    انتخاب ساعت…
                  </option>
                  {slotOptions.map((time) => {
                    const occupied = bookedTimes.has(time);
                    return (
                      <option key={time} value={time} disabled={occupied}>
                        {formatTimeFa(time)}
                        {occupied ? " — رزرو شده" : ""}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
            <div>
              <label
                htmlFor="admin-create-name"
                className="block text-sm font-bold text-heading"
              >
                نام و نام خانوادگی
              </label>
              <input
                id="admin-create-name"
                type="text"
                autoComplete="name"
                maxLength={60}
                required
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line-strong bg-canvas px-3 py-2.5 text-sm text-heading transition-colors duration-200 focus:border-primary-400 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
              />
            </div>
            <div>
              <label
                htmlFor="admin-create-phone"
                className="block text-sm font-bold text-heading"
              >
                شمارهٔ موبایل
              </label>
              <input
                id="admin-create-phone"
                type="tel"
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
                maxLength={20}
                required
                placeholder="09121234567"
                value={formPhone}
                onChange={(event) => setFormPhone(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line-strong bg-canvas px-3 py-2.5 text-left text-sm text-heading transition-colors duration-200 focus:border-primary-400 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              {createMessage ? (
                <p
                  className={`mb-3 rounded-xl border px-3 py-2.5 text-sm font-bold ${
                    createMessage.ok
                      ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                  }`}
                  role={createMessage.ok ? "status" : "alert"}
                  aria-live="polite"
                >
                  {createMessage.text}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={
                  createPending ||
                  formTime === "" ||
                  slotOptions.length === 0 ||
                  formName.trim().length < 2 ||
                  formPhone.trim().length < 10
                }
                className={`${btnPrimary} w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {createPending ? (
                  <LoaderCircle
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : null}
                ثبت نوبت برای پذیرش
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-3 text-sm text-subtle">
            ابتدا روز را از تقویم انتخاب کنید.
          </p>
        )}
      </section>
    </div>
  );
}

/** خواندن پیام خطای فارسی از بدنهٔ پاسخ سرور (در صورت وجود) */
function readErrorMessage(data: unknown, fallback: string): string {
  if (data !== null && typeof data === "object") {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}
