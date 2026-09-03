/* Magnetic controls.

   A button leans a few pixels toward the pointer and eases back on leave. It is an enhancement
   for precise pointers only: touch and reduced motion never see it, and because it is a
   transform on a control that is already reachable, nothing depends on it. */

import { motionAllowed, pointerIsFine, clamp } from "./motion-preferences.js";

const MAX_SHIFT = 8;

function attach(element) {
  const strength = clamp(Number(element.dataset.magnetic) || 5, 2, MAX_SHIFT);
  let frame = 0;
  let x = 0;
  let y = 0;

  const apply = () => {
    frame = 0;
    element.style.transform = x || y ? `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)` : "";
  };

  const schedule = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(apply);
  };

  const onMove = (event) => {
    const rect = element.getBoundingClientRect();
    const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2 || 1);
    const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2 || 1);
    x = clamp(dx, -1, 1) * strength;
    y = clamp(dy, -1, 1) * strength;
    schedule();
  };

  const release = () => {
    x = 0;
    y = 0;
    schedule();
  };

  element.addEventListener("pointermove", onMove);
  element.addEventListener("pointerleave", release);
  element.addEventListener("blur", release);

  return () => {
    element.removeEventListener("pointermove", onMove);
    element.removeEventListener("pointerleave", release);
    element.removeEventListener("blur", release);
    if (frame) window.cancelAnimationFrame(frame);
    element.style.transform = "";
  };
}

export function initMagnetic(scope = document) {
  const targets = Array.from(scope.querySelectorAll("[data-magnetic]"));
  if (!targets.length || !motionAllowed() || !pointerIsFine()) return () => {};

  const teardowns = targets.map(attach);
  return () => teardowns.forEach((stop) => stop());
}
