import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { SectionHeading } from "@/components/section-heading";
import { Container } from "@/components/container";
import { BOOKING, toPersianDigits } from "@/lib/site-config";
import { btnTextLink } from "@/lib/styles";

/**
 * بخش «رزرو سریع» صفحه اصلی — همان درگاه واقعی نوبت‌دهی (BookingWizard)
 * داخل یک کارت شیشه‌ای با هالهٔ گرادیان برند. مرز Suspense لازم است چون
 * درگاه پارامتر ?branch= را می‌خواند؛ همان الگوی صفحه /booking.
 */
export function QuickBookingSection() {
  return (
    <section
      aria-labelledby="quick-booking-heading"
      className="bg-surface-2"
    >
      <Container className="py-16 sm:py-20 lg:py-24">
        <SectionHeading
          id="quick-booking-heading"
          eyebrow="نوبت‌دهی آنلاین"
          title="همین‌جا نوبت معاینه رزرو کنید"
          description="شعبه، روز و ساعت خالی را انتخاب کنید و نوبت‌تان را در چند مرحلهٔ کوتاه ثبت کنید — بدون تماس تلفنی."
        />

        <div className="relative mx-auto mt-10 max-w-3xl sm:mt-12">
          {/* هالهٔ گرادیان برند پشت کارت */}
          <div
            aria-hidden="true"
            className="absolute -inset-4 rounded-[2.5rem] bg-linear-to-l from-primary-100/80 to-sky-100/80 blur-xl sm:-inset-6 dark:from-primary-900/40 dark:to-sky-900/30"
          />
          <div className="relative rounded-3xl border border-line-strong bg-surface p-4 shadow-soft sm:p-6">
            {/* چون ?branch= در مؤلفهٔ خوانندهٔ پارامترها خوانده می‌شود، مرز Suspense الزامی است */}
            <Suspense fallback={<WizardFallback />}>
              <BookingWizard />
            </Suspense>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-7 text-subtle">
          {`نوبت‌دهی آنلاین صرفاً برای معاینهٔ ${toPersianDigits(String(BOOKING.slotMinutes))} دقیقه‌ای است؛ افق رزرو ${toPersianDigits(String(BOOKING.horizonDays))} روز آینده و ثبت نوبت تا ${toPersianDigits(String(BOOKING.leadMinutes))} دقیقه پیش از ساعت خالی.`}
        </p>
        <div className="mt-4 text-center">
          <Link href="/booking" className={btnTextLink}>
            نمای کامل نوبت‌دهی
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </section>
  );
}

/** اسکلت زمان بارگذاری درگاه نوبت‌دهی */
function WizardFallback() {
  return (
    <div
      aria-hidden="true"
      className="h-72 animate-pulse rounded-2xl border border-line bg-surface"
    />
  );
}
