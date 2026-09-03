/* Fullscreen destination transition.

   While the pinned frame is held, the plate grows from an inset block (scale 0.88, 40px radius)
   to full bleed. Scale and radius only; the layout never moves. With reduced motion the plate is
   simply full bleed from the start. */

import { registerScrollReader } from "./scroll-driver.js";
import { motionAllowed, clamp } from "./motion-preferences.js";

const START_SCALE = 0.88;
const START_RADIUS = 40;

export function initFullscreenTransition(scope = document) {
  const section = scope.querySelector("[data-next]");
  if (!section) return;

  const media = section.querySelector("[data-next-media]");
  if (!media || !motionAllowed()) return;

  registerScrollReader(({ vh }) => {
    const total = section.offsetHeight - vh;
    if (total <= 0) return;

    const raw = -section.getBoundingClientRect().top / total;
    const progress = clamp(raw / 0.7, 0, 1);
    media.style.setProperty("--next-scale", (START_SCALE + (1 - START_SCALE) * progress).toFixed(4));
    media.style.setProperty("--next-radius", (START_RADIUS * (1 - progress)).toFixed(1) + "px");
  });
}
