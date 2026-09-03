/**
 * Horizontal escapes
 *
 * The track is always a real horizontal scroller, so touch swipe, trackpad,
 * keyboard and focus scrolling all behave natively at every viewport. On large
 * screens the section is additionally pinned and vertical scroll is mapped
 * onto scrollLeft — the pin length is measured from the actual track width so
 * the sideways travel stays roughly one-to-one with the wheel.
 *
 * When reduced motion is requested the pin is never installed and the section
 * is simply a swipeable strip.
 */

import { addScrollTask, addResizeTask } from '../lib/scroll-driver.js';
import { clamp } from '../lib/motion-preference.js';

export function initEscapes({ motion, root = document }) {
  const section = root.querySelector('[data-escapes]');
  if (!section) return;

  const track = section.querySelector('[data-track]');
  const fill = section.querySelector('[data-track-progress]');
  if (!track) return;

  const wide = window.matchMedia('(min-width: 901px)');
  let pinned = false;
  let maxScroll = 0;
  let progressQueued = false;

  const paintProgress = () => {
    progressQueued = false;
    if (!fill) return;
    const value = maxScroll > 0 ? clamp(track.scrollLeft / maxScroll, 0, 1) : 1;
    fill.style.setProperty('--p', Math.max(0.06, value).toFixed(4));
  };

  const queueProgress = () => {
    if (progressQueued) return;
    progressQueued = true;
    window.requestAnimationFrame(paintProgress);
  };

  const measure = () => {
    maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    pinned = motion && wide.matches && maxScroll > 0;

    if (pinned) {
      section.style.setProperty('--pin-height', `calc(100svh + ${Math.round(maxScroll * 1.15)}px)`);
    } else {
      section.style.removeProperty('--pin-height');
    }
    queueProgress();
  };

  addResizeTask(measure);
  track.addEventListener('scroll', queueProgress, { passive: true });

  addScrollTask((scrollY, viewportHeight) => {
    if (!pinned) return;
    const rect = section.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > viewportHeight) return;

    const travel = section.offsetHeight - viewportHeight;
    if (travel <= 0) return;
    const progress = clamp(-rect.top / travel, 0, 1);
    const target = Math.round(progress * maxScroll);
    if (Math.abs(track.scrollLeft - target) > 0.5) track.scrollLeft = target;
  });

  // Tabbing into a panel while pinned: move the page, not just the strip,
  // so the focused link is genuinely brought into view.
  track.addEventListener('focusin', (event) => {
    if (!pinned || maxScroll <= 0) return;
    const panel = event.target instanceof Element ? event.target.closest('.panel') : null;
    if (!panel) return;

    const padding = parseFloat(window.getComputedStyle(track).paddingLeft) || 0;
    const wanted = clamp(panel.offsetLeft - padding, 0, maxScroll);
    const travel = section.offsetHeight - window.innerHeight;
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: sectionTop + (wanted / maxScroll) * travel, behavior: 'auto' });
  });
}
