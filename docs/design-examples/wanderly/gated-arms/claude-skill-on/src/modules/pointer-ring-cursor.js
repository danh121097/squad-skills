/* Pointer ring.

   A thin circle that trails the pointer, opens to VIEW over a photographic link and tightens
   over a control. Deliberately an addition, not a replacement: the system cursor stays visible,
   so precision, accessibility settings and text selection are untouched. Desktop pointers only,
   never under reduced motion, and the frame loop only runs while the pointer is actually moving. */

import { motionAllowed, pointerIsFine } from "./motion-preferences.js";

const DARK_CONTEXTS = ".on-night, .hero, .next, .escapes";

export function initPointerRing() {
  if (!motionAllowed() || !pointerIsFine()) return () => {};

  const ring = document.createElement("div");
  ring.className = "pointer-ring";
  ring.setAttribute("aria-hidden", "true");
  document.body.appendChild(ring);

  let frame = 0;
  let x = -100;
  let y = -100;

  const draw = () => {
    frame = 0;
    ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const onMove = (event) => {
    x = event.clientX;
    y = event.clientY;
    ring.classList.add("is-visible");
    if (!frame) frame = window.requestAnimationFrame(draw);
  };

  const onOver = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const control = target.closest("a, button");
    const overPhoto = !!(control && control.querySelector(".frame"));
    ring.classList.toggle("is-view", overPhoto);
    ring.classList.toggle("is-action", !!control && !overPhoto);
    ring.classList.toggle("is-dark", !target.closest(DARK_CONTEXTS));
  };

  const onLeave = () => ring.classList.remove("is-visible");

  document.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerover", onOver, { passive: true });
  document.addEventListener("pointerdown", onMove, { passive: true });
  window.addEventListener("blur", onLeave);
  document.addEventListener("mouseleave", onLeave);

  return () => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerdown", onMove);
    window.removeEventListener("blur", onLeave);
    document.removeEventListener("mouseleave", onLeave);
    if (frame) window.cancelAnimationFrame(frame);
    ring.remove();
  };
}
