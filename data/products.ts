/**
 * فهرست دسته‌های محصولات وطندار.
 *
 * برای افزودن یا ویرایش دسته‌ها فقط این فایل را تغییر دهید؛
 * کارت‌های صفحه «محصولات» به‌صورت خودکار به‌روز می‌شوند.
 *
 * نکته‌ها:
 *  - `icon` باید یکی از کلیدهای موجود در components/product-icon.tsx باشد.
 *  - `price` هنوز null است و به‌جای آن «استعلام در تلگرام» نمایش داده می‌شود؛
 *    پس از تعیین قیمت‌ها همین‌جا را پر کنید (مثلاً "۲۹۵٬۰۰۰ تومان").
 */

export type ProductIconName = "oral" | "skin" | "misc";

export interface ProductCategory {
  /** شناسه یکتا (برای کلیدهای رندر) */
  id: string;
  title: string;
  description: string;
  /** قیمت نمایشی — null یعنی استعلام قیمت */
  price: string | null;
  icon: ProductIconName;
}

export const productCategories: ProductCategory[] = [
  {
    id: "oral-care",
    title: "مراقبت از دهان و دندان",
    description:
      "خمیردندان، دهان‌شویه، مسواک و سایر اقلام مراقبت روزانهٔ دهان و دندان؛ منتخب و هم‌راستا با توصیه‌های درمانی مجموعه.",
    price: null,
    icon: "oral",
  },
  {
    id: "skin-care",
    title: "مراقبت و زیبایی پوست",
    description:
      "محصولات مراقبت و زیبایی پوست، در ادامهٔ خدمات زیبایی وطندار؛ مناسب برای تکمیل مراقبت پس از مشاوره.",
    price: null,
    icon: "skin",
  },
  {
    id: "more",
    title: "سایر محصولات وطندار",
    description:
      "سایر کالاهای اصل و منتخب وطندار؛ فهرست کامل محصولات و موجودی روز را در تلگرام دریافت کنید.",
    price: null,
    icon: "misc",
  },
];
