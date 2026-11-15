type SectionHeadingProps = {
  /** شناسه برای اتصال aria-labelledby بخش به عنوان */
  id: string;
  /** برچسب کوچک بالای عنوان (مثل «خدمات») */
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "start";
};

/** عنوان استاندارد بخش‌ها — برچسب کوچک، تیتر و توضیح کوتاه */
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeadingProps) {
  const isCenter = align === "center";
  return (
    <div className={isCenter ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow ? (
        <p className={isCenter ? "flex justify-center" : "flex"}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-100 bg-tint px-3.5 py-1 text-xs font-bold text-primary-800 shadow-sm dark:border-primary-900 dark:text-primary-200">
            {eyebrow}
          </span>
        </p>
      ) : null}
      <h2
        id={id}
        className="mt-2 text-2xl font-extrabold text-heading sm:text-3xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-8 text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
