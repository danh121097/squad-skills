/**
 * Hero
 *
 * Arrival: the photograph settles from 1.08 to 1 while the headline lines,
 * the supporting copy and finally the call to action rise into place. The
 * stagger is authored in CSS delays; this only starts the sequence.
 *
 * Departure: the full-bleed frame shrinks to 0.92 and gathers a 32px radius,
 * so it reads as an editorial plate by the time the next section arrives.
 */

import { addScrollTask, styleWriter } from '../lib/scroll-driver.js';
import { clamp } from '../lib/motion-preference.js';

export function initHero({ motion }) {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  hero.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-in'));

  if (!motion) {
    hero.classList.add('is-loaded');
    return;
  }

  window.requestAnimationFrame(() => hero.classList.add('is-loaded'));

  const stage = hero.querySelector('[data-hero-stage]');
  if (!stage) return;
  const write = styleWriter(stage);

  addScrollTask((scrollY, viewportHeight) => {
    const progress = clamp(scrollY / Math.max(1, viewportHeight), 0, 1);
    write('--hero-scale', (1 - 0.08 * progress).toFixed(4));
    write('--hero-radius', `${(32 * progress).toFixed(1)}px`);
  });
}
