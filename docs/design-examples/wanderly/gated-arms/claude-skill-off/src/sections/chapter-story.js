/**
 * Sticky chapter story
 *
 * The plate on the left holds while the chapters scroll past it. When a new
 * chapter takes the middle of the screen the visual crossfades, scales and
 * un-blurs into place — a change of scene rather than a cut.
 *
 * Below 900px the layout is image, text, image, text and this does nothing.
 */

import { trackActive } from '../lib/viewport-observer.js';

export function initChapters({ motion, root = document }) {
  const section = root.querySelector('[data-chapters]');
  if (!section) return;

  const stack = section.querySelector('[data-chapter-stack]');
  const chapters = Array.from(section.querySelectorAll('.chapter'));
  if (!stack || !chapters.length) return;

  const plates = Array.from(stack.children);
  if (motion) stack.classList.add('frame__stack--blur');
  section.classList.add('is-tracking');

  trackActive(chapters, (index) => {
    plates.forEach((plate, position) => plate.classList.toggle('is-shown', position === index));
    chapters.forEach((chapter, position) =>
      chapter.classList.toggle('is-active', position === index)
    );
  });
}
