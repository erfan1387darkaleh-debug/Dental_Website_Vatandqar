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
    </>
  );
}
