/**
 * Custom cursor
 *
 * A quiet ring that trails the pointer, opens to a "View" disc over
 * photographic links and firms up over buttons. Desktop, fine-pointer and
 * motion-allowed only, and the rAF loop stops itself the moment the ring has
 * caught up with the pointer — it never idles.
 *
 * It is decorative: the word "View" duplicates the link text that is already
 * in the markup, and the element is aria-hidden.
 */

import { finePointer, motionAllowed } from './motion-preference.js';

const EASE = 0.2;

export function initCursor({ root = document } = {}) {
  const ring = root.querySelector('[data-cursor-el]');
  if (!ring || !finePointer() || !motionAllowed()) return;

  document.documentElement.classList.add('has-cursor');

  let pointerX = -100;
  let pointerY = -100;
  let ringX = -100;
  let ringY = -100;
  let running = false;

  const render = () => {
    ringX += (pointerX - ringX) * EASE;
    ringY += (pointerY - ringY) * EASE;
    ring.style.transform = `translate3d(${ringX.toFixed(1)}px, ${ringY.toFixed(1)}px, 0)`;

    if (Math.abs(pointerX - ringX) < 0.2 && Math.abs(pointerY - ringY) < 0.2) {
      running = false;
      return;
    }
    window.requestAnimationFrame(render);
  };

  const wake = () => {
    if (running) return;
    running = true;
    window.requestAnimationFrame(render);
  };

  document.addEventListener(
    'mousemove',
    (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      ring.classList.remove('is-hidden');
      wake();

      const target = event.target instanceof Element ? event.target : null;
      const view = target && target.closest('[data-cursor="view"]');
      const hover = target && target.closest('[data-cursor="hover"], a, button');
      ring.classList.toggle('is-view', !!view);
      ring.classList.toggle('is-hover', !view && !!hover);

      const onDark = target && target.closest('.escapes, .closing, .foot, .hero, .next, .menu');
      ring.classList.toggle('is-onDark', !!onDark && !view);
    },
    { passive: true }
  );

  document.addEventListener('mouseleave', () => ring.classList.add('is-hidden'));
  document.addEventListener('mousedown', () => ring.classList.add('is-hover'));
  window.addEventListener('blur', () => ring.classList.add('is-hidden'));
}
