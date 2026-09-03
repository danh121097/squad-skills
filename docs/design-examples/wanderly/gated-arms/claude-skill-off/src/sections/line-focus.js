/**
 * Line focus
 *
 * Drives the two text-only movements. The line nearest the middle of the
 * viewport holds full ink; the others step back to the soft ink tone.
 *
 * Deliberately a colour change rather than an opacity fade: the stepped-back
 * lines still clear 4.5:1 on paper, so nothing on the page is ever rendered
 * unreadable in the name of an effect.
 */

import { addScrollTask } from '../lib/scroll-driver.js';

export function initLineFocus({ motion, root = document }) {
  if (!motion) return;

  const blocks = Array.from(root.querySelectorAll('[data-line-focus]'));
  if (!blocks.length) return;

  const groups = blocks.map((block) => ({
    block,
    lines: Array.from(block.querySelectorAll('.rl')),
    active: -1,
  }));

  addScrollTask((scrollY, viewportHeight) => {
    const middle = viewportHeight * 0.5;

    groups.forEach((group) => {
      const rect = group.block.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewportHeight) return;

      let nearest = 0;
      let smallest = Infinity;

      group.lines.forEach((line, index) => {
        const box = line.getBoundingClientRect();
        const distance = Math.abs(box.top + box.height / 2 - middle);
        if (distance < smallest) {
          smallest = distance;
          nearest = index;
        }
      });

      if (nearest === group.active) return;
      group.active = nearest;
      group.lines.forEach((line, index) => {
        line.classList.toggle('is-dim', index !== nearest);
      });
    });
  });
}
