import { HomeBackground } from "@/components/home-background";
import { HeroSection } from "@/components/hero-section";
import { ServicesSection } from "@/components/services-section";
import { QuickBookingSection } from "@/components/quick-booking-section";
import { AboutSection } from "@/components/about-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { BeautyBanner } from "@/components/beauty-banner";
import { ProductsBanner } from "@/components/products-banner";
import { BranchesSection } from "@/components/branches-section";
import { GallerySection } from "@/components/gallery-section";
import { ContactSection } from "@/components/contact-section";

export default function HomePage() {
  return (
    <>
      {/* لایهٔ تصویر با z-0؛ محتوا با relative z-10 روی آن می‌نشیند تا
          پس‌زمینهٔ body هرگز تصویر را نپوشاند. */}
      <HomeBackground />
      <div className="relative z-10">
        <HeroSection />
        <ServicesSection />
        <QuickBookingSection />
        <AboutSection />
        <TestimonialsSection />
        <BeautyBanner />
        <ProductsBanner />
        <BranchesSection />
        <GallerySection />
        <ContactSection />
      </div>
    </>
  );
}
