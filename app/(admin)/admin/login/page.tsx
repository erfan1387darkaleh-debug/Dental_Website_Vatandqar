import { LoginForm } from "@/components/admin/login-form";

export const metadata = {
  title: "ورود پنل پذیرش",
  robots: { index: false, follow: false },
};

/** صفحهٔ ورود پنل پذیرش — بدون نمای عمومی سایت */
export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-16 sm:py-24">
      <div className="rounded-2xl border border-line-strong bg-surface p-6 shadow-sm shadow-slate-900/5 sm:p-8">
        <h1 className="text-xl font-extrabold text-heading">ورود به پنل پذیرش</h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          این صفحه مخصوص کارکنان پذیرش است؛ برای مشاهده، ثبت و حذف نوبت‌ها
          وارد شوید.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
