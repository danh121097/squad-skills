/**
 * Motion preference
 *
 * Single source of truth for "is this browser allowed to move things".
 * Every behaviour module asks here before it animates anything, and the
 * resting state of the page is always the readable, finished one.
 */

const REDUCED = '(prefers-reduced-motion: reduce)';
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

const query = (q) =>
  typeof window.matchMedia === 'function' ? window.matchMedia(q) : null;

const reducedQuery = query(REDUCED);
const pointerQuery = query(FINE_POINTER);

/** True when the user has not asked for reduced motion. */
export function motionAllowed() {
  return !(reducedQuery && reducedQuery.matches);
}

/** True for mouse/trackpad devices — magnetism and the cursor need it. */
export function finePointer() {
  return !!(pointerQuery && pointerQuery.matches);
}

/** Re-run `handler` whenever the motion preference flips. */
export function onMotionChange(handler) {
  if (!reducedQuery || typeof reducedQuery.addEventListener !== 'function') return;
  reducedQuery.addEventListener('change', () => handler(motionAllowed()));
}

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Progress of `element` through a scroll range, 0 at entry and 1 at exit. */
export function pinProgress(element, viewportHeight) {
  const rect = element.getBoundingClientRect();
  const travel = element.offsetHeight - viewportHeight;
  if (travel <= 0) return rect.top <= 0 ? 1 : 0;
  return clamp(-rect.top / travel, 0, 1);
}
