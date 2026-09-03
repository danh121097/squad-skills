/* Motion + input capability. Everything expressive asks here first.
   Capability, never device name: we test reduced-motion, hover and pointer precision. */

const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

export function prefersReducedMotion() {
  return reduceQuery.matches;
}

export function motionAllowed() {
  return !reduceQuery.matches;
}

export function pointerIsFine() {
  return finePointerQuery.matches;
}

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

/** Run `handler` whenever the motion preference changes, so a mid-session switch is honoured. */
export function onMotionPreferenceChange(handler) {
  if (typeof reduceQuery.addEventListener === "function") {
    reduceQuery.addEventListener("change", handler);
  } else if (typeof reduceQuery.addListener === "function") {
    reduceQuery.addListener(handler);
  }
}

/** Debounced resize hook shared by the layout-sensitive behaviours. */
export function onResize(handler, wait = 180) {
  let timer = 0;
  window.addEventListener(
    "resize",
    () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(handler, wait);
    },
    { passive: true }
  );
}
