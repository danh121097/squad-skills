import { motionPreferences } from "./motion-preferences.js";

export function initImageReveals() {
  const reveals = [...document.querySelectorAll("[data-image-reveal], [data-reveal]")];
  if (!reveals.length) return;

  if (motionPreferences.reduced) {
    reveals.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8%", threshold: 0.12 },
  );

  reveals.forEach((element) => observer.observe(element));
}
