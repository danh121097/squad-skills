import { motionPreferences } from "./motion-preferences.js";

function wrapWords(element) {
  const text = element.textContent.trim();
  if (!text) return;

  element.setAttribute("aria-label", text);
  element.textContent = "";

  text.split(/\s+/).forEach((word, index, words) => {
    const mask = document.createElement("span");
    const inner = document.createElement("span");
    mask.className = "reveal-mask reveal-mask--word";
    mask.style.setProperty("--reveal-delay", `${180 + index * 110}ms`);
    mask.setAttribute("aria-hidden", "true");
    inner.textContent = word;
    mask.append(inner);
    element.append(mask);
    if (index < words.length - 1) element.append(" ");
  });
}

export function initTextReveals() {
  const groups = [...document.querySelectorAll("[data-text-reveal]")];

  groups.forEach((group) => {
    if (group.dataset.revealMode === "words") wrapWords(group);
    group.querySelectorAll(".reveal-mask").forEach((mask, index) => {
      mask.style.setProperty("--reveal-delay", `${180 + index * 110}ms`);
    });
    if (motionPreferences.reduced) group.classList.add("is-visible");
  });

  if (motionPreferences.reduced || !groups.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.2 },
  );

  groups.forEach((group) => observer.observe(group));
}
