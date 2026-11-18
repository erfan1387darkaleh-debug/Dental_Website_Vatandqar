/**
 * ────────────────────────────────────────────────────────────────
 *  تست‌های محلی منطق نوبت‌دهی — اجرا:  npm run test:booking
 * ────────────────────────────────────────────────────────────────
 *  سکوی تست: PGlite (PostgreSQL واقعی به‌صورت WASM، کاملاً محلی و
 *  بدون نیاز به حساب، کلید یا شبکه). همان توابع سرویس که در عملیات با
 *  Neon کار می‌کنند اینجا روی پایگاه‌دادهٔ واقعی آزموده می‌شوند؛ مهاجرت
 *  اولیهٔ drizzle نیز روی همین سکو اعمال می‌گردد.
 * ────────────────────────────────────────────────────────────────
 */
import assert from "node:assert/strict";
import { inspect } from "node:util";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import { BOOKING, BRANCHES } from "../lib/site-config";
import {
  addDays,
  englishWeekdayName,
  isValidTehranDate,
  isValidTimeOfDay,
  tehranDateTimeParts,
  tehranDateTimeToUtcMs,
  tehranDayStartUtcMs,
  todayTehranDate,
  weekdayIndex,
} from "../lib/booking/time";
import {
  formatJalaliDay,
  formatJalaliFull,
  formatJalaliMonthYear,
  formatTimeFa,
  formatWeekday,
  getJalaliParts,
  jalaliMonthRange,
  nextJalaliMonth,
  previousJalaliMonth,
} from "../lib/booking/jalali";
import { normalizeIranMobile } from "../lib/booking/phone";
import {
  appointmentMatchesQuery,
  normalizeSearchQuery,
  toLatinDigits,
} from "../lib/booking/search";
import {
  TRACKING_CODE_PATTERN,
  generateTrackingCode,
  isValidTrackingCode,
} from "../lib/booking/tracking";
import {
  buildAppointmentReminderText,
  buildBookingConfirmationText,
  maskPhone,
  parseKavenegarResponse,
  resolveSmsProvider,
  sendSms,
  type SmsSendOutcome,
} from "../lib/booking/sms";
import {
  isAuthorizedCronCall,
  runReminderJob,
  type ReminderSender,
} from "../lib/booking/reminders";
import {
  getBookingBranch,
  isBranchOpenOnDate,
  slotInstantUtcMs,
  slotTimesForBranchDate,
} from "../lib/booking/slots";
import type { BookingDb } from "../lib/booking/db";
import {
  createPublicBooking,
  createStaffBooking,
  deleteAppointment,
  getAvailabilityForDays,
  listDayAppointments,
} from "../lib/booking/service";
import { appointments } from "../lib/booking/schema";
import { testimonials } from "../lib/testimonials/schema";
import {
  approveTestimonial,
  deleteTestimonial,
  listApprovedTestimonials,
  listTestimonialsByStatus,
  submitTestimonial,
} from "../lib/testimonials/service";
import { galleryCases } from "../lib/gallery/schema";
import {
  createGalleryCase,
  deleteGalleryCase,
  listGalleryCasesByStatus,
  listPublishedGalleryCases,
  updateGalleryCase,
} from "../lib/gallery/service";
import {
  createSessionToken,
  isLoginThrottled,
  recordLoginFailure,
  resetLoginFailures,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  verifySessionToken,
} from "../lib/booking/auth";

/* کلید امضا برای بستر تست — توابع auth آن را در فراخوانی می‌خوانند */
process.env["AUTH_SECRET"] = "local-test-secret";

/* ─────────────────────────── توابع کمکی کوچک ─────────────────────────── */

type ResultShape<T> = { ok: true; value: T } | { ok: false; error: string };

function unwrap<T>(result: ResultShape<T>, label: string): T {
  if (!result.ok) {
    throw new Error(`«${label}» بایستی موفق می‌شد؛ خطا: ${result.error}`);
  }
  return result.value;
}

function expectErrorCode(
  result: ResultShape<unknown>,
  expected: string,
  label: string,
): void {
  if (result.ok) {
    throw new Error(`«${label}» بایستی خطای ${expected} می‌داد ولی موفق شد`);
  }
  if (result.error !== expected) {
    throw new Error(
      `«${label}»: خطای ${result.error} به جای ${expected} منتظر می‌رفت`,
    );
  }
}

/** بازکردن نتیجهٔ کار یادآوری (شکل {ok, summary}) */
function unwrapSummary(
  result:
    | { ok: true; summary: import("../lib/booking/reminders").ReminderSummary }
    | { ok: false; error: string },
  label: string,
): import("../lib/booking/reminders").ReminderSummary {
  if (!result.ok) {
    throw new Error(`«${label}» بایستی موفق می‌شد؛ خطا: ${result.error}`);
  }
  return result.summary;
}

const REQUEST_OK = {
  branchId: "hediye-yousef",
  date: "2026-11-02",
  time: "09:00",
  patientName: "علی رضایی",
  patientPhone: "09121234567",
};

/* ─────────────────────────── تنظیم رانر ─────────────────────────── */

const tests: Array<{ name: string; run: () => void | Promise<void> }> = [];
function test(name: string, run: () => void | Promise<void>): void {
  tests.push({ name, run });
}

/* ─────────────────────── تست‌های محاسبات خالص ─────────────────────── */

test("تقویم جلالی با Intl: نقاط مرجع", () => {
  assert.deepEqual(getJalaliParts("2025-03-21"), {
    year: "1404",
    month: "1",
    day: "1",
  });
  assert.deepEqual(getJalaliParts("2026-03-21"), {
    year: "1405",
    month: "1",
    day: "1",
  });
  assert.deepEqual(getJalaliParts("2026-10-31"), {
    year: "1405",
    month: "8",
    day: "9",
  });
  assert.ok(formatJalaliFull("2026-10-31").includes("آبان"));
  assert.ok(formatJalaliMonthYear("2026-10-31").includes("۱۴۰۵"));
});

test("روزهای هفته و تقویم ایران (شنبه=0 … جمعه=6)", () => {
  assert.equal(weekdayIndex("2026-10-31"), 0); // شنبه
  assert.equal(englishWeekdayName("2026-10-31"), "Saturday");
  assert.equal(weekdayIndex("2026-11-06"), 6); // جمعه
  assert.equal(englishWeekdayName("2026-11-06"), "Friday");
  assert.equal(formatWeekday("2026-10-31"), "شنبه");
  assert.equal(formatWeekday("2026-11-06"), "جمعه");
});

test("تبدیل زمان تهران ↔ UTC و معکوس آن", () => {
  assert.equal(
    tehranDateTimeToUtcMs("2026-10-31", "09:00"),
    Date.UTC(2026, 9, 31, 5, 30),
  );
  assert.equal(
    tehranDateTimeToUtcMs("2026-11-01", "00:00"),
    Date.UTC(2026, 9, 31, 20, 30),
  );
  assert.deepEqual(tehranDateTimeParts(Date.UTC(2026, 9, 31, 20, 30)), {
    date: "2026-11-01",
    time: "00:00",
  });
  assert.deepEqual(tehranDateTimeParts(Date.UTC(2026, 9, 31, 5, 30)), {
    date: "2026-10-31",
    time: "09:00",
  });
});

test("ابزارهای تاریخ و ساعت", () => {
  assert.equal(addDays("2026-11-01", 60), "2026-12-31");
  assert.equal(addDays("2026-11-01", 62), "2027-01-02");
  assert.equal(addDays("2026-02-28", 1), "2026-03-01");
  assert.equal(isValidTehranDate("2026-02-29"), false);
  assert.equal(isValidTehranDate("2026-02-30"), false);
  assert.equal(isValidTehranDate("2026-1-1"), false);
  assert.equal(isValidTehranDate("2026-11-06"), true);
  assert.equal(isValidTimeOfDay("09:00"), true);
  assert.equal(isValidTimeOfDay("9:00"), false);
  assert.equal(isValidTimeOfDay("24:00"), false);
  assert.equal(isValidTimeOfDay("12:50"), true);
});

