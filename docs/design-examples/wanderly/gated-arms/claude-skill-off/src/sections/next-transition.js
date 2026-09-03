/**
 * Somewhere next
 *
 * The plate arrives at 0.88 with a 40px radius and grows into the full frame
 * of the screen as it is scrolled through — the page's last big gesture before
 * the closing call. Transform and border-radius only.
 */

import { addScrollTask, styleWriter } from '../lib/scroll-driver.js';
import { clamp, pinProgress } from '../lib/motion-preference.js';

const GROWTH_RANGE = 0.62;

export function initNextTransition({ motion, root = document }) {
  const section = root.querySelector('[data-next]');
  if (!section) return;

  const frame = section.querySelector('[data-next-frame]');
  if (!frame) return;

  if (!motion) {
    frame.style.setProperty('--next-scale', '1');
    frame.style.setProperty('--next-radius', '0px');
    return;
  }

  const write = styleWriter(frame);

  addScrollTask((scrollY, viewportHeight) => {
    const rect = section.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > viewportHeight) return;

    const progress = clamp(pinProgress(section, viewportHeight) / GROWTH_RANGE, 0, 1);
    write('--next-scale', (0.88 + 0.12 * progress).toFixed(4));
    write('--next-radius', `${(40 - 40 * progress).toFixed(1)}px`);
  });
}
