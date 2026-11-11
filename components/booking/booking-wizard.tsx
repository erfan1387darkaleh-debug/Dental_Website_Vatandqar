"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Phone,
} from "lucide-react";
import {
  BOOKING,
  BRANCHES,
  formatHourPeriod,
  toPersianDigits,
  type Branch,
} from "@/lib/site-config";
import { btnPrimary, btnSecondary } from "@/lib/styles";
import {
  formatJalaliFull,
  formatTimeFa,
  jalaliMonthRange,
  nextJalaliMonth,
  previousJalaliMonth,
} from "@/lib/booking/jalali";
import { slotTimesForBranchDate } from "@/lib/booking/slots";
import { useClientToday } from "@/lib/booking/use-client-today";
import {
  addDays,
  isValidTehranDate,
  type TehranDate,
  type TimeOfDay,
} from "@/lib/booking/time";
import type {
  AvailabilityDay,
  AvailableSlot,
  CreatedBooking,
} from "@/lib/booking/service";
import { JalaliMonthGrid } from "./jalali-month-grid";

/**
 * درگاه عمومی نوبت‌دهی — انتخاب شعبه، روز (جلالی)، ساعت خالی و ثبت.
 * تمام اعتبارسنجی نهایی در سرور تکرار می‌شود؛ این مؤلفه فقط رابط کاربری است.
 * «امروز» از هوک مشترک useClientToday می‌آید (null در پیش‌رندر سرور)؛
 * بنابراین پیش از هیدراسیون اسکلت محو نمایش داده می‌شود.
 */
