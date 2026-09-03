/* Parallax for photography.

   The image inside a `[data-parallax]` frame is already scaled slightly larger than its frame in
   CSS, so the drift never exposes an edge. Only a custom property changes here; the transform
   itself stays in the stylesheet. Off for reduced motion and off for coarse pointers, where the
   effect costs more than it gives. */

import { registerScrollReader } from "./scroll-driver.js";
import { motionAllowed, clamp } from "./motion-preferences.js";

const DEFAULT_RANGE = 34;

export function initParallax(scope = document) {
  const frames = Array.from(scope.querySelectorAll("[data-parallax]"));
  if (!frames.length) return;

  const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  if (!motionAllowed() || coarse) return;

  registerScrollReader(({ vh }) => {
    frames.forEach((frame) => {
      const rect = frame.getBoundingClientRect();
      if (rect.bottom < -240 || rect.top > vh + 240) return;

      const range = Number(frame.dataset.parallaxRange) || DEFAULT_RANGE;
      const centreOffset = rect.top + rect.height / 2 - vh / 2;
      const progress = clamp(centreOffset / vh, -1, 1);
      frame.style.setProperty("--parallax-y", (progress * -range).toFixed(2) + "px");
    });
  });
}
