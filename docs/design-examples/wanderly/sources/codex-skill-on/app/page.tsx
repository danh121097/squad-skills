import { CustomCursor } from "@/components/motion/custom-cursor";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { DestinationStorytelling } from "@/components/sections/destination-storytelling";
import { DestinationTransition } from "@/components/sections/destination-transition";
import { FeaturedJourney } from "@/components/sections/featured-journey";
import { FinalCta } from "@/components/sections/final-cta";
import { Footer } from "@/components/sections/footer";
import { Hero } from "@/components/sections/hero";
import { HorizontalExperiences } from "@/components/sections/horizontal-experiences";
import { IntroStatement } from "@/components/sections/intro-statement";
import { JourneyStory } from "@/components/sections/journey-story";
import { Manifesto } from "@/components/sections/manifesto";
import { Navigation } from "@/components/sections/navigation";
import { Numbers } from "@/components/sections/numbers";
import { Testimonials } from "@/components/sections/testimonials";
import { TravelJournal } from "@/components/sections/travel-journal";

export default function Home() {
  return (
    <SmoothScroll>
      <CustomCursor />
      <Navigation />
      <main>
        <Hero />
        <IntroStatement />
        <DestinationStorytelling />
        <HorizontalExperiences />
        <FeaturedJourney />
        <JourneyStory />
        <Manifesto />
        <TravelJournal />
        <Numbers />
        <Testimonials />
        <DestinationTransition />
        <FinalCta />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