test("ناوبری ماه جلالی", () => {
  // لنگر: روز ۹ آبان ۱۴۰۵ — ماه جلالی «آبان» (8)
  const range = jalaliMonthRange("2026-10-31");
  assert.equal(getJalaliParts(range.first).month, "8");
  assert.equal(formatJalaliDay(range.first), "۱");
  assert.equal(getJalaliParts(range.last).day, "30");
  assert.equal(getJalaliParts(previousJalaliMonth("2026-10-31")).month, "7");
  assert.equal(getJalaliParts(nextJalaliMonth("2026-10-31")).month, "9");
});

test("نمایش ساعت فارسی", () => {
  assert.equal(formatTimeFa("09:05"), "۹:۰۵");
  assert.equal(formatTimeFa("16:30"), "۱۶:۳۰");
});

test("نرمال‌سازی موبایل ایران در سمت سرور", () => {
  const cases: Array<[string, string | null]> = [
    ["09121234567", "09121234567"],
    [" ۰۹۱۲ ۱۲۳ ۴۵۶۷ ", "09121234567"],
    ["۰۹۱۲۱۲۳۴۵۶۷", "09121234567"],
    ["٠٩١٢١٢٣٤٥٦٧", "09121234567"],
    ["+98 912 123 4567", "09121234567"],
    ["00989121234567", "09121234567"],
    ["989121234567", "09121234567"],
    ["9121234567", "09121234567"],
    ["0912345", null],
    ["07121234567", null],
    ["0912ABC34567", null],
    ["", null],
  ];
  for (const [input, expected] of cases) {
    const result = normalizeIranMobile(input);
    const value = result.ok ? result.phone : null;
    assert.equal(value, expected, `ورودی: ${input}`);
  }
});

/* ─────────────── تست‌های کد رهگیری و جستجو (محاسبهٔ خالص) ─────────────── */

test("کد رهگیری: قالب و اعتبارسنجی (شش رقم بدون صفر آغازین)", () => {
  assert.equal(isValidTrackingCode("849210"), true);
  assert.equal(isValidTrackingCode("100000"), true);
  assert.equal(isValidTrackingCode("999999"), true);
  assert.equal(isValidTrackingCode("049210"), false); // صفر آغازین
  assert.equal(isValidTrackingCode("84921"), false); // کوتاه
  assert.equal(isValidTrackingCode("8492101"), false); // بلند
  assert.equal(isValidTrackingCode("A49210"), false); // حرف
  assert.equal(isValidTrackingCode(""), false);
  assert.equal(isValidTrackingCode(null), false);
  assert.equal(isValidTrackingCode(undefined), false);
  assert.equal(isValidTrackingCode(849210), false); // رشتهٔ معتبر لازم است
  // مولد: ۲۰۰ نمونه همگی مطابق قالب
  for (let index = 0; index < 200; index += 1) {
    const code = generateTrackingCode();
    assert.ok(TRACKING_CODE_PATTERN.test(code), `کد تولیدی ناروا: ${code}`);
  }
});

test("جستجو: نرمال‌سازی ارقام فارسی/عربی و فاصله‌ها", () => {
  assert.equal(toLatinDigits("۸۴۹۲"), "8492");
  assert.equal(toLatinDigits("٠٩١٢"), "0912");
  assert.equal(toLatinDigits("الف ۹ ب"), "الف 9 ب");
  assert.equal(normalizeSearchQuery("  علی   رضایی "), "علی رضایی");
  assert.equal(normalizeSearchQuery("۸۴۹۲۱۰"), "849210");
  assert.equal(normalizeSearchQuery(""), "");
});

test("جستجو: تطبیق کد رهگیری/نام/موبایل با حساسیت‌زدایی و زیررشته", () => {
  const row = {
    trackingCode: "849210",
    patientName: "علی رضایی",
    patientPhone: "09121234567",
  };
  // کد رهگیری — کامل، با ارقام فارسی، با فاصله و ناقص
  assert.equal(appointmentMatchesQuery(row, "849210"), true);
  assert.equal(appointmentMatchesQuery(row, "  ۸۴۹۲۱۰  "), true);
  assert.equal(appointmentMatchesQuery(row, "8492"), true);
  assert.equal(appointmentMatchesQuery(row, "210"), true);
  assert.equal(appointmentMatchesQuery(row, "849211"), false);
  // نام بیمار — بدون حساسیت به فاصله
  assert.equal(appointmentMatchesQuery(row, "علی رضایی"), true);
  assert.equal(appointmentMatchesQuery(row, "  علی "), true);
  assert.equal(appointmentMatchesQuery(row, "کاظمی"), false);
  // تطبیق زیررشته: «رضا» پیشوندِ «رضایی» است و می‌خورد
  assert.equal(appointmentMatchesQuery(row, "رضا"), true);
  assert.equal(appointmentMatchesQuery(row, "علی 8492"), true); // «یا»یی: کد می‌خورد
  // شمارهٔ موبایل — با فاصله و ارقام فارسی هم می‌خواند
  assert.equal(appointmentMatchesQuery(row, "09121234567"), true);
  assert.equal(appointmentMatchesQuery(row, "۰۹۱۲ ۱۲۳ ۴۵۶۷"), true);
  assert.equal(appointmentMatchesQuery(row, "1234"), true);
  assert.equal(appointmentMatchesQuery(row, "9999"), false);
  // ورودی خالی → نمایش همهٔ نوبت‌ها (فیلتر غیرفعال)
  assert.equal(appointmentMatchesQuery(row, ""), true);
  assert.equal(appointmentMatchesQuery(row, "   "), true);
  // رشتهٔ بی‌رقم که نام نمی‌خورد
  assert.equal(appointmentMatchesQuery(row, "مریم"), false);
});

test("شبکهٔ نوبت (۱۰ دقیقه) مستقیماً از BRANCHES", () => {
  const saturday = "2026-10-31";
  const hediye = slotTimesForBranchDate("hediye-yousef", saturday);
  assert.equal(hediye.length, 51);
  assert.equal(hediye[0], "09:00");
  assert.equal(hediye[23], "12:50");
  assert.equal(hediye[24], "16:30");
  assert.equal(hediye[50], "20:50");

  const vatandar = slotTimesForBranchDate("vatandar", saturday);
  assert.equal(vatandar.length, 63);
  assert.equal(vatandar[0], "10:30");
  assert.equal(vatandar[62], "20:50");

  assert.equal(slotTimesForBranchDate("hediye-yousef", "2026-11-06").length, 0);
  assert.equal(slotTimesForBranchDate("vatandar", "2026-11-06").length, 0);
  assert.equal(isBranchOpenOnDate("hediye-yousef", "2026-11-06"), false);
  assert.equal(isBranchOpenOnDate("vatandar", "2026-11-06"), false);
});

test("ساعت‌های مجاز نوبت (مرزهای بازه)", () => {
  assert.equal(
    slotInstantUtcMs("hediye-yousef", "2026-10-31", "09:00"),
    tehranDateTimeToUtcMs("2026-10-31", "09:00"),
  );
  assert.equal(
    slotInstantUtcMs("hediye-yousef", "2026-10-31", "12:50"),
    tehranDateTimeToUtcMs("2026-10-31", "12:50"),
  );
  assert.equal(slotInstantUtcMs("hediye-yousef", "2026-10-31", "13:00"), null);
  assert.equal(slotInstantUtcMs("hediye-yousef", "2026-10-31", "08:50"), null);
  assert.equal(slotInstantUtcMs("hediye-yousef", "2026-10-31", "20:50"), tehranDateTimeToUtcMs("2026-10-31", "20:50"));
  assert.equal(slotInstantUtcMs("hediye-yousef", "2026-10-31", "21:00"), null);
  assert.equal(slotInstantUtcMs("hediye-yousef", "2026-11-06", "09:00"), null);
  assert.equal(getBookingBranch("vatandar")?.name, "وطندار");
  assert.equal(getBookingBranch("missing-branch"), undefined);
});

test("قواعد عمومی BOOKING در پیکربندی", () => {
  assert.equal(BOOKING.slotMinutes, 10);
  assert.equal(BOOKING.horizonDays, 60);
  assert.equal(BOOKING.leadMinutes, 30);
  assert.equal(BOOKING.tzOffsetMinutes, 210);
  assert.equal(BRANCHES.length, 2);
});

/* ─────────────── تست‌های نشست پذیرش (محاسبهٔ خالص) ─────────────── */

test("نشست: نام کوکی و عمر ۱۲ ساعته", () => {
  assert.equal(SESSION_COOKIE_NAME, "dental_admin_session");
  assert.equal(SESSION_TTL_MS, 12 * 60 * 60 * 1000);
});

