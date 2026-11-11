/**
 * ────────────────────────────────────────────────────────────────
 *  سامانه پیامک نوبت‌ها (تأیید ثبت و یادآوری) — فقط سمت سرور
 * ────────────────────────────────────────────────────────────────
 *  ساختار: لایهٔ ارائه (قالب پیام فارسی با تاریخ جلالی) + لایهٔ
 *  ارسال (انتخاب سرویس‌دهنده از متغیر محیطی SMS_PROVIDER):
 *
 *    - تنظیم‌نشده   → سرویس «هیچ»: ارسال همیشه «شکست» با کد صریح.
 *      فلسفهٔ پروژه: هیچ رفتار جعلی پیش‌فرضی وجود ندارد (مانند db.ts)؛
 *      تا زمانی که سرویس‌دهنده واقعی تنظیم نشده، هیچ پیامکی «فرستاده‌شده»
 *      جلوه داده نمی‌شود.
 *    - «mock»        → فقط ثبت در گزارش سرور (توسعهٔ محلی/تست).
 *    - «kavenegar»   → سرویس واقعی کاوه‌نگار (REST) با کلید
 *      KAVENEGAR_API_KEY و خط ارسال اختیاری KAVENEGAR_SENDER.
 *
 *  قواعد امنیتی: کلید سرویس، متن پیام و شمارهٔ گیرنده هرگز در
 *  گزارش‌ها (لاگ) کامل نمی‌آیند؛ شماره‌ها همیشه پوشانده می‌شوند و
 *  خطاها فقط با کد (بدون محتوای پاسخ سرویس) ثبت می‌شوند.
 * ────────────────────────────────────────────────────────────────
 */
import {
  formatJalaliFull,
  formatTimeFa,
} from "./jalali";
import { normalizeIranMobile } from "./phone";
import { getBookingBranch } from "./slots";
import type { TehranDate, TimeOfDay } from "./time";

/** یک پیامک آمادهٔ ارسال — گیرنده در قالب نرمال 09xxxxxxxxx */
export type SmsMessage = { to: string; text: string };

/** نتیجهٔ ارسال — هرگز جزئیات خطای شبکه/سرویس در آن لو نمی‌رود */
export type SmsSendOutcome =
  | { ok: true; provider: string; messageId: string }
  | { ok: false; provider: string; reason: string };

/** امضای تابع ارسال هر سرویس‌دهنده */
export type SmsSender = (message: SmsMessage) => Promise<SmsSendOutcome>;

/* ─────────────────────────── پوشاندن شماره در گزارش‌ها ─────────────────────────── */

/** 09121234567 → 0912***4567 — برای گزارش‌های سرور (بدون افشای شمارهٔ کامل) */
export function maskPhone(phone: string): string {
  if (phone.length < 8) return "***";
  return `${phone.slice(0, 4)}***${phone.slice(-4)}`;
}

/* ─────────────────────────── سرویس‌دهنده‌ها ─────────────────────────── */

/** سرویس «هیچ» — وقتی SMS_PROVIDER تنظیم نشده؛ همه‌چیز صریحاً شکست می‌خورد */
function noneProvider(): { name: string; send: SmsSender } {
  return {
    name: "none",
    send: async () => ({
      ok: false,
      provider: "none",
      reason: "sms_provider_not_configured",
    }),
  };
}

/** سرویس آزمایشی — فقط گزارش سرور؛ هیچ تماس شبکه‌ای */
function mockProvider(): { name: string; send: SmsSender } {
  let counter = 0;
  return {
    name: "mock",
    send: async (message) => {
      counter += 1;
      console.log(
        `[sms][mock] پیامک آزمایشی به ${maskPhone(message.to)} ثبت شد: ${message.text}`,
      );
      return {
        ok: true,
        provider: "mock",
        messageId: `mock-${counter}`,
      };
    },
  };
}

/* ── کاوه‌نگار (REST) ── */

const KAVENEGAR_ENDPOINT = "https://api.kavenegar.com/v1";
const KAVENEGAR_TIMEOUT_MS = 10_000;

/**
 * خواندن وضعیت بازگشتی کاوه‌نگار از بدنهٔ JSON — ساختار:
 * { "return": { "status": 200, "entries": [{ "messageid": … }] } }
 */
function readKavenegarReturn(
  payload: unknown,
): { status: number | null; messageId: string | null } {
  if (payload === null || typeof payload !== "object") {
    return { status: null, messageId: null };
  }
  const returnSection = (payload as { return?: unknown }).return;
  if (returnSection === null || typeof returnSection !== "object") {
    return { status: null, messageId: null };
  }
  const status = (returnSection as { status?: unknown }).status;
  const entries = (returnSection as { entries?: unknown }).entries;
  let messageId: string | null = null;
  if (Array.isArray(entries) && entries.length > 0) {
    const first = entries[0];
    if (first !== null && typeof first === "object") {
      const id = (first as { messageid?: unknown }).messageid;
      if (typeof id === "number" || typeof id === "string") {
        messageId = String(id);
      }
    }
  }
  return {
    status: typeof status === "number" ? status : null,
    messageId,
  };
}

/** تبدیل پاسخ HTTP کاوه‌نگار به نتیجهٔ استاندارد — بدون افشای محتوای خطا */
export async function parseKavenegarResponse(
  response: Response,
): Promise<SmsSendOutcome> {
  if (!response.ok) {
    return {
      ok: false,
      provider: "kavenegar",
      reason: `http_${response.status}`,
    };
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, provider: "kavenegar", reason: "invalid_response" };
  }
  const { status, messageId } = readKavenegarReturn(payload);
  if (status === 200) {
    return { ok: true, provider: "kavenegar", messageId: messageId ?? "unknown" };
  }
  return {
    ok: false,
    provider: "kavenegar",
    reason: status === null ? "invalid_response" : `provider_status_${status}`,
  };
}

