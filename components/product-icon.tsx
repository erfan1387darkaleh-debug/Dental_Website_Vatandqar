import {
  Droplets,
  Package,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { ProductIconName } from "@/data/products";

/**
 * نگاشت نام آیکون هر دسته محصول (در data/products.ts) به آیکون Lucide.
 * برای افزودن دسته جدید با آیکون تازه، این جدول را هم به‌روز کنید.
 */
const PRODUCT_ICONS: Record<ProductIconName, LucideIcon> = {
  oral: Droplets,
  skin: Sparkles,
  misc: Package,
};

type ProductIconProps = {
  name: ProductIconName;
  className?: string;
};

export function ProductIcon({
  name,
  className = "h-6 w-6",
}: ProductIconProps) {
  const Icon = PRODUCT_ICONS[name];
  return <Icon className={className} aria-hidden="true" />;
}
