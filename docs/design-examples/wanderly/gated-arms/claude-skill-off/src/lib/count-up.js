/**
 * Count up
 *
 * Numerals are authored at their final value in the markup, so the section is
 * correct with no JS and under reduced motion. When motion is allowed the
 * value is wound back and eased forward once, then the loop ends.
 */

import { whenInView } from './viewport-observer.js';

const DURATION = 1600;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function format(value, decimals) {
  return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
}

function run(element) {
  const target = parseFloat(element.dataset.count || '0');
  const decimals = parseInt(element.dataset.countDecimals || '0', 10);
  const suffix = element.dataset.countSuffix || '';
  const start = performance.now();

  element.textContent = format(0, decimals) + suffix;

  const step = (now) => {
    const progress = Math.min(1, (now - start) / DURATION);
    element.textContent = format(target * easeOut(progress), decimals) + suffix;
    if (progress < 1) window.requestAnimationFrame(step);
  };

  window.requestAnimationFrame(step);
}

export function initCountUp({ motion, root = document } = {}) {
  const numerals = root.querySelectorAll('[data-count]');
  if (!motion) return;
  numerals.forEach((element) => {
    whenInView(element, run, { threshold: 0.6, rootMargin: '0px' });
  });
}
