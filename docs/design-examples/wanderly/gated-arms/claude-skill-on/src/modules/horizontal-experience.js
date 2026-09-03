/* Horizontal escape panels.

   Two paths from one markup:
   - wide viewport + motion allowed: the section is pinned and vertical scroll moves the track
     sideways, with a hairline progress rule;
   - everything else (touch, narrow, reduced motion): the track is a native horizontal scroller
     with snap points, reachable by swipe, by trackpad and by keyboard through its labelled group.

   The mode is re-evaluated on resize, and the pinned reader is unregistered when it is not in
   use, so nothing is left listening. */

import { registerScrollReader, refreshScroll } from "./scroll-driver.js";
import { motionAllowed, clamp, onResize } from "./motion-preferences.js";

export function initHorizontalExperience(scope = document) {
  const section = scope.querySelector("[data-escapes]");
  if (!section) return;

  const track = section.querySelector("[data-escapes-track]");
  if (!track) return;

  const wide = window.matchMedia("(min-width: 1024px)");
  let stopReader = null;
  let distance = 0;

  const update = ({ vh }) => {
    const total = section.offsetHeight - vh;
    if (total <= 0) return;
    const progress = clamp(-section.getBoundingClientRect().top / total, 0, 1);
    track.style.setProperty("--track-x", (-distance * progress).toFixed(1) + "px");
    section.style.setProperty("--escape-progress", progress.toFixed(4));
  };

  const teardownPinned = () => {
    if (stopReader) stopReader();
    stopReader = null;
    section.classList.remove("is-pinned-mode");
    section.style.removeProperty("--pin-height");
    section.style.removeProperty("--escape-progress");
    track.style.removeProperty("--track-x");
  };

  const layout = () => {
    if (!wide.matches || !motionAllowed()) {
      teardownPinned();
      return;
    }

    section.classList.add("is-pinned-mode");
    track.style.setProperty("--track-x", "0px");
    distance = Math.max(0, track.scrollWidth - window.innerWidth);
    section.style.setProperty("--pin-height", window.innerHeight + distance + "px");

    if (!stopReader) stopReader = registerScrollReader(update);
    refreshScroll();
  };

  layout();
  onResize(layout);
  if (typeof wide.addEventListener === "function") wide.addEventListener("change", layout);
  window.addEventListener("load", layout, { once: true });
}
