import { Suspense } from "react";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { PageHeader } from "@/components/page-header";
import { Container } from "@/components/container";
import { BOOKING, toPersianDigits } from "@/lib/site-config";

export const metadata = {
  title: "رزرو نوبت آنلاین",
  description:
    "رزرو نوبت معاینه (۱۰ دقیقه‌ای) به‌صورت آنلاین در شعبه دلخواه — هدیه یوسف (بلوار امت) یا وطندار (اوینی)؛ انتخاب روز و ساعت خالی، در چند مرحلهٔ کوتاه.",
  alternates: { canonical: "/booking" },
};

export default function BookingPage() {
  return (
    <>
      <PageHeader
        eyebrow="نوبت‌دهی آنلاین"
        title="رزرو نوبت معاینه"
        description={`نوبت‌دهی اینترنتی صرفاً برای معاینه است و هر نوبت ${toPersianDigits(String(BOOKING.slotMinutes))} دقیقه زمان می‌برد. شعبه، روز و ساعت خالی را انتخاب کنید؛ افق رزرو آنلاین ${toPersianDigits(String(BOOKING.horizonDays))} روز آینده است و برای نوبت‌های فوری، تا ${toPersianDigits(String(BOOKING.leadMinutes))} دقیقه پیش از شروع نوبت باید رزرو کنید.`}
      />
      <section className="bg-canvas">
        <Container className="py-10 sm:py-12 lg:py-16">
          {/* چون ?branch= در مؤلفهٔ خوانندهٔ پارامترها خوانده می‌شود، مرز Suspense الزامی است */}
          <Suspense fallback={<WizardFallback />}>
            <BookingWizard />
          </Suspense>
        </Container>
      </section>
    </>
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
