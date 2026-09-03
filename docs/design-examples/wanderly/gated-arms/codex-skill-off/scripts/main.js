import { initializeNavigation } from "./navigation-controls.js";
import { initializeRevealEffects } from "./reveal-effects.js";
import { initializeScrollScenes } from "./scroll-scenes.js";
import { initializeStoryChapters } from "./sticky-story.js";
import { initializeQuoteCarousel } from "./quote-carousel.js";
import { initializeNumberCounters } from "./number-counters.js";
import { initializeMagneticButtons } from "./magnetic-buttons.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.documentElement.classList.add("js");

if (!reducedMotion.matches) {
  document.documentElement.classList.add("motion-ready");
}

initializeNavigation();
initializeRevealEffects({ reducedMotion });
initializeStoryChapters({ reducedMotion });
initializeQuoteCarousel({ reducedMotion });
initializeNumberCounters({ reducedMotion });

if (!reducedMotion.matches) {
  initializeScrollScenes();
  initializeMagneticButtons();
}

reducedMotion.addEventListener("change", (event) => {
  if (event.matches) {
    document.documentElement.classList.remove("motion-ready");
  }
});
