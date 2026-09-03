/* Wanderly — presentational behaviour only.

   Nothing here fetches, stores, routes or measures a user. Each module owns one presentational
   behaviour, its own timing and its own teardown, and every one of them degrades to the fully
   composed page when motion is not welcome or script never runs. */

/* Styles are linked from index.html so the page renders fully without this bundle. */

import { prepareTextReveals } from "./modules/reveal-text-mask.js";
import { observeReveals } from "./modules/reveal-on-scroll.js";
import { initParallax } from "./modules/parallax-media.js";
import { initMagnetic } from "./modules/magnetic-pointer.js";
import { initPointerRing } from "./modules/pointer-ring-cursor.js";
import { initNavigation } from "./modules/site-navigation-behavior.js";
import { initHero } from "./modules/hero-cinematic-motion.js";
import { initLineFocus } from "./modules/line-focus-reader.js";
import { initDestinationShowcase } from "./modules/destination-showcase.js";
import { initHorizontalExperience } from "./modules/horizontal-experience.js";
import { initJourneyChapters } from "./modules/journey-chapters.js";
import { initCountUp } from "./modules/count-up-numbers.js";
import { initQuoteCarousel } from "./modules/quote-carousel.js";
import { initFullscreenTransition } from "./modules/fullscreen-media-transition.js";

function start() {
  // typography must be split before anything observes it
  prepareTextReveals();

  initNavigation();
  initHero();
  observeReveals();
  initLineFocus();
  initDestinationShowcase();
  initHorizontalExperience();
  initJourneyChapters();
  initCountUp();
  initQuoteCarousel();
  initFullscreenTransition();

  initParallax();
  initMagnetic();
  initPointerRing();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
