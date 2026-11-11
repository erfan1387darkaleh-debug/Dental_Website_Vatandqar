import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ReceptionDashboard } from "@/components/admin/reception-dashboard";
import { TestimonialsPanel } from "@/components/admin/testimonials-panel";
import { GalleryPanel } from "@/components/admin/gallery-panel";
import {
  SESSION_COOKIE_NAME,
  verifyCurrentSessionToken,
} from "@/lib/booking/auth";

export const metadata = {
  title: "پنل پذیرش",
  robots: { index: false, follow: false },
};

/**
 * داشبورد پنل پذیرش.
 * این صفحه دادهٔ زمان-محور نشست را می‌خواند؛ بخش پویا داخل Suspense است
 * (قاعدهٔ cacheComponents) و صرفِ نمایش داشبورد به دیدن کاربر تکیه
 * نمی‌کند: هر مسیر API پذیرش نیز سمت سرور نشست را خودش سنجش می‌کند.
 */
export default function AdminPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <AdminGate />
    </Suspense>
  );
}

async function AdminGate() {
  // «connection» پیش‌رندر پوستهٔ استاتیک را همین‌جا متوقف می‌کند؛ بدون آن،
  // گذر پیش‌رندر به خواندن Date.now() در صحت‌سنجی نشست می‌رسد و خطای
  // blocking-prerender-current-time در لاگ ثبت می‌شود. کل اجزای پویا داخل
  // مرز Suspense بالای همین فایل است و صرفِ نمایش داشبورد به دیدن کاربر
  // تکیه نمی‌کند: هر مسیر API پذیرش نیز سمت سرور نشست را خودش سنجش می‌کند.
  await connection();
  const cookieStore = await cookies();
  const admin = verifyCurrentSessionToken(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
  );
  if (!admin) {
    redirect("/admin/login");
  }
  return (
    <>
      <ReceptionDashboard username={admin.username} />
      <TestimonialsPanel />
      <GalleryPanel />
    </>
  );
}

function DashboardFallback() {
  return (
    <div
      aria-hidden="true"
      className="h-96 animate-pulse rounded-2xl border border-line bg-surface"
    />
  );
}
