import { BRANCHES } from "@/lib/site-config";
import { BranchCard } from "@/components/branch-card";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { Container } from "@/components/container";

/** بخش «شعبه‌ها» صفحه اصلی — معرفی دو شعبه با نشانی، تلفن و ساعات کاری */
export function BranchesSection() {
  return (
    <section
      id="branches"
      aria-labelledby="branches-heading"
      className="scroll-mt-20 bg-canvas"
    >
      <Container className="py-16 sm:py-20 lg:py-24">
        <SectionHeading
          id="branches-heading"
          eyebrow="شعبه‌ها"
          title="دو شعبه در خدمت شما"
          description="خدمات دندانپزشکی ما در دو شعبه در مشهد ارائه می‌شود؛ با شعبه موردنظرتان تماس بگیرید تا زمان مراجعه هماهنگ شود."
        />

        {/* پنج ردیف اشتراکی برای هر دو کارت: سربرگ، نشانی، تلفن، ساعات کاری
            و دکمه تماس. با subgrid، مرز هر ردیف در دو کارت یکسان است و ارتفاع
            هر ردیف برابر بلندترین محتوای آن ردیف بین دو کارت می‌شود؛ پس
            هم‌ترازی ردیف‌ها مستقل از میزان شکستن متن تضمین می‌شود.
            تعداد ردیف‌ها باید با ساختار BranchCard هماهنگ بماند. */}
        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:grid-rows-[repeat(5,auto)] sm:gap-x-5 sm:gap-y-0">
          {BRANCHES.map((branch, index) => (
            <Reveal
              key={branch.id}
              delay={index * 80}
              className="h-full sm:row-span-5 sm:grid sm:grid-rows-subgrid"
            >
              <BranchCard branch={branch} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
