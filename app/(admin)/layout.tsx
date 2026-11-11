import Link from "next/link";
import { ToothLogo } from "@/components/tooth-logo";
import { SITE } from "@/lib/site-config";

/*
 * چیدمان پنل پذیرش — بدون هدر/فوتر عمومی؛ لایهٔ ریشه فقط چارچوب و تم
 * را می‌دهد و این لایه بستگی‌های خود پنل را می‌سازد.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-1 flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-tint text-accent">
              <ToothLogo className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-extrabold text-heading">
                پنل پذیرش
              </span>
              <span className="text-xs text-subtle">{SITE.shortName}</span>
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-full border border-line-strong bg-canvas px-4 py-2 text-xs font-bold text-heading transition-colors duration-200 hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 dark:focus-visible:outline-primary-300"
          >
            بازگشت به سایت
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
