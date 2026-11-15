import { Check } from "lucide-react";
import type { Service } from "@/data/services";
import { ServiceIcon } from "./service-icon";

type ServiceCardProps = {
  service: Service;
  /** نمایش نکات کوتاه (در صفحه خدمات فعال می‌شود) */
  showPoints?: boolean;
};

/** کارت نمایش یک خدمت دندانپزشکی */
export function ServiceCard({ service, showPoints = false }: ServiceCardProps) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-line-strong bg-surface p-6 transition duration-300 hover:-translate-y-1.5 hover:border-primary-300 hover:shadow-2xl hover:shadow-primary-900/10 dark:hover:border-primary-700 dark:hover:shadow-black/30">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-bl from-tint to-sky-100/70 text-accent transition-colors duration-300 group-hover:from-primary-700 group-hover:to-blue-600 group-hover:text-white dark:from-primary-950/60 dark:to-sky-950/40 dark:group-hover:from-primary-600 dark:group-hover:to-accent-2">
        <ServiceIcon name={service.icon} />
      </div>
      <h3 className="mt-4 text-lg font-bold text-heading">{service.title}</h3>
      <p className="mt-2 text-sm leading-7 text-muted">
        {service.description}
      </p>
      {showPoints && service.points.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-dashed border-line-strong pt-4">
          {service.points.map((point) => (
            <li key={point} className="flex items-start gap-2">
              <Check
                className="mt-1 h-4 w-4 shrink-0 text-accent"
                aria-hidden="true"
              />
              <span className="text-sm leading-6 text-muted">{point}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
