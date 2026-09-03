import { Destinations } from "@/components/sections/destinations";
import { Experiences } from "@/components/sections/experiences";
import { FeaturedJourney } from "@/components/sections/featured-journey";
import { FinalCta } from "@/components/sections/final-cta";
import { Hero } from "@/components/sections/hero";
import { IntroStatement } from "@/components/sections/intro-statement";
import { Journal } from "@/components/sections/journal";
import { JourneyChapters } from "@/components/sections/journey-chapters";
import { Manifesto } from "@/components/sections/manifesto";
import { Numbers } from "@/components/sections/numbers";
import { SomewhereNext } from "@/components/sections/somewhere-next";
import { Testimonials } from "@/components/sections/testimonials";

/**
 * The issue, in order.
 *
 * The rhythm is intentional rather than a list of blocks: full-bleed cover,
 * quiet type, a spread, the dark gatefold, the feature, the long read, a second
 * quiet page, the contents, the figures, a voice, then the fold-out and the
 * close. Two consecutive sections never share a composition, and the two dark
 * sections sit far enough apart to read as separate moments in the book.
 */
export default function Page() {
  return (
    <>
      <Hero />
      <IntroStatement />
      <Destinations />
      <Experiences />
      <FeaturedJourney />
      <JourneyChapters />
      <Manifesto />
      <Journal />
      <Numbers />
      <Testimonials />
      <SomewhereNext />
      <FinalCta />
    </>
  );
}
