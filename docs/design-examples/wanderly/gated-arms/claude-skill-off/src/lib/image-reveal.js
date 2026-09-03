/**
 * Image reveal
 *
 * Covers the three things photography does on this page:
 *   data-reveal="clip"   — a clip-path wipe as the frame enters
 *   data-parallax="0.06" — a slow vertical drift while the frame is on screen
 *   hover zoom           — handled in CSS on .frame > img, listed here so the
 *                          behaviour stays documented in one place
 *
 * Loading is left to the platform: every photograph carries loading="lazy"
 * except the hero, which is marked high priority instead.
 */

import { whenInView } from './viewport-observer.js';
import { addScrollTask, styleWriter } from './scroll-driver.js';
import { clamp } from './motion-preference.js';

function initClipReveals(root, motion) {
  root.querySelectorAll('[data-reveal="clip"]').forEach((frame) => {
    if (!motion) {
      frame.classList.add('is-in');
      return;
    }
    const delay = parseFloat(frame.dataset.delay || '0');
    if (delay > 0) frame.style.setProperty('--delay', `${delay}s`);
    whenInView(frame, (target) => target.classList.add('is-in'), {
      threshold: 0.12,
      rootMargin: '0px 0px -6% 0px',
    });
  });
}

function initParallax(root, motion) {
  const layers = Array.from(root.querySelectorAll('[data-parallax]'));
  if (!motion || !layers.length) return;

  const entries = layers.map((layer) => ({
    layer,
    frame: layer.closest('.frame') || layer.parentElement,
    strength: parseFloat(layer.dataset.parallax || '0.05'),
    write: styleWriter(layer),
  }));

  addScrollTask((scrollY, viewportHeight) => {
    entries.forEach(({ frame, strength, write }) => {
      const rect = frame.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > viewportHeight + 200) return;
      // -1 leaving the top, 0 centred, 1 entering from the bottom
      const centred = (rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight;
      const shift = clamp(centred, -1.2, 1.2) * rect.height * strength;
      write('--py', `${shift.toFixed(1)}px`);
    });
  });
}

export function initImageReveal({ motion, root = document } = {}) {
  initClipReveals(root, motion);
  initParallax(root, motion);
}