test("نشست: ساخت و صحت‌سنجی توکن و انقضای آن", () => {
  const token = createSessionToken("reception", 1000);
  assert.equal(verifySessionToken(token, 1000)?.username, "reception");
  assert.equal(verifySessionToken(token, 1000 + SESSION_TTL_MS), null);
  assert.equal(verifySessionToken(token, 1000 + SESSION_TTL_MS + 1), null);
});

test("نشست: خرابکاری امضا/payload/garbage رد می‌شود", () => {
  const token = createSessionToken("reception", 1000);
  const [payloadB64, signature] = token.split(".");
  assert.notEqual(payloadB64, undefined);
  assert.notEqual(signature, undefined);

  // امضای خراب‌شده
  assert.equal(
    verifySessionToken(`${payloadB64}.این-امضا-جعلی`, 1000),
    null,
  );
  // payload دست‌کاری‌شده — امضا دیگر نمی‌خواند
  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  const sabotagedPayload = Buffer.from(
    payload.replace('"reception"', '"attacker"'),
    "utf8",
  ).toString("base64url");
  assert.equal(
    verifySessionToken(`${sabotagedPayload}.${signature}`, 1000),
    null,
  );
  assert.equal(verifySessionToken("no-dot-token", 1000), null);
  assert.equal(verifySessionToken("", 1000), null);
  assert.equal(verifySessionToken(undefined, 1000), null);
});

test("نشست: بدون AUTH_SECRET هیچ‌چیز پذیرفته نمی‌شود", () => {
  const token = createSessionToken("reception", 1000);
  const storedSecret = process.env["AUTH_SECRET"];
  try {
    process.env["AUTH_SECRET"] = "";
    assert.equal(verifySessionToken(token, 1000), null);
    assert.throws(() => createSessionToken("reception", 1000));
  } finally {
    process.env["AUTH_SECRET"] = String(storedSecret);
  }
});

test("مسدودسازی ورود ناموفق پشت‌سرهم (۵ بار در ۱۰ دقیقه)", () => {
  const key = "test-ip-a";
  resetLoginFailures(key);
  for (let count = 0; count < 5; count += 1) {
    recordLoginFailure(key, 1000);
  }
  assert.equal(isLoginThrottled(key, 2000), true);
  assert.equal(isLoginThrottled("test-ip-b", 2000), false);
  // پایان پنجرهٔ ۱۰ دقیقه‌ای
  assert.equal(isLoginThrottled(key, 1000 + 10 * 60 * 1000 + 1), false);
  resetLoginFailures(key);
  assert.equal(isLoginThrottled(key, 2500), false);
});

/* ─────────────────────── تست‌های پیامک (محاسبهٔ خالص) ─────────────────────── */

/** اجرای یک قطعه کد با مقدار موقتی متغیر محیطی (بازگردانی تضمینی) */
async function withEnvValue(
  name: string,
  value: string | undefined,
  run: () => Promise<void> | void,
): Promise<void> {
  const previous = process.env[name];
  try {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
    await run();
  } finally {
    if (previous === undefined) delete process.env[name];
    else process.env[name] = previous;
  }
}

/** استخراج کد دلیل از نتیجهٔ ارسال (با اطمینان از شکست) */
function reasonOf(outcome: SmsSendOutcome): string {
  assert.equal(outcome.ok, false);
  return outcome.ok ? "" : outcome.reason;
}

test("قالب پیامک تأیید: نام، تاریخ جلالی صریح، ساعت، شعبه، کد رهگیری و تلفن شعبه", () => {
  const text = buildBookingConfirmationText({
    branchId: "hediye-yousef",
    date: "2026-11-02",
    time: "09:00",
    patientName: "علی رضایی",
    trackingCode: "849210",
  });
  assert.ok(text.includes("علی رضایی عزیز"));
  assert.ok(text.includes("دوشنبه")); // روز هفتهٔ 2026-11-02
  assert.ok(text.includes("آبان"));
  assert.ok(text.includes("ساعت ۹:۰۰"));
  assert.ok(text.includes("هدیه یوسف"));
  assert.ok(text.includes("09936110745"));
  // کد رهگیری در متن پیامک با ارقام لاتین می‌آید
  assert.ok(text.includes("کد رهگیری"));
  assert.ok(text.includes("849210"));
  assert.ok(!text.includes("فردا")); // تاریخ نسبی ممنوع؛ همیشه تاریخ صریح
});

test("قالب پیامک یادآوری: بدون نام بیمار، با شعبه و تلفن", () => {
  const text = buildAppointmentReminderText({
    branchId: "vatandar",
    date: "2026-11-02",
    time: "10:30",
  });
  assert.ok(text.includes("یادآوری"));
  assert.ok(!text.includes("عزیز"));
  assert.ok(text.includes("وطندار"));
  assert.ok(text.includes("ساعت ۱۰:۳۰"));
  assert.ok(text.includes("09967868324"));
  assert.ok(!text.includes("فردا"));
});

test("پوشاندن شمارهٔ موبایل در گزارش‌ها", () => {
  assert.equal(maskPhone("09121234567"), "0912***4567");
  assert.equal(maskPhone("0912"), "***");
});

test("سرویس پیامک تنظیم‌نشده → شکست صریح (بدون رفتار جعلی)", async () => {
  await withEnvValue("SMS_PROVIDER", undefined, async () => {
    const outcome = await sendSms("09121234567", "متن آزمایشی");
    assert.equal(outcome.ok, false);
    assert.equal(reasonOf(outcome), "sms_provider_not_configured");
    assert.equal(outcome.provider, "none");
  });
});

test("سرویس mock: موفق، بدون شبکه، با نرمال‌سازی شمارهٔ فارسی", async () => {
  await withEnvValue("SMS_PROVIDER", "mock", async () => {
    const outcome = await sendSms("۰۹۳۵۱۱۱۲۲۳۳", "متن آزمایشی");
    assert.equal(outcome.ok, true);
    assert.equal(outcome.provider, "mock");
  });
});

test("ارسال به شمارهٔ نامعتبر پیش از رسیدن به سرویس رد می‌شود", async () => {
  await withEnvValue("SMS_PROVIDER", "mock", async () => {
    const outcome = await sendSms("07121234567", "متن آزمایشی");
    assert.equal(outcome.ok, false);
    assert.equal(reasonOf(outcome), "invalid_phone");
  });
});

test("کاوه‌نگار: درخواست و پاسخ موفق (fetch ساختگی — بدون شبکه)", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const stubFetch: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init: init ?? {} });
    return new Response(
      JSON.stringify({
        return: { status: 200, entries: [{ messageid: 4242 }] },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };
  await withEnvValue("SMS_PROVIDER", "kavenegar", async () => {
    await withEnvValue("KAVENEGAR_API_KEY", "test-api-key", async () => {
      await withEnvValue("KAVENEGAR_SENDER", "10008663", async () => {
        const provider = resolveSmsProvider(stubFetch);
        assert.equal(provider.name, "kavenegar");
        const outcome = await provider.send({ to: "09121234567", text: "متن" });
        assert.equal(outcome.ok, true);
        assert.equal(outcome.messageId, "4242");
        assert.equal(calls.length, 1);
        const call = calls[0]!;
        assert.ok(
          call.url.startsWith(
            "https://api.kavenegar.com/v1/test-api-key/sms/send.json",
          ),
        );
        assert.equal(call.init.method, "POST");
        const body = String(call.init.body);
        assert.ok(body.includes("receptor=09121234567"));
        assert.ok(body.includes("sender=10008663"));
        assert.ok(body.includes("message="));
      });
    });
  });
});

test("کاوه‌نگار: پاسخ‌های خطا به کدهای صریح تبدیل می‌شوند", async () => {
  assert.equal(
    reasonOf(
      await parseKavenegarResponse(new Response("ممنوع", { status: 401 })),
    ),
    "http_401",
  );
  assert.equal(
    reasonOf(
      await parseKavenegarResponse(
        new Response(JSON.stringify({ return: { status: 411 } }), {
          status: 200,
        }),
      ),
    ),
    "provider_status_411",
  );
  assert.equal(
    reasonOf(await parseKavenegarResponse(new Response("not json", { status: 200 }))),
    "invalid_response",
  );
  // خطای شبکه — سرویس واقعی با fetch ساختگیِ پرتاب‌کننده
  const failingFetch: typeof fetch = async () => {
    throw new Error("offline");
  };
  await withEnvValue("SMS_PROVIDER", "kavenegar", async () => {
    await withEnvValue("KAVENEGAR_API_KEY", "test-api-key", async () => {
      const provider = resolveSmsProvider(failingFetch);
      const outcome = await provider.send({ to: "09121234567", text: "متن" });
      assert.equal(reasonOf(outcome), "network_error");
    });
  });
});

