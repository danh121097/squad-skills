/* Hero choreography.

   On load: the photograph settles from 1.08 to 1 while the label, headline words, supporting
   line and call to action arrive in sequence over about 1.2s (delays live in CSS).
   On scroll: the full-bleed plate becomes an editorial block — scale 1 → 0.92 with a radius
   growing to 32px, which also opens the horizontal margins. Transform and radius only. */

import { registerScrollReader } from "./scroll-driver.js";
import { motionAllowed, clamp } from "./motion-preferences.js";

const SHRINK_TO = 0.92;
const RADIUS_TO = 32;

export function initHero() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const media = hero.querySelector("[data-hero-media]");
  const title = hero.querySelector("[data-reveal-text]");

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      hero.classList.add("is-ready");
      if (title) title.classList.add("is-inview");
    });
  });

  if (!media || !motionAllowed()) return;

  registerScrollReader(({ scrollY, vh }) => {
    const progress = clamp(scrollY / Math.max(vh * 0.9, 1), 0, 1);
    media.style.setProperty("--hero-scale", (1 - (1 - SHRINK_TO) * progress).toFixed(4));
    media.style.setProperty("--hero-radius", (RADIUS_TO * progress).toFixed(1) + "px");
  });
}
