import { CustomCursor } from "@/components/motion/custom-cursor";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { DestinationsSection } from "@/components/sections/destinations-section";
import { FeaturedJourneySection } from "@/components/sections/featured-journey-section";
import { FinalCtaSection } from "@/components/sections/final-cta-section";
import { HeroSection } from "@/components/sections/hero-section";
import { HorizontalExperienceSection } from "@/components/sections/horizontal-experience-section";
import { IntroStatementSection } from "@/components/sections/intro-statement-section";
import { ManifestoSection } from "@/components/sections/manifesto-section";
import { NumbersSection } from "@/components/sections/numbers-section";
import { SiteFooter } from "@/components/sections/site-footer";
import { SiteHeader } from "@/components/sections/site-header";
import { SomewhereNextSection } from "@/components/sections/somewhere-next-section";
import { StickyJourneyStorySection } from "@/components/sections/sticky-journey-story-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { TravelJournalSection } from "@/components/sections/travel-journal-section";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <CustomCursor />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-5 focus:top-5 focus:z-[130] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-[13px] focus:text-canvas"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main">
        <HeroSection />
        <IntroStatementSection />
        <DestinationsSection />
        <HorizontalExperienceSection />
        <FeaturedJourneySection />
        <StickyJourneyStorySection />
        <ManifestoSection />
        <TravelJournalSection />
        <NumbersSection />
        <TestimonialsSection />
        <SomewhereNextSection />
        <FinalCtaSection />
      </main>

      <SiteFooter />
    </>
  );
}
