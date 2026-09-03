/* Counting numerals.

   The final value is authored in the markup, so it is correct before, during and after the
   count, and correct with no script at all. The count is a short, non-repeating flourish that
   runs once when the figure is first seen, and is skipped entirely under reduced motion. */

import { motionAllowed } from "./motion-preferences.js";

const DURATION = 1500;

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function countTo(node) {
  const target = Number(node.dataset.countTo);
  if (!Number.isFinite(target)) return;

  const decimals = Number(node.dataset.countDecimals) || 0;
  const suffix = node.dataset.countSuffix || "";
  const start = performance.now();

  const step = (now) => {
    const progress = Math.min((now - start) / DURATION, 1);
    node.textContent = (target * easeOutCubic(progress)).toFixed(decimals) + suffix;
    if (progress < 1) window.requestAnimationFrame(step);
  };

  window.requestAnimationFrame(step);
}

export function initCountUp(scope = document) {
  const nodes = Array.from(scope.querySelectorAll("[data-count-to]"));
  if (!nodes.length || !motionAllowed() || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        countTo(entry.target);
      });
    },
    { threshold: 0.6 }
  );

  nodes.forEach((node) => observer.observe(node));
}
