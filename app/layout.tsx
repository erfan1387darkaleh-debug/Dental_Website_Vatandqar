import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE, SITE_URL } from "@/lib/site-config";

/*
 * فونت فارسی «وزیرمتن» (self-hosted) — فایل در app/fonts قرار دارد و
 * در زمان ساخت بهینه و همراه سایت میزبانی می‌شود؛ هیچ درخواست خارجی
 * در زمان بازدید کاربر انجام نمی‌شود.
 */
const vazirmatn = localFont({
  src: "./fonts/Vazirmatn-Variable.woff2",
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} | دو شعبه در مشهد`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "دندانپزشکی",
    "دندانپزشکی مشهد",
    "خدمات دندانپزشکی مشهد",
    "بازرگانی وطندار",
    "دندانپزشکی هدیه یوسف",
    "دندانپزشکی وطندار",
    "سلامت دهان و دندان",
    "جرم‌گیری",
    "درمان ریشه",
    "دندانپزشکی زیبایی",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: SITE_URL,
    siteName: SITE.name,
    title: `${SITE.name} | مراقبت از سلامت و زیبایی لبخند شما`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | مراقبت از سلامت و زیبایی لبخند شما`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b131f" },
  ],
};

/*
 * اسکریپت هم‌زمان با اولین رندر (pre-paint) — حالت ذخیره‌شده کاربر را
 * از localStorage می‌خواند و اگر انتخاب صریحی نباشد، از علاقه سیستم
 * (prefers-color-scheme) پیروی می‌کند؛ سپس کلاس dark را روی <html>
 * تنظیم می‌کند. اجرای آن پیش از رنگ‌آمیزی اول است و «فلش تم» ندارد.
 */
const themeScript =
  "(function(){try{var s=localStorage.getItem(\"theme\");if(s!==\"light\"&&s!==\"dark\"){s=window.matchMedia(\"(prefers-color-scheme: dark)\").matches?\"dark\":\"light\"}document.documentElement.classList.toggle(\"dark\",s===\"dark\")}catch(e){}})();";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${vazirmatn.variable} antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas font-sans text-body">
        {/*
          * تنظیم تم پیش از رنگ‌آمیزی اول؛ suppressHydrationWarning روی
          * <html> تفاوت احتمالی کلاس dark بین سرور و کلاینت را بی‌اثر می‌کند.
          */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