test("کاوه‌نگار بدون کلید → سرویس «هیچ» (شکست صریح)", async () => {
  await withEnvValue("SMS_PROVIDER", "kavenegar", async () => {
    await withEnvValue("KAVENEGAR_API_KEY", undefined, async () => {
      const provider = resolveSmsProvider();
      assert.equal(provider.name, "none");
      const outcome = await provider.send({ to: "09121234567", text: "متن" });
      assert.equal(outcome.ok, false);
      assert.equal(reasonOf(outcome), "sms_provider_not_configured");
    });
  });
});

test("احراز فراخوان کرون: Bearer با مقایسهٔ زمان‌ثابت", () => {
  assert.equal(isAuthorizedCronCall("Bearer secret-value", "secret-value"), true);
  assert.equal(isAuthorizedCronCall("bearer secret-value", "secret-value"), true);
  assert.equal(isAuthorizedCronCall("Bearer wrong", "secret-value"), false);
  assert.equal(isAuthorizedCronCall("secret-value", "secret-value"), false); // بدون Bearer
  assert.equal(isAuthorizedCronCall(null, "secret-value"), false);
  assert.equal(isAuthorizedCronCall("Bearer secret-value", "   "), false); // CRON_SECRET خالی
  assert.equal(isAuthorizedCronCall("Bearer ", "secret-value"), false);
  assert.equal(isAuthorizedCronCall(undefined, "secret-value"), false);
});

/* ─────────────────────── اجرای رانر با پایگاه‌داده ─────────────────────── */

