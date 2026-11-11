import { HeroSection } from "@/components/hero-section";
import { ServicesSection } from "@/components/services-section";
import { AboutSection } from "@/components/about-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { BranchesSection } from "@/components/branches-section";
import { GallerySection } from "@/components/gallery-section";
import { ContactSection } from "@/components/contact-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <AboutSection />
      <TestimonialsSection />
      <BranchesSection />
      <GallerySection />
      <ContactSection />
    </>
  );
}