export function BookingWizard() {
  const searchParams = useSearchParams();
  const today = useClientToday();

  const requestedBranch = searchParams.get("branch");
  const [branchId, setBranchId] = useState<string | null>(
    requestedBranch && BRANCHES.some((branch) => branch.id === requestedBranch)
      ? requestedBranch
      : null,
  );

  const [anchor, setAnchor] = useState<TehranDate | null>(null);
  const [selectedDate, setSelectedDate] = useState<TehranDate | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeOfDay | null>(null);

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatedBooking | null>(null);

  function selectBranch(nextBranchId: string) {
    setBranchId(nextBranchId);
    setSelectedDate(null);
    setSlots(null);
    setSlotsError(null);
    setSelectedTime(null);
    setResult(null);
    setFormError(null);
  }

  async function loadSlots(date: TehranDate, activeBranchId: string) {
    setSlotsLoading(true);
    setSlotsError(null);
    setSlots(null);
    try {
      const response = await fetch(
        `/api/booking/availability?branch=${encodeURIComponent(activeBranchId)}&date=${encodeURIComponent(date)}&days=1`,
        { cache: "no-store" },
      );
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setSlotsError(
          isErrorData(data)
            ? data.message
            : "خواندن نوبت‌های خالی ناموفق بود؛ دوباره تلاش کنید.",
        );
        return;
      }
      if (!isDayListData(data) || !data.days[0]) {
        setSlotsError("خواندن نوبت‌های خالی ناموفق بود؛ دوباره تلاش کنید.");
        return;
      }
      const day = data.days[0];
      setSlots(day.closed ? [] : day.slots);
    } catch {
      setSlotsError("اتصال ناموفق بود؛ دوباره تلاش کنید.");
    } finally {
      setSlotsLoading(false);
    }
  }

  async function selectDate(date: TehranDate) {
    setSelectedDate(date);
    setSelectedTime(null);
    setSlotsError(null);
    if (branchId) await loadSlots(date, branchId);
  }

  async function refreshSlots() {
    if (branchId && selectedDate) await loadSlots(selectedDate, branchId);
  }

  async function submitBooking() {
    if (!branchId || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const response = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          date: selectedDate,
          time: selectedTime,
          patientName: formName,
          patientPhone: formPhone,
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (response.status === 201 && isBookingData(data)) {
        setResult(data.booking);
        return;
      }
      if (!response.ok && isErrorData(data)) {
        setFormError(data.message);
        // اگر نوبت در همین لحظه پر شده باشد، فهرست ساعات تازه شود
        if (data.error === "slot_taken") await refreshSlots();
        return;
      }
      setFormError("ثبت نوبت ناموفق بود؛ دوباره تلاش کنید.");
    } catch {
      setFormError("اتصال ناموفق بود؛ دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedBranch: Branch | null = branchId
    ? (BRANCHES.find((branch) => branch.id === branchId) ?? null)
    : null;

  if (today === null) {
    return (
      <div
        aria-hidden="true"
        className="h-72 animate-pulse rounded-2xl border border-line bg-surface"
      />
    );
  }

  /** حداکثر روز مجاز رزرو عمومی — پس از مشخص بودن «امروز» محاسبه می‌شود */
  const horizonMaxDate = addDays(today, BOOKING.horizonDays);

  if (result && selectedBranch && selectedDate) {
    return (
      <BookingConfirmation
        result={result}
        branchName={selectedBranch.name}
        branchArea={selectedBranch.area}
        telHref={selectedBranch.telHref}
        onBookAgain={() => {
          setResult(null);
          setSelectedTime(null);
        }}
      />
    );
  }

  const branchEmpty = branchId === null;
  const gridAnchor = anchor ?? today;
  const prevMonthAnchor = previousJalaliMonth(gridAnchor);
  const nextMonthAnchor = nextJalaliMonth(gridAnchor);
  const canGoPrevious = jalaliMonthRange(prevMonthAnchor).last >= today;
  const canGoNext = jalaliMonthRange(nextMonthAnchor).first <= horizonMaxDate;

  return (
    <div className="grid gap-6 lg:gap-8">
      {/* مرحلهٔ ۱: شعبه */}
      <WizardStep
        index={toPersianDigits("1")}
        title="شعبهٔ موردنظر را انتخاب کنید"
      >
        <div
          role="radiogroup"
          aria-label="انتخاب شعبه"
          className="grid gap-3 sm:grid-cols-2"
        >
          {BRANCHES.map((branch) => {
            const isSelected = branchId === branch.id;
            return (
              <button
                key={branch.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => selectBranch(branch.id)}
                className={`rounded-2xl border p-4 text-start transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300 ${
                  isSelected
                    ? "border-primary-300 bg-tint dark:border-primary-700"
                    : "border-line-strong bg-surface hover:border-primary-200 dark:hover:border-primary-800"
                }`}
              >
                <span className="block text-base font-extrabold text-heading">
                  {`شعبه ${branch.name}`}
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-subtle">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {branch.area}
                </span>
                <span className="mt-2 block text-xs leading-6 text-muted">
                  {branchHoursSummary(branch)}
                </span>
              </button>
            );
          })}
        </div>
        {branchEmpty ? (
          <p className="mt-3 text-sm text-subtle">
            پس از انتخاب شعبه، روزها و ساعات خالی نمایش داده می‌شود.
          </p>
        ) : null}
      </WizardStep>

      {/* مرحلهٔ ۲: روز */}
      <WizardStep
        index={toPersianDigits("2")}
        title="روز را انتخاب کنید"
        dimmed={branchEmpty}
      >
        {branchId ? (
          <JalaliMonthGrid
            anchor={gridAnchor}
            onAnchorChange={(next) => setAnchor(next)}
            selected={selectedDate}
            onSelectDate={(date) => void selectDate(date)}
            canGoPreviousMonth={canGoPrevious}
            canGoNextMonth={canGoNext}
            isDateDisabled={(date) =>
              date < today ||
              date > horizonMaxDate ||
              slotTimesForBranchDate(branchId, date).length === 0
            }
            dateMeta={(date) =>
              date === today
                ? "امروز"
                : slotTimesForBranchDate(branchId, date).length === 0
                  ? "تعطیل"
                  : null
            }
          />
        ) : (
          <p className="text-sm text-subtle">ابتدا شعبه را انتخاب کنید.</p>
        )}
      </WizardStep>

      {/* مرحلهٔ ۳: ساعت */}
      <WizardStep
        index={toPersianDigits("3")}
        title="ساعت خالی را انتخاب کنید"
        dimmed={selectedDate === null}
      >
        {selectedDate ? (
          <div>
            <p className="text-sm text-muted">
              روز انتخابی:{" "}
              <span className="font-bold text-heading">
                {formatJalaliFull(selectedDate)}
              </span>
            </p>
            {slotsLoading ? (
              <p
                className="mt-4 flex items-center gap-2 text-sm text-subtle"
                aria-live="polite"
              >
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                در حال خواندن ساعات خالی…
              </p>
            ) : slotsError ? (
              <p
                className="mt-4 text-sm font-bold text-red-600 dark:text-red-400"
                role="alert"
              >
                {slotsError}
              </p>
            ) : slots === null ? (
              <p className="mt-4 text-sm text-subtle">
                ابتدا روز را از تقویم انتخاب کنید.
              </p>
            ) : slots.length === 0 ? (
              <p className="mt-4 text-sm text-subtle">
                در این روز نوبت خالی وجود ندارد؛ روز دیگری را انتخاب کنید.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {slots.map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  if (slot.status === "open") {
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`rounded-xl border px-2 py-2.5 text-sm font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300 ${
                          isSelected
                            ? "border-primary-300 bg-tint text-primary-800 dark:border-primary-700 dark:text-primary-200"
                            : "border-line-strong bg-surface text-heading hover:border-primary-300 hover:bg-tint"
                        }`}
                      >
                        {formatTimeFa(slot.time)}
                      </button>
                    );
                  }
                  const caption =
                    slot.status === "booked"
                      ? "رزرو شده"
                      : "دیگر قابل رزرو نیست";
                  return (
                    <span
                      key={slot.time}
                      aria-label={`${formatTimeFa(slot.time)} — ${caption}`}
                      className="flex cursor-not-allowed flex-col items-center justify-center gap-0.5 rounded-xl border border-line bg-surface-2 px-2 py-2.5 text-sm font-bold text-subtle opacity-60"
                    >
                      <span>{formatTimeFa(slot.time)}</span>
                      <span className="text-[10px] font-medium">{caption}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-subtle">
            ابتدا روز را از تقویم انتخاب کنید.
          </p>
        )}
      </WizardStep>

      {/* مرحلهٔ ۴: نام و شمارهٔ تماس */}
      <WizardStep
        index={toPersianDigits("4")}
        title="نام و شمارهٔ تماس خود را وارد کنید"
        dimmed={selectedTime === null}
      >
        {selectedTime && selectedDate && selectedBranch ? (
          <div className="rounded-2xl border border-line bg-canvas p-4 sm:p-5">
            <p className="text-sm leading-7 text-muted">
              نوبت شما:{" "}
              <span className="font-bold text-heading">
                {`شعبه ${selectedBranch.name} — ${formatJalaliFull(selectedDate)}، ساعت ${formatTimeFa(selectedTime)}`}
              </span>
              <span className="block text-xs text-subtle">
                مدت معاینه {toPersianDigits(String(BOOKING.slotMinutes))} دقیقه
                است؛ تغییر یا لغو نوبت فقط از طریق تماس تلفنی با شعبه ممکن است.
              </span>
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="booking-name"
                  className="block text-sm font-bold text-heading"
                >
                  نام و نام خانوادگی
                </label>
                <input
                  id="booking-name"
                  type="text"
                  autoComplete="name"
                  maxLength={60}
                  required
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-sm text-heading transition-colors duration-200 focus:border-primary-400 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
                />
              </div>
              <div>
                <label
                  htmlFor="booking-phone"
                  className="block text-sm font-bold text-heading"
                >
                  شمارهٔ موبایل
                </label>
                <input
                  id="booking-phone"
                  dir="ltr"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={20}
                  required
                  placeholder="09121234567"
                  value={formPhone}
                  onChange={(event) => setFormPhone(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-left text-sm text-heading transition-colors duration-200 focus:border-primary-400 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
                />
              </div>
            </div>
            {formError ? (
              <p
                className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                role="alert"
                aria-live="polite"
              >
                {formError}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void submitBooking()}
              disabled={
                submitting ||
                formName.trim().length < 2 ||
                formPhone.trim().length < 10
              }
              className={`${btnPrimary} mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {submitting ? (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
              ثبت نوبت
            </button>
          </div>
        ) : (
          <p className="text-sm text-subtle">ابتدا ساعت نوبت را انتخاب کنید.</p>
        )}
      </WizardStep>
    </div>
  );
}

/* ─────────────────────────── اجزای کمکی ─────────────────────────── */

/** خلاصهٔ ساعات کاری یک شعبه برای نمایش در کارت انتخاب — از دادهٔ متمرکز */
function branchHoursSummary(branch: Branch): string {
  const periods = branch.openingHours
    .filter((entry) => entry.periods.length > 0)
    .flatMap((entry) => entry.periods);
  return periods.map((period) => formatHourPeriod(period)).join(" و ");
}

type WizardStepProps = {
  index: string;
  title: string;
  /** گام هنوز در دسترس نیست — کمی محو نمایش داده می‌شود */
  dimmed?: boolean;
  children: React.ReactNode;
};

function WizardStep({
  index,
  title,
  dimmed = false,
  children,
}: WizardStepProps) {
  return (
    <section
      aria-label={title}
      className={`rounded-2xl border border-line bg-surface p-4 sm:p-6 ${
        dimmed ? "opacity-70" : ""
      }`}
    >
      <h2 className="flex items-center gap-2.5 text-base font-extrabold text-heading sm:text-lg">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tint text-sm font-bold text-primary-800 dark:text-primary-200">
          {index}
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

type BookingConfirmationProps = {
  result: CreatedBooking;
  branchName: string;
  branchArea: string;
  telHref: string;
  onBookAgain(): void;
};

/** کارت تأیید نوبت — خلاصهٔ کامل برای یادداشت مراجع */
function BookingConfirmation({
  result,
  branchName,
  branchArea,
  telHref,
  onBookAgain,
}: BookingConfirmationProps) {
  return (
    <div className="rounded-2xl border border-primary-200 bg-tint p-6 text-center sm:p-8 dark:border-primary-800">
      <CheckCircle2
        className="mx-auto h-10 w-10 text-accent"
        aria-hidden="true"
      />
      <h2 className="mt-3 text-xl font-extrabold text-heading sm:text-2xl">
        نوبت شما ثبت شد
      </h2>
      <dl className="mx-auto mt-5 max-w-sm space-y-2 text-start text-sm leading-7">
        <div className="flex gap-2">
          <dt className="shrink-0 text-subtle">شعبه:</dt>
          <dd className="font-bold text-heading">
            {`شعبه ${branchName} — ${branchArea}`}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 text-subtle">تاریخ:</dt>
          <dd className="font-bold text-heading">
            {formatJalaliFull(result.date)}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 text-subtle">ساعت:</dt>
          <dd className="font-bold text-heading">
            {formatTimeFa(result.time)}{" "}
            <span className="font-normal text-muted">
              ({toPersianDigits(String(BOOKING.slotMinutes))} دقیقه معاینه)
            </span>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 text-subtle">نام:</dt>
          <dd className="font-bold text-heading">{result.patientName}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 text-subtle">شماره تماس:</dt>
          <dd dir="ltr" className="font-bold text-heading">
            {toPersianDigits(result.patientPhone)}
          </dd>
        </div>
      </dl>
      <p className="mx-auto mt-4 max-w-sm text-xs leading-6 text-muted">
        اطلاعات نوبت را برای روز مراجعه یادداشت کنید. برای تغییر یا لغو نوبت
        فقط با تلفن شعبه هماهنگ کنید.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <a href={telHref} className={btnPrimary}>
          <Phone className="h-4 w-4" aria-hidden="true" />
          تماس با شعبهٔ {branchName}
        </a>
        <button type="button" onClick={onBookAgain} className={btnSecondary}>
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          رزرو نوبت جدید
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── انواع پاسخ سرور ───────────────────────── */

type ApiDayList = { days: AvailabilityDay[] };
type ApiError = { error: string; message: string };
type ApiBooking = { booking: CreatedBooking };

function isDayListData(value: unknown): value is ApiDayList {
  if (value === null || typeof value !== "object") return false;
  return Array.isArray((value as ApiDayList).days);
}

function isErrorData(value: unknown): value is ApiError {
  if (value === null || typeof value !== "object") return false;
  return (
    typeof (value as ApiError).error === "string" &&
    typeof (value as ApiError).message === "string"
  );
}

function isBookingData(value: unknown): value is ApiBooking {
  if (value === null || typeof value !== "object") return false;
  const booking = (value as ApiBooking).booking;
  return (
    typeof booking === "object" &&
    booking !== null &&
    typeof (booking as CreatedBooking).id === "string" &&
    isValidTehranDate((booking as CreatedBooking).date)
  );
}
