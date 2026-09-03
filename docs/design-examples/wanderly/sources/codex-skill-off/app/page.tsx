import { CustomCursor } from "@/components/motion/custom-cursor";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { Navigation } from "@/components/navigation";
import { DestinationStorytelling } from "@/components/sections/destination-storytelling";
import { ExperienceHorizontal } from "@/components/sections/experience-horizontal";
import { FeaturedJourney } from "@/components/sections/featured-journey";
import { FinalCta } from "@/components/sections/final-cta";
import { Footer } from "@/components/sections/footer";
import { Hero } from "@/components/sections/hero";
import { IntroStatement } from "@/components/sections/intro-statement";
import { JourneyStory } from "@/components/sections/journey-story";
import { Manifesto } from "@/components/sections/manifesto";
import { Numbers } from "@/components/sections/numbers";
import { SomewhereNext } from "@/components/sections/somewhere-next";
import { Testimonials } from "@/components/sections/testimonials";
import { TravelJournal } from "@/components/sections/travel-journal";

export default function Home() {
  return (
    <SmoothScroll>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <CustomCursor />
      <Navigation />
      <main id="main-content">
        <Hero />
        <IntroStatement />
        <DestinationStorytelling />
        <ExperienceHorizontal />
        <FeaturedJourney />
        <JourneyStory />
        <Manifesto />
        <TravelJournal />
        <Numbers />
        <Testimonials />
        <SomewhereNext />
        <FinalCta />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