/** سرویس واقعی کاوه‌نگار — POST فرم‌-urlencoded با مهلت ۱۰ ثانیه */
function kavenegarProvider(
  apiKey: string,
  sender: string,
  fetchImpl: typeof fetch,
): { name: string; send: SmsSender } {
  return {
    name: "kavenegar",
    send: async (message) => {
      const url = `${KAVENEGAR_ENDPOINT}/${encodeURIComponent(apiKey)}/sms/send.json`;
      const body = new URLSearchParams({
        receptor: message.to,
        message: message.text,
      });
      if (sender !== "") body.set("sender", sender);
      try {
        const response = await fetchImpl(url, {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded;charset=utf-8",
          },
          body,
          signal: AbortSignal.timeout(KAVENEGAR_TIMEOUT_MS),
        });
        return await parseKavenegarResponse(response);
      } catch {
        return {
          ok: false,
          provider: "kavenegar",
          reason: "network_error",
        };
      }
    },
  };
}

/**
 * انتخاب سرویس‌دهنده از env — در هر فراخوانی خوانده می‌شود (آزمون‌پذیری).
 * نتیجهٔ نامعتبر (نام ناشناخته) هم «هیچ» است؛ یعنی شکست صریح، نه سکوت.
 */
export function resolveSmsProvider(fetchImpl: typeof fetch = fetch): {
  name: string;
  send: SmsSender;
} {
  const configured = (process.env.SMS_PROVIDER ?? "").trim().toLowerCase();
  if (configured === "mock") return mockProvider();
  if (configured === "kavenegar") {
    const apiKey = (process.env.KAVENEGAR_API_KEY ?? "").trim();
    if (apiKey === "") {
      return noneProvider();
    }
    const sender = (process.env.KAVENEGAR_SENDER ?? "").trim();
    return kavenegarProvider(apiKey, sender, fetchImpl);
  }
  return noneProvider();
}

/* ─────────────────────────── ارسال عمومی ─────────────────────────── */

/**
 * ارسال یک پیامک به شمارهٔ موبایل — نرمال‌سازی مجدد گیرنده (دفاع در
 * عمق؛ قید CHECK پایگاه‌داده هم روی همان قالب است) و سپس سرویس‌دهنده.
 */
export async function sendSms(
  to: string,
  text: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SmsSendOutcome> {
  const normalized = normalizeIranMobile(to);
  if (!normalized.ok) {
    return { ok: false, provider: "none", reason: "invalid_phone" };
  }
  const provider = resolveSmsProvider(fetchImpl);
  return provider.send({ to: normalized.phone, text });
}

/* ─────────────────────────── قالب پیام‌ها ─────────────────────────── */

/** مشخصات نوبت برای ساخت متن پیامک */
export type SmsAppointmentInfo = {
  branchId: string;
  /** تاریخ تقویمی تهران نوبت */
  date: TehranDate;
  /** ساعت شروع "HH:mm" */
  time: TimeOfDay;
};

/**
 * متن پیامک تأیید ثبت نوبت — تاریخ جلالی + شعبه + تلفن شعبه.
 * تاریخ صریح نوشته می‌شود (بدون «امروز/فردا») تا پنجرهٔ ارسال هر چه
 * باشد، متن پیام همیشه درست بماند.
 */
export function buildBookingConfirmationText(
  info: SmsAppointmentInfo & { patientName: string },
): string {
  const branch = getBookingBranch(info.branchId);
  const branchName = branch?.name ?? "";
  const branchPhone = branch?.displayPhone ?? "";
  const when = `${formatJalaliFull(info.date)}، ساعت ${formatTimeFa(info.time)}`;
  return `${info.patientName} عزیز، نوبت شما ثبت شد: ${when} — ${branchName}. برای تغییر یا لغو با ${branchPhone} تماس بگیرید.`;
}

/** متن پیامک یادآوری نوبت — بدون نام بیمار؛ کوتاه و با تلفن شعبه */
export function buildAppointmentReminderText(info: SmsAppointmentInfo): string {
  const branch = getBookingBranch(info.branchId);
  const branchName = branch?.name ?? "";
  const branchPhone = branch?.displayPhone ?? "";
  return `یادآوری نوبت: ${formatJalaliFull(info.date)}، ساعت ${formatTimeFa(info.time)} — ${branchName}. تماس: ${branchPhone}.`;
}

/* ─────────────────────────── ارسال‌های نوبت ─────────────────────────── */

/** ارسال پیامک تأیید ثبت برای یک نوبت (مسیر عمومی، پس از پاسخ ۲۰۱) */
export async function sendAppointmentConfirmationSms(
  appointment: SmsAppointmentInfo & { patientName: string; patientPhone: string },
): Promise<SmsSendOutcome> {
  return sendSms(
    appointment.patientPhone,
    buildBookingConfirmationText(appointment),
  );
}

/** ارسال پیامک یادآوری برای یک نوبت (مسیر زمان‌بندی‌شدهٔ کرون) */
export async function sendAppointmentReminderSms(
  appointment: SmsAppointmentInfo & { patientPhone: string },
): Promise<SmsSendOutcome> {
  return sendSms(
    appointment.patientPhone,
    buildAppointmentReminderText(appointment),
  );
}
