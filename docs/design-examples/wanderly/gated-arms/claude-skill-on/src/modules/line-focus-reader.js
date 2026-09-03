/* Line-by-line reading emphasis for the statement and the manifesto.

   Emphasis is carried by colour, not opacity: an inactive line is the secondary ink
   (4.9:1 on the paper surface), the active line is full ink. Lines stay lit once reached, so a
   reader who stops mid-section is never left with dimmed text. */

import { motionAllowed } from "./motion-preferences.js";

export function initLineFocus(scope = document) {
  const groups = Array.from(scope.querySelectorAll("[data-line-focus]"));
  if (!groups.length) return;

  const lines = groups.reduce(
    (all, group) => all.concat(Array.from(group.querySelectorAll(".statement__line"))),
    []
  );
  if (!lines.length) return;

  if (!motionAllowed() || !("IntersectionObserver" in window)) {
    lines.forEach((line) => line.classList.add("is-active"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-active");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "-42% 0px -34% 0px", threshold: 0 }
  );

  lines.forEach((line) => observer.observe(line));
}
