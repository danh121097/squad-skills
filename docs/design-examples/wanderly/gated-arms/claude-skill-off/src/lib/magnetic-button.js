/**
 * Magnetic button
 *
 * Leans 4–8px toward the pointer and eases back on leave. Pointer-driven, so
 * it costs nothing when the mouse is elsewhere, and it is never installed on
 * touch devices or when reduced motion is requested.
 */

import { finePointer, motionAllowed, clamp } from './motion-preference.js';

const PULL = 7;
const SETTLE = 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)';

function attach(element) {
  let bounds = null;

  const measure = () => {
    bounds = element.getBoundingClientRect();
  };

  const onEnter = () => {
    measure();
    element.style.willChange = 'transform';
    element.style.transition = 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)';
  };

  const onMove = (event) => {
    if (!bounds) measure();
    const relativeX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const relativeY = (event.clientY - bounds.top) / bounds.height - 0.5;
    const x = clamp(relativeX * 2, -1, 1) * PULL;
    const y = clamp(relativeY * 2, -1, 1) * (PULL * 0.6);
    element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
  };

  const onLeave = () => {
    bounds = null;
    element.style.transition = SETTLE;
    element.style.transform = 'translate3d(0, 0, 0)';
    window.setTimeout(() => {
      element.style.willChange = '';
    }, 700);
  };

  element.addEventListener('mouseenter', onEnter);
  element.addEventListener('mousemove', onMove);
  element.addEventListener('mouseleave', onLeave);
  element.addEventListener('blur', onLeave);
}

export function initMagnetic({ root = document } = {}) {
  if (!finePointer() || !motionAllowed()) return;
  root.querySelectorAll('[data-magnetic]').forEach(attach);
}
