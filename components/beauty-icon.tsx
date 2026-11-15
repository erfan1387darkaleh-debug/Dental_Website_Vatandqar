import {
  Eraser,
  Flower2,
  PersonStanding,
  Syringe,
  type LucideIcon,
} from "lucide-react";
import type { BeautyIconName } from "@/data/beauty-services";

/**
 * نگاشت نام آیکون هر خدمت زیبایی (در data/beauty-services.ts) به آیکون Lucide.
 * برای افزودن خدمت جدید با آیکون تازه، این جدول را هم به‌روز کنید.
 */
const BEAUTY_ICONS: Record<BeautyIconName, LucideIcon> = {
  botox: Syringe,
  contouring: PersonStanding,
  mole: Eraser,
  skin: Flower2,
};

type BeautyIconProps = {
  name: BeautyIconName;
  className?: string;
};

export function BeautyIcon({
  name,
  className = "h-6 w-6",
}: BeautyIconProps) {
  const Icon = BEAUTY_ICONS[name];
  return <Icon className={className} aria-hidden="true" />;
}
