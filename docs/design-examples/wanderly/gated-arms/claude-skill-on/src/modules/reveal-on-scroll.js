/* Entrance reveals.

   Content safety comes first: the reveal only ever ADDS a class. The pre-animation state lives
   in CSS behind `html.motion`, so with no script, no IntersectionObserver, or reduced motion,
   every element is simply already composed.

   A settle net covers the case of a page that is loaded and never scrolled (an automated
   observer, a printed capture, an assistive reader jumping by heading): three seconds after
   load, if nobody has touched the page, everything still waiting is revealed. Any real
   interaction cancels the net and the scroll choreography plays as designed. */

import { motionAllowed } from "./motion-preferences.js";

const SELECTOR = "[data-reveal], [data-reveal-mask], [data-reveal-text], [data-clip-reveal]";
const SETTLE_DELAY = 3000;

const waiting = new Set();
let observer = null;
let netArmed = false;

function reveal(element) {
  element.classList.add("is-inview");
  waiting.delete(element);
}

/** Reveal everything still pending. Also the reduced-motion and no-observer path. */
export function revealAll() {
  Array.from(waiting).forEach(reveal);
  if (observer) observer.disconnect();
}

function onIntersect(entries) {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    reveal(entry.target);
    observer.unobserve(entry.target);
  });
}

function armSettleNet() {
  if (netArmed) return;
  netArmed = true;

  let timer = 0;
  const events = ["wheel", "touchstart", "keydown", "pointerdown", "scroll"];

  const cancel = () => {
    if (timer) window.clearTimeout(timer);
    timer = 0;
    events.forEach((type) => window.removeEventListener(type, cancel));
  };

  const start = () => {
    timer = window.setTimeout(() => {
      if ((window.scrollY || 0) < 4) revealAll();
    }, SETTLE_DELAY);
  };

  events.forEach((type) => window.addEventListener(type, cancel, { passive: true }));

  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}

export function observeReveals(scope = document) {
  const items = Array.from(scope.querySelectorAll(SELECTOR));
  if (!items.length) return;

  if (!motionAllowed() || !("IntersectionObserver" in window)) {
    items.forEach((element) => element.classList.add("is-inview"));
    return;
  }

  if (!observer) {
    observer = new IntersectionObserver(onIntersect, {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.06,
    });
  }

  items.forEach((element) => {
    if (element.classList.contains("is-inview")) return;
    waiting.add(element);
    observer.observe(element);
  });

  armSettleNet();
}