async function main(): Promise<void> {
  // پایگاه‌دادهٔ واقعی محلی (PGlite) + اعمال مهاجرت اولیه
  const client = new PGlite();
  const pglite = drizzlePglite(client);
  await migrate(pglite, {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  });
  const db = pglite as unknown as BookingDb;

  const nowFixedMs = tehranDateTimeToUtcMs("2026-11-01", "08:00");
  const todayFixed = todayTehranDate(nowFixedMs);
  assert.equal(todayFixed, "2026-11-01");

  /* ── ثبت و قواعد نوبت عمومی ── */

  test("ثبت نوبت عمومی موفق روی شبکهٔ صحیح", async () => {
    const result = await createPublicBooking(
      { db, nowUtcMs: nowFixedMs },
      { ...REQUEST_OK },
    );
    const booking = unwrap(result, "ثبت نوبت عمومی");
    assert.equal(booking.branchId, "hediye-yousef");
    assert.equal(booking.date, "2026-11-02");
    assert.equal(booking.time, "09:00");
    assert.equal(booking.startsAtUtc, "2026-11-02T05:30:00.000Z");
    assert.equal(booking.source, "public");
    assert.match(booking.id, /^[0-9a-f-]{36}$/);
    // کد رهگیری ۶ رقمی همراه نوبت برمی‌گردد
    assert.ok(
      isValidTrackingCode(booking.trackingCode),
      `قالب کد رهگیری نامعتبر: ${booking.trackingCode}`,
    );
  });

  test("ثبت هم‌زمان همان نوبت دوباره → slot_taken (قید یکتای پایگاه‌داده)", async () => {
    const result = await createPublicBooking(
      { db, nowUtcMs: nowFixedMs },
      {
        ...REQUEST_OK,
        patientName: "مریم کاظمی",
        patientPhone: "09351112233",
      },
    );
    expectErrorCode(result, "slot_taken", "نوبت تکراری");
  });

  test("همان لحظه در شعبهٔ دیگر → امکان‌پذیر است (دو تقویم مستقل)", async () => {
    const result = await createPublicBooking(
      { db, nowUtcMs: nowFixedMs },
      { ...REQUEST_OK, branchId: "vatandar", time: "10:30" },
    );
    const booking = unwrap(result, "نوبت موازی شعبهٔ دیگر");
    assert.equal(booking.branchId, "vatandar");
  });

  test("روز جمعه → closed_day", async () => {
    const result = await createPublicBooking(
      { db, nowUtcMs: nowFixedMs },
      { ...REQUEST_OK, date: "2026-11-06" },
    );
    expectErrorCode(result, "closed_day", "نوبت جمعه");
  });

  test("ساعت بیرون شبکه → invalid_time", async () => {
    const result = await createPublicBooking(
      { db, nowUtcMs: nowFixedMs },
      { ...REQUEST_OK, time: "08:50" },
    );
    expectErrorCode(result, "invalid_time", "ساعت خارج شبکه");
  });

  test("فاصلهٔ کمتر از ۳۰ دقیقه → lead_time", async () => {
    const nowJustBefore = tehranDateTimeToUtcMs("2026-11-02", "08:45");
    const result = await createPublicBooking(
      { db, nowUtcMs: nowJustBefore },
      { ...REQUEST_OK },
    );
    expectErrorCode(result, "lead_time", "فاصلهٔ کمینه");
  });

  test("مرز افق ۶۰ روز: روز ۶۰ مجاز است", async () => {
    const result = await createPublicBooking(
      { db, nowUtcMs: nowFixedMs },
      {
        ...REQUEST_OK,
        branchId: "vatandar",
        date: addDays(todayFixed, 60),
        time: "10:30",
        patientName: "سارا موسوی",
      },
    );
    const booking = unwrap(result, "مرز افق");
    assert.equal(booking.date, "2026-12-31");
  });

  test("فراتر از افق ۶۰ روز → horizon", async () => {
    const result = await createPublicBooking(
      { db, nowUtcMs: nowFixedMs },
      {
        ...REQUEST_OK,
        date: addDays(todayFixed, 62),
        patientName: "سارا موسوی",
      },
    );
    expectErrorCode(result, "horizon", "افق رزرو");
  });

  test("نام نامعتبر و موبایل نامعتبر", async () => {
    expectErrorCode(
      await createPublicBooking({ db, nowUtcMs: nowFixedMs }, {
        ...REQUEST_OK,
        time: "10:30",
        patientName: "ا",
        patientPhone: "09121234568",
      }),
      "invalid_name",
      "نام کوتاه",
    );
    expectErrorCode(
      await createPublicBooking({ db, nowUtcMs: nowFixedMs }, {
        ...REQUEST_OK,
        time: "10:30",
        patientName: "حسین کریمی",
        patientPhone: "12345",
      }),
      "invalid_phone",
      "موبایل نامعتبر",
    );
    expectErrorCode(
      await createPublicBooking({ db, nowUtcMs: nowFixedMs }, {
        ...REQUEST_OK,
        branchId: "missing-branch",
        patientName: "حسین کریمی",
        patientPhone: "09121234568",
      }),
      "invalid_branch",
      "شعبهٔ ناموجود",
    );
  });

  /* ── کد رهگیری نوبت (روی PGlite) ── */

  test("کد رهگیری: هر نوبت کد معتبر و یکتا می‌گیرد", async () => {
    const times = ["10:40", "10:50", "11:10", "11:20"];
    const codes: string[] = [];
    const ids: string[] = [];
    for (const [index, time] of times.entries()) {
      const result = await createPublicBooking(
        { db, nowUtcMs: nowFixedMs },
        {
          ...REQUEST_OK,
          time,
          patientName: `بیمار کد ${index + 1}`,
        },
      );
      const booking = unwrap(result, `ثبت نوبت کد رهگیری ${index + 1}`);
      assert.ok(
        isValidTrackingCode(booking.trackingCode),
        `قالب کد تولیدی نامعتبر: ${booking.trackingCode}`,
      );
      codes.push(booking.trackingCode);
      ids.push(booking.id);
    }
    // یکتایی کدها در این دنباله از ثبت‌ها
    assert.equal(new Set(codes).size, codes.length, "کدها یکتا نیستند");
    // پاک‌سازی: نوبت‌های آزمون حذف می‌شوند تا پنجرهٔ یادآوری آزمون‌های
    // بعدی همان ۴ نوبتِ انتظار را ببیند
    for (const id of ids) {
      unwrap(await deleteAppointment({ db }, id), `پاک‌سازی نوبت ${id}`);
    }
  });

  test("کد رهگیری: برخورد کد تکراری → بازتلاش با کد تازه (نه slot_taken)", async () => {
    // ردیف بذری با کد معلوم؛ مولدِ تزریق‌شده نخست همان کد را برمی‌گرداند
    await pglite.insert(appointments).values({
      branchId: "vatandar",
      startsAtUtc: new Date(tehranDateTimeToUtcMs("2026-11-02", "12:00")),
      patientName: "بذری کد رهگیری",
      patientPhone: "09361110001",
      trackingCode: "911100",
      source: "public",
      createdBy: null,
    });
    let calls = 0;
    const result = await createPublicBooking(
      { db, nowUtcMs: nowFixedMs },
      {
        ...REQUEST_OK,
        branchId: "vatandar",
        time: "10:40",
        patientName: "بازتلاش کد رهگیری",
      },
      {
        generateTrackingCode: () => {
          calls += 1;
          return calls <= 2 ? "911100" : "911101";
        },
      },
    );
    const booking = unwrap(result, "بازتلاش برخورد کد رهگیری");
    assert.equal(booking.trackingCode, "911101");
    assert.equal(calls, 3); // دو برخورد، سپس موفقیت با کد سوم
    // پاک‌سازی: نوبت موفق و ردیف بذری حذف می‌شوند (شمارش پنجرهٔ یادآوری)
    unwrap(await deleteAppointment({ db }, booking.id), "پاک‌سازی بازتلاش");
    const rowsAfter = await db.select().from(appointments);
    const seed = rowsAfter.find((entry) => entry.trackingCode === "911100")!;
    unwrap(await deleteAppointment({ db }, seed.id), "پاک‌سازی بذری");
  });

  /* ── نوبت دستی پذیرش ── */

  let staffBookingId = "";

  test("ثبت دستی نوبت گذشته توسط پذیرش (بدون قید افق/فاصله)", async () => {
    const result = await createStaffBooking(
      { db },
      "reception",
      {
        branchId: "hediye-yousef",
        date: "2024-05-05",
        time: "10:30",
        patientName: "مریم کاظمی",
        patientPhone: "۰۹۳۵۱۱۱۲۲۳۳",
      },
    );
    const booking = unwrap(result, "ثبت دستی گذشته");
    assert.equal(booking.source, "staff");
    assert.equal(booking.patientPhone, "09351112233");
    assert.equal(booking.date, "2024-05-05");
    staffBookingId = booking.id;
  });

  test("فهرست روز پنل: نقشهٔ UTC ↔ تهران درست است", async () => {
    const result = await listDayAppointments({ db }, "hediye-yousef", "2024-05-05");
    const rows = unwrap(result, "فهرست روز گذشته");
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.time, "10:30");
    assert.equal(rows[0]?.source, "staff");
    assert.equal(rows[0]?.createdBy, "reception");
    assert.equal(rows[0]?.patientName, "مریم کاظمی");
    // کد رهگیری در ردیف پنل پذیرش هم هست
    assert.ok(
      isValidTrackingCode(rows[0]?.trackingCode ?? ""),
      `قالب کد رهگیری ردیف پنل نامعتبر: ${String(rows[0]?.trackingCode)}`,
    );
    assert.deepEqual(
      tehranDateTimeParts(Date.parse(rows[0]!.startsAtUtc)),
      { date: "2024-05-05", time: "10:30" },
    );
  });

  test("فهرست روزِ تاریخ نامعتبر → invalid_date", async () => {
    const result = await listDayAppointments(
      { db },
      "hediye-yousef",
      "2026-13-40",
    );
    expectErrorCode(result, "invalid_date", "تاریخ نامعتبر");
  });

  /* ── موجودی ساعات ── */

  test("موجودی: نوبت ثبت‌شده «booked» و بقیه «open»", async () => {
    const result = await getAvailabilityForDays(
      { db, nowUtcMs: nowFixedMs },
      "hediye-yousef",
      ["2026-11-02"],
    );
    const days = unwrap(result, "موجودی روز آینده");
    assert.equal(days.length, 1);
    const day = days[0]!;
    assert.equal(day.closed, false);
    assert.equal(day.slots.length, 51);
    const nine = day.slots.find((slot) => slot.time === "09:00");
    assert.equal(nine?.status, "booked");
    const nineTen = day.slots.find((slot) => slot.time === "09:10");
    assert.equal(nineTen?.status, "open");
  });

  test("موجودی: ساعات نزدیک «الان» به‌صورت «past» (قید ۳۰ دقیقه)", async () => {
    const nowNearSlot = tehranDateTimeToUtcMs("2026-11-02", "09:25");
    const result = await getAvailabilityForDays(
      { db, nowUtcMs: nowNearSlot },
      "hediye-yousef",
      ["2026-11-02"],
    );
    const days = unwrap(result, "موجودی نزدیک الان");
    const day = days[0]!;
    assert.equal(day.slots.find((slot) => slot.time === "09:00")?.status, "booked");
    assert.equal(day.slots.find((slot) => slot.time === "09:10")?.status, "past");
    assert.equal(day.slots.find((slot) => slot.time === "10:00")?.status, "open");
  });

  test("موجودی: روز جمعه → closed", async () => {
    const result = await getAvailabilityForDays(
      { db, nowUtcMs: nowFixedMs },
      "hediye-yousef",
      ["2026-11-06"],
    );
    const days = unwrap(result, "موجودی جمعه");
    assert.equal(days[0]?.closed, true);
    assert.equal(days[0]?.slots.length, 0);
  });

  test("موجودی: شعبهٔ نامعتبر → invalid_branch", async () => {
    const result = await getAvailabilityForDays(
      { db, nowUtcMs: nowFixedMs },
      "missing-branch",
      ["2026-11-02"],
    );
    expectErrorCode(result, "invalid_branch", "موجودی شعبهٔ نامعتبر");
  });

  /* ── حذف (فقط مسیر پذیرش در عملیات؛ اینجا منطق سرویس) ── */

  test("حذف نوبت دستی و تکرار حذف → not_found", async () => {
    assert.ok(staffBookingId !== "");
    const deleted = await deleteAppointment({ db }, staffBookingId);
    assert.deepEqual(unwrap(deleted, "حذف نوبت"), { id: staffBookingId });
    const again = await deleteAppointment({ db }, staffBookingId);
    expectErrorCode(again, "not_found", "حذف مجدد");
    const garbage = await deleteAppointment({ db }, "not-a-uuid");
    expectErrorCode(garbage, "not_found", "شناسهٔ نامعتبر");
    const rows = await listDayAppointments({ db }, "hediye-yousef", "2024-05-05");
    assert.equal(unwrap(rows, "فهرست پس از حذف").length, 0);
  });

  /* ── قیدهای خود پایگاه‌داده (CHECK و UNIQUE) ── */

  test("CHECK: موبایل غیر از 09xxxxxxxxx رد می‌شود", async () => {
    await assert.rejects(
      () =>
        pglite
          .insert(appointments)
          .values({
            branchId: "hediye-yousef",
            startsAtUtc: new Date(tehranDateTimeToUtcMs("2026-11-03", "09:00")),
            patientName: "تست مستقیم",
            patientPhone: "07121234567",
            trackingCode: "911001",
            source: "public",
            createdBy: null,
          }),
      (error: unknown) => inspect(error).includes("phone_format"),
    );
  });

  test("CHECK: شعبهٔ خارج از فهرست رد می‌شود", async () => {
    await assert.rejects(
      () =>
        pglite
          .insert(appointments)
          .values({
            branchId: "missing-branch",
            startsAtUtc: new Date(tehranDateTimeToUtcMs("2026-11-03", "09:00")),
            patientName: "تست مستقیم",
            patientPhone: "09121234567",
            trackingCode: "911002",
            source: "public",
            createdBy: null,
          }),
      (error: unknown) => inspect(error).includes("branch_id_valid"),
    );
  });

  test("UNIQUE: درج مستقیم تکراری (branch, starts_at) رد می‌شود (23505)", async () => {
    await assert.rejects(
      () =>
        pglite
          .insert(appointments)
          .values({
            branchId: "vatandar",
            startsAtUtc: new Date(tehranDateTimeToUtcMs("2026-11-02", "10:30")),
            patientName: "تست مستقیم",
            patientPhone: "09121234567",
            trackingCode: "911003",
            source: "public",
            createdBy: null,
          }),
      (error: unknown) =>
        inspect(error).includes("duplicate key value violates unique constraint"),
    );
  });

  /* ── سامانه پیامک: ستون‌های وضعیت و کار یادآوری (روی PGlite) ── */

  test("ستون‌های پیامک: status پیش‌فرض «confirmed» و دو timestamp تهی", async () => {
    const inserted = await pglite
      .insert(appointments)
      .values({
        branchId: "hediye-yousef",
        startsAtUtc: new Date(tehranDateTimeToUtcMs("2026-11-02", "10:30")),
        patientName: "نوبت یادآوری",
        patientPhone: "09351112233",
        trackingCode: "911004",
        source: "public",
        createdBy: null,
      })
      .returning({ id: appointments.id });
    const newId = inserted[0]!.id;
    const rows = await db.select().from(appointments);
    const row = rows.find((entry) => entry.id === newId)!;
    assert.equal(row.status, "confirmed");
    assert.equal(row.reminderSentAt, null);
    assert.equal(row.confirmationSentAt, null);
  });

  test("CHECK: وضعیت خارج از فهرست رد می‌شود", async () => {
    await assert.rejects(
      () =>
        pglite
          .insert(appointments)
          .values({
            branchId: "hediye-yousef",
            startsAtUtc: new Date(tehranDateTimeToUtcMs("2026-11-02", "12:20")),
            patientName: "تست مستقیم",
            patientPhone: "09121234567",
            trackingCode: "911005",
            source: "public",
            createdBy: null,
            status: "postponed",
          }),
      (error: unknown) => inspect(error).includes("status_valid"),
    );
  });

  test("کار یادآوری: ارسال همهٔ واجد شرایط پنجره و علامت‌گذاری آن‌ها", async () => {
    // نوبت همین امروزِ درون پنجره (پس از «الان») — متن باید تاریخ صریح داشته باشد
    await pglite.insert(appointments).values({
      branchId: "hediye-yousef",
      startsAtUtc: new Date(tehranDateTimeToUtcMs("2026-11-01", "16:30")),
      patientName: "نوبت امشب",
      patientPhone: "09361112244",
      trackingCode: "911006",
      source: "public",
      createdBy: null,
    });

    const sent: Array<{
      patientPhone: string;
      branchId: string;
      date: string;
      time: string;
    }> = [];
    const recordingSend: ReminderSender = async (appointment) => {
      sent.push({ ...appointment });
      return {
        ok: true,
        provider: "test",
        messageId: `test-${sent.length}`,
      };
    };

    const result = await runReminderJob({
      db,
      nowUtcMs: nowFixedMs,
      send: recordingSend,
    });
    const summary = unwrapSummary(result, "اجرای کار یادآوری");
    // درون پنجره: هدیه‌یوسف ۱۱-۰۲ ۰۹:۰۰ (از ثبت عمومی پیشین)،
    // وطندار ۱۱-۰۲ ۱۰:۳۰ (پیشین)، هدیه‌یوسف ۱۱-۰۲ ۱۰:۳۰ (تست ستون‌ها)،
    // هدیه‌یوسف ۱۱-۰۱ ۱۶:۳۰ (همین تست)
    assert.equal(summary.considered, 4);
    assert.equal(summary.sent, 4);
    assert.equal(summary.failed, 0);
    assert.equal(summary.skipped, 0);
    assert.equal(summary.windowUntilUtc, new Date(
      tehranDayStartUtcMs("2026-11-03"),
    ).toISOString());
    // نگاشت UTC ↔ تهران در پیامک: نوبت ۱۱-۰۱ ۱۶:۳۰ با تاریخ/ساعت خودش
    assert.deepEqual(
      sent.find((entry) => entry.time === "16:30"),
      {
        patientPhone: "09361112244",
        branchId: "hediye-yousef",
        date: "2026-11-01",
        time: "16:30",
      },
    );
    // همهٔ چهار نوبت علامت خورده‌اند
    const rows = await db.select().from(appointments);
    const windowRows = rows.filter((entry) => {
      const ms = entry.startsAtUtc.getTime();
      return ms > nowFixedMs && ms < Date.parse(summary.windowUntilUtc);
    });
    assert.equal(windowRows.length, 4);
    for (const entry of windowRows) {
      assert.notEqual(entry.reminderSentAt, null);
    }
  });

  test("کار یادآوری: اجرای دوباره هیچ ارسال تکراری نمی‌کند", async () => {
    let sendCount = 0;
    const result = await runReminderJob({
      db,
      nowUtcMs: nowFixedMs,
      send: async () => {
        sendCount += 1;
        return { ok: true, provider: "test", messageId: "x" };
      },
    });
    const summary = unwrapSummary(result, "اجرای دوبارهٔ یادآوری");
    assert.equal(summary.considered, 0);
    assert.equal(sendCount, 0);
  });

  test("پنجرهٔ یادآوری: نوبت «cancelled» رد می‌شود", async () => {
    await pglite.insert(appointments).values({
      branchId: "hediye-yousef",
      startsAtUtc: new Date(tehranDateTimeToUtcMs("2026-11-02", "11:00")),
      patientName: "نوبت لغوشده",
      patientPhone: "09391112288",
      trackingCode: "911007",
      source: "public",
      createdBy: null,
      status: "cancelled",
    });
    const result = await runReminderJob({ db, nowUtcMs: nowFixedMs });
    const summary = unwrapSummary(result, "یادآوری نوبت لغوشده");
    assert.equal(summary.considered, 0);
  });

  test("پنجرهٔ یادآوری: «اکنون» و پس‌فردا بیرون پنجره‌اند", async () => {
    await pglite.insert(appointments).values({
      branchId: "hediye-yousef",
      startsAtUtc: new Date(tehranDateTimeToUtcMs("2026-11-01", "08:00")),
      patientName: "شروع‌شده",
      patientPhone: "09391112266",
      trackingCode: "911008",
      source: "public",
      createdBy: null,
    });
    await pglite.insert(appointments).values({
      branchId: "hediye-yousef",
      startsAtUtc: new Date(tehranDateTimeToUtcMs("2026-11-03", "09:00")),
      patientName: "پس‌فردا",
      patientPhone: "09391112277",
      trackingCode: "911009",
      source: "public",
      createdBy: null,
    });
    const result = await runReminderJob({ db, nowUtcMs: nowFixedMs });
    const summary = unwrapSummary(result, "یادآوری مرز پنجره");
    assert.equal(summary.considered, 0);
  });

  test("کار یادآوری: شکست ارسال ادعا را پس می‌گیرد و اجرای بعدی تلاش می‌کند", async () => {
    await pglite.insert(appointments).values({
      branchId: "hediye-yousef",
      startsAtUtc: new Date(tehranDateTimeToUtcMs("2026-11-02", "12:00")),
      patientName: "تست شکست ارسال",
      patientPhone: "09371112255",
      trackingCode: "911010",
      source: "public",
      createdBy: null,
    });

    let attempts = 0;
    const flakySend: ReminderSender = async () => {
      attempts += 1;
      if (attempts === 1) {
        return { ok: false, provider: "test", reason: "simulated_failure" };
      }
      return { ok: true, provider: "test", messageId: `ok-${attempts}` };
    };

    const first = await runReminderJob({
      db,
      nowUtcMs: nowFixedMs,
      send: flakySend,
    });
    const firstSummary = unwrapSummary(first, "اجرای نخست یادآوری");
    assert.equal(firstSummary.considered, 1);
    assert.equal(firstSummary.failed, 1);
    assert.equal(firstSummary.sent, 0);
    assert.equal(firstSummary.failedAppointmentIds.length, 1);

    // ادعا پس گرفته شده است — ستون دوباره تهی است
    const rows = await db.select().from(appointments);
    const failedRow = rows.find(
      (entry) => entry.patientPhone === "09371112255",
    )!;
    assert.equal(failedRow.reminderSentAt, null);

    const second = await runReminderJob({
      db,
      nowUtcMs: nowFixedMs,
      send: flakySend,
    });
    const secondSummary = unwrapSummary(second, "اجرای دوم یادآوری");
    assert.equal(secondSummary.considered, 1);
    assert.equal(secondSummary.sent, 1);
    const rowsAfter = await db.select().from(appointments);
    const okRow = rowsAfter.find(
      (entry) => entry.patientPhone === "09371112255",
    )!;
    assert.notEqual(okRow.reminderSentAt, null);
  });

  /* ── نظرات بیماران: ثبت، تعدیل و نمایش عمومی ── */

  const TESTIMONIAL_OK = {
    patientName: "سارا موسوی",
    comment: "برخورد پذیرش عالی بود و درمان بدون درد انجام شد؛ ممنون از تیم خوب.",
    rating: 5,
    treatmentType: "examination",
  };

  test("ثبت نظر: اعتبارسنجی نام/متن/امتیاز/خدمت در سمت سرور", async () => {
    expectErrorCode(
      await submitTestimonial({ db }, { ...TESTIMONIAL_OK, patientName: "ا" }),
      "invalid_name",
      "نام کوتاه",
    );
    expectErrorCode(
      await submitTestimonial({ db }, { ...TESTIMONIAL_OK, comment: "کوتاه" }),
      "invalid_comment",
      "متن کوتاه",
    );
    expectErrorCode(
      await submitTestimonial({ db }, { ...TESTIMONIAL_OK, rating: 6 }),
      "invalid_rating",
      "امتیاز بیش از ۵",
    );
    expectErrorCode(
      await submitTestimonial({ db }, { ...TESTIMONIAL_OK, rating: 4.5 }),
      "invalid_rating",
      "امتیاز غیرصحیح",
    );
    expectErrorCode(
      await submitTestimonial({ db }, { ...TESTIMONIAL_OK, treatmentType: "nope" }),
      "invalid_treatment",
      "خدمت ناشناخته",
    );
  });

  test("ثبت نظر موفق: همیشه «در انتظار تأیید» و بیرون از نمایش عمومی", async () => {
    const result = await submitTestimonial({ db }, TESTIMONIAL_OK);
    const submitted = unwrap(result, "ثبت نظر اول");
    assert.match(submitted.id, /^[0-9a-f-]{36}$/);

    // در نمایش عمومی چیزی نیست
    const approved = unwrap(
      await listApprovedTestimonials({ db }),
      "فهرست عمومی خالی",
    );
    assert.equal(approved.length, 0);
    // در صف پذیرش است
    const pending = unwrap(
      await listTestimonialsByStatus({ db }, "pending"),
      "صف انتظار",
    );
    assert.equal(pending.length, 1);
    assert.equal(pending[0].isApproved, false);
    assert.equal(pending[0].id, submitted.id);
  });

  test("تعدیل: تأیید با شناسهٔ بی‌معنا → not_found؛ تأیید واقعی → نمایش عمومی", async () => {
    expectErrorCode(
      await approveTestimonial({ db }, "not-a-uuid"),
      "not_found",
      "تأیید شناسهٔ بی‌معنا",
    );
    const pending = unwrap(
      await listTestimonialsByStatus({ db }, "pending"),
      "صف انتظار پیش از تأیید",
    );
    const targetId = pending[0].id;

    const approved = unwrap(await approveTestimonial({ db }, targetId), "تأیید نظر");
    assert.deepEqual(approved, { id: targetId });

    const publicRows = unwrap(
      await listApprovedTestimonials({ db }),
      "فهرست عمومی پس از تأیید",
    );
    assert.equal(publicRows.length, 1);
    assert.equal(publicRows[0].id, targetId);
    assert.equal(publicRows[0].isApproved, true);
    assert.equal(publicRows[0].rating, 5);
    assert.equal(publicRows[0].treatmentType, "examination");

    // صف انتظار خالی شد؛ «همه» همان یکی را دارد
    assert.equal(
      unwrap(await listTestimonialsByStatus({ db }, "pending"), "صف خالی").length,
      0,
    );
    assert.equal(
      unwrap(await listTestimonialsByStatus({ db }, "all"), "همهٔ نظرات").length,
      1,
    );
    expectErrorCode(
      await listTestimonialsByStatus({ db }, "weird"),
      "invalid_status",
      "وضعیت نامعتبر",
    );
  });

  test("ترتیب عمومی: تازه‌ترین نظر تأییدشده اول", async () => {
    const second = unwrap(
      await submitTestimonial({ db }, {
        ...TESTIMONIAL_OK,
        patientName: "مریم کاظمی",
        comment: "جرم‌گیری خیلی آرام و دقیق انجام شد؛ حتماً دوباره مراجعه می‌کنم.",
        rating: 4,
        treatmentType: "scaling",
      }),
      "ثبت نظر دوم",
    );
    const approveResult = await approveTestimonial({ db }, second.id);
    unwrap(approveResult, "تأیید نظر دوم");

    const publicRows = unwrap(
      await listApprovedTestimonials({ db }),
      "فهرست عمومی دوتایی",
    );
    assert.equal(publicRows.length, 2);
    assert.equal(publicRows[0].id, second.id); // تازه‌ترین اول
    assert.equal(publicRows[0].rating, 4);
  });

  test("حذف نظر و تکرار حذف → not_found؛ حذف از نمایش عمومی", async () => {
    const publicRows = unwrap(
      await listApprovedTestimonials({ db }),
      "فهرست عمومی پیش از حذف",
    );
    const oldest = publicRows[publicRows.length - 1].id;

    const deleted = unwrap(await deleteTestimonial({ db }, oldest), "حذف نظر");
    assert.deepEqual(deleted, { id: oldest });
    expectErrorCode(
      await deleteTestimonial({ db }, oldest),
      "not_found",
      "حذف مجدد",
    );
    assert.equal(
      unwrap(await listApprovedTestimonials({ db }), "فهرست پس از حذف").length,
      1,
    );
  });

  test("CHECK نظرات: امتیاز/خدمت/طول متن خارج از قاعده رد می‌شود", async () => {
    await assert.rejects(
      () =>
        pglite
          .insert(testimonials)
          .values({
            patientName: "تست مستقیم",
            comment: "متن نظر برای آزمودن قید امتیاز در پایگاه‌داده.",
            rating: 6,
            treatmentType: "scaling",
          }),
      (error: unknown) => inspect(error).includes("rating_range"),
    );
    await assert.rejects(
      () =>
        pglite
          .insert(testimonials)
          .values({
            patientName: "تست مستقیم",
            comment: "متن نظر برای آزمودن قید خدمت در پایگاه‌داده.",
            rating: 4,
            treatmentType: "nope",
          }),
      (error: unknown) => inspect(error).includes("treatment_valid"),
    );
    await assert.rejects(
      () =>
        pglite
          .insert(testimonials)
          .values({
            patientName: "تست مستقیم",
            comment: "ب".repeat(501),
            rating: 4,
            treatmentType: "scaling",
          }),
      (error: unknown) =>
        // ستون varchar(500) زودتر رد می‌کند؛ قید CHECK لایهٔ دوم است
        inspect(error).includes("comment_length") ||
        inspect(error).includes("value too long"),
    );
  });

  /* ── نمونه‌کارهای قبل و بعد: ایجاد، ویرایش، انتشار و حذف ── */

  const GALLERY_OK = {
    title: "ایمپلنت دندان پیشین",
    description: "کاشت ایمپلنت و روکش سرامیکی؛ نتیجه در یک مرحلهٔ درمانی.",
    treatmentType: "prosthesis",
    beforeImageUrl: "https://example.com/case-1-before.jpg",
    afterImageUrl: "https://example.com/case-1-after.jpg",
  };

  test("نمونه‌کار: اعتبارسنجی عنوان/خدمت/تصویر/توضیح در سمت سرور", async () => {
    expectErrorCode(
      await createGalleryCase({ db }, { ...GALLERY_OK, title: "اب" }),
      "invalid_title",
      "عنوان کوتاه",
    );
    expectErrorCode(
      await createGalleryCase({ db }, { ...GALLERY_OK, title: "ع".repeat(81) }),
      "invalid_title",
      "عنوان بلند",
    );
    expectErrorCode(
      await createGalleryCase({ db }, { ...GALLERY_OK, treatmentType: "nope" }),
      "invalid_treatment",
      "خدمت ناشناخته",
    );
    expectErrorCode(
      await createGalleryCase(
        { db },
        { ...GALLERY_OK, beforeImageUrl: "javascript:alert(1)" },
      ),
      "invalid_image",
      "طرح نامعتبر",
    );
    expectErrorCode(
      await createGalleryCase(
        { db },
        { ...GALLERY_OK, afterImageUrl: "http://example.com/a.jpg" },
      ),
      "invalid_image",
      "http ناامن",
    );
    expectErrorCode(
      await createGalleryCase({ db }, { ...GALLERY_OK, description: "ت".repeat(401) }),
      "invalid_description",
      "توضیح بلند",
    );
    // مسیر نسبی سایت مجاز است — ایجاد و سپس پاک‌سازی برای آزمون‌های بعدی
    const relative = unwrap(
      await createGalleryCase(
        { db },
        {
          ...GALLERY_OK,
          beforeImageUrl: "/before-after/b.jpg",
          afterImageUrl: "/before-after/a.jpg",
        },
      ),
      "ایجاد با مسیر نسبی",
    );
    unwrap(await deleteGalleryCase({ db }, relative.id), "پاک‌سازی مسیر نسبی");
  });

  test("ایجاد نمونه: پیش‌فرض منتشرشده؛ پیش‌نویس از نمایش عمومی پنهان", async () => {
    const created = unwrap(await createGalleryCase({ db }, GALLERY_OK), "ایجاد نمونه اول");
    assert.match(created.id, /^[0-9a-f-]{36}$/);

    const all = unwrap(await listGalleryCasesByStatus({ db }, "all"), "فهرست همه");
    assert.equal(all.length, 1);
    assert.equal(all[0].isPublished, true);

    const publicRows = unwrap(await listPublishedGalleryCases({ db }), "فهرست عمومی");
    assert.equal(publicRows.length, 1);
    assert.equal(publicRows[0].id, created.id);

    const draft = unwrap(
      await createGalleryCase(
        { db },
        { ...GALLERY_OK, title: "نمونهٔ پیش‌نویس", isPublished: false },
      ),
      "ایجاد پیش‌نویس",
    );
    assert.equal(
      unwrap(await listPublishedGalleryCases({ db }), "عمومی پس از پیش‌نویس").length,
      1,
    );
    const drafts = unwrap(await listGalleryCasesByStatus({ db }, "draft"), "فهرست پیش‌نویس");
    assert.equal(drafts.length, 1);
    assert.equal(drafts[0].id, draft.id);

    expectErrorCode(
      await listGalleryCasesByStatus({ db }, "weird"),
      "invalid_status",
      "وضعیت نامعتبر",
    );
  });

  test("فیلتر عمومی بر حسب نوع خدمت", async () => {
    const whitening = unwrap(
      await createGalleryCase(
        { db },
        { ...GALLERY_OK, title: "سفیدکردن دندان‌ها", treatmentType: "whitening" },
      ),
      "ایجاد نمونه سفیدکردن",
    );
    const prosthesis = unwrap(
      await listPublishedGalleryCases({ db }, "prosthesis"),
      "فیلتر ایمپلنت",
    );
    assert.equal(prosthesis.length, 1);
    assert.equal(prosthesis[0].treatmentType, "prosthesis");
    assert.equal(
      unwrap(await listPublishedGalleryCases({ db }, "whitening"), "فیلتر سفیدکردن")[0]
        .id,
      whitening.id,
    );
    expectErrorCode(
      await listPublishedGalleryCases({ db }, "nope"),
      "invalid_treatment",
      "خدمت نامعتبر",
    );
    // پیش‌نویس آزمون قبل حذف می‌شود تا شمارش‌های بعدی ساده بماند
    const drafts = unwrap(
      await listGalleryCasesByStatus({ db }, "draft"),
      "پیش‌نویس پیش از حذف",
    );
    unwrap(await deleteGalleryCase({ db }, drafts[0].id), "حذف پیش‌نویس");
  });

  test("ترتیب عمومی: تازه‌ترین نمونه اول", async () => {
    const newest = unwrap(
      await createGalleryCase({ db }, { ...GALLERY_OK, title: "نمونهٔ تازه" }),
      "ایجاد نمونه تازه",
    );
    const publicRows = unwrap(await listPublishedGalleryCases({ db }), "فهرست عمومی سه‌تایی");
    assert.equal(publicRows.length, 3);
    assert.equal(publicRows[0].id, newest.id);
  });

  test("به‌روزرسانی نمونه: عنوان/توضیح/انتشار + شناسهٔ بی‌معنا → not_found", async () => {
    expectErrorCode(
      await updateGalleryCase({ db }, "not-a-uuid", { title: "عنوان تازه" }),
      "not_found",
      "به‌روزرسانی شناسهٔ بی‌معنا",
    );
    const all = unwrap(
      await listGalleryCasesByStatus({ db }, "all"),
      "فهرست پیش از به‌روزرسانی",
    );
    const target = all.find((row) => row.title === "نمونهٔ تازه")!;

    const updated = unwrap(
      await updateGalleryCase({ db }, target.id, { title: "ایمپلنت تازه", description: "" }),
      "به‌روزرسانی نمونه",
    );
    assert.deepEqual(updated, { id: target.id });
    const rowAfter = unwrap(
      await listGalleryCasesByStatus({ db }, "all"),
      "فهرست پس از به‌روزرسانی",
    ).find((row) => row.id === target.id)!;
    assert.equal(rowAfter.title, "ایمپلنت تازه");
    assert.equal(rowAfter.description, null); // توضیح خالی → بدون توضیح

    unwrap(await updateGalleryCase({ db }, target.id, { isPublished: false }), "پنهان‌سازی");
    assert.equal(
      unwrap(await listPublishedGalleryCases({ db }), "عمومی پس از پنهان‌سازی").length,
      2,
    );
    assert.equal(unwrap(await listGalleryCasesByStatus({ db }, "draft"), "پیش‌نویس‌ها").length, 1);

    expectErrorCode(
      await updateGalleryCase({ db }, target.id, { isPublished: "yes" }),
      "invalid_published",
      "وضعیت انتشار نامعتبر",
    );
    expectErrorCode(
      await updateGalleryCase(
        { db },
        target.id,
        { beforeImageUrl: "http://x.example/b.jpg" },
      ),
      "invalid_image",
      "تصویر ناامن در وصله",
    );
    // وصلهٔ خالی: بدون تغییر و بدون خطا
    unwrap(await updateGalleryCase({ db }, target.id, {}), "وصلهٔ خالی");
  });

  test("حذف نمونه و تکرار حذف → not_found؛ حذف از نمایش عمومی", async () => {
    const publicRows = unwrap(
      await listPublishedGalleryCases({ db }),
      "فهرست عمومی پیش از حذف",
    );
    const oldest = publicRows[publicRows.length - 1];

    const deleted = unwrap(await deleteGalleryCase({ db }, oldest.id), "حذف نمونه");
    assert.deepEqual(deleted, { id: oldest.id });
    expectErrorCode(await deleteGalleryCase({ db }, oldest.id), "not_found", "حذف مجدد");
    assert.equal(
      unwrap(await listPublishedGalleryCases({ db }), "فهرست پس از حذف").length,
      1,
    );
  });

  test("CHECK نمونه‌کارها: خدمت نامعتبر در سطح پایگاه‌داده رد می‌شود", async () => {
    await assert.rejects(
      () =>
        pglite
          .insert(galleryCases)
          .values({
            title: "نمونهٔ مستقیم",
            treatmentType: "nope",
            beforeImageUrl: "/before-after/b.jpg",
            afterImageUrl: "/before-after/a.jpg",
          }),
      (error: unknown) => inspect(error).includes("treatment_valid"),
    );
  });

  /* ── اجرا ── */

  let passed = 0;
  const failed: Array<{ name: string; message: string }> = [];
  for (const entry of tests) {
    try {
      await entry.run();
      passed += 1;
      console.log(`✔ ${entry.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed.push({ name: entry.name, message });
      console.error(`✘ ${entry.name}`);
      console.error(`   ${message}`);
    }
  }

  console.log("");
  console.log(`مجموع: ${passed + failed.length} | موفق: ${passed} | ناموفق: ${failed.length}`);
  if (failed.length !== 0) {
    const summary = failed
      .map((entry) => `- ${entry.name}: ${entry.message}`)
      .join("\n");
    console.error(`تست‌های ناموفق:\n${summary}`);
    process.exit(1);
  }
}

void main();
