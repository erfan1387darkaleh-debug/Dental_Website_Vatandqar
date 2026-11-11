import Link from "next/link";
import { Phone } from "lucide-react";
import { BRANCHES } from "@/lib/site-config";
import { Container } from "./container";

/** نوار فراخوان پایانی صفحات داخلی — تماس با شعبه موردنظر */
export function CtaBanner() {
  return (
    <Container className="pb-16 sm:pb-20 lg:pb-24">
      <div className="rounded-3xl bg-primary-700 px-6 py-10 text-center sm:px-12 sm:py-12 dark:bg-primary-900 dark:ring-1 dark:ring-white/10">
        <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
          آماده مراقبت از لبخند شما هستیم
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-8 text-primary-50">
          برای هماهنگی نوبت یا مشاوره اولیه، با شعبه موردنظرتان تماس بگیرید؛
          پاسخ پرسش‌هایتان را با خوش‌وقتی می‌شنوید.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {BRANCHES.map((branch) => (
            <a
              key={branch.id}
              href={branch.telHref}
              aria-label={`تماس با ${branch.descriptor}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-primary-900 shadow-sm transition-colors duration-200 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Phone className="h-4.5 w-4.5" aria-hidden="true" />
              {`تماس با شعبه ${branch.name}`}
            </a>
          ))}
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            مشاهده همه راه‌های ارتباطی
          </Link>
        </div>
      </div>
    </Container>
  );
}
