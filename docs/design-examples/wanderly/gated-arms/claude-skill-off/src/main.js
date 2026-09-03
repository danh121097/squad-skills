/**
 * Wanderly — entry point.
 *
 * No framework, no dependencies, no network. Reusable behaviours live in
 * src/lib, each movement of the page lives in src/sections, and this file
 * only decides what gets switched on.
 *
 * The page is fully readable before any of this runs: every hidden state is
 * scoped to html.motion, which is set in the document head only when the
 * visitor has not asked for reduced motion.
 */

import { motionAllowed, onMotionChange } from './lib/motion-preference.js';
import { startScrollDriver } from './lib/scroll-driver.js';
import { initTextReveal } from './lib/text-reveal.js';
import { initImageReveal } from './lib/image-reveal.js';
import { initMagnetic } from './lib/magnetic-button.js';
import { initCursor } from './lib/custom-cursor.js';
import { initCountUp } from './lib/count-up.js';

import { initMasthead } from './sections/masthead.js';
import { initHero } from './sections/hero.js';
import { initLineFocus } from './sections/line-focus.js';
import { initPlaces } from './sections/places-showcase.js';
import { initEscapes } from './sections/escapes-track.js';
import { initChapters } from './sections/chapter-story.js';
import { initVoices } from './sections/voices-carousel.js';
import { initNextTransition } from './sections/next-transition.js';

function boot() {
  const motion = motionAllowed();
  const context = { motion };

  startScrollDriver();

  initTextReveal(context);
  initImageReveal(context);
  initCountUp(context);
  initMagnetic(context);
  initCursor(context);

  initMasthead(context);
  initHero(context);
  initLineFocus(context);
  initPlaces(context);
  initEscapes(context);
  initChapters(context);
  initVoices(context);
  initNextTransition(context);
}

try {
  boot();
  // Tells the head-side failsafe that the behaviours are live.
  document.documentElement.classList.add('is-ready');
} catch (error) {
  // Never let a scripting failure hide the page: drop every reveal state.
  document.documentElement.classList.remove('motion');
  document.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-in'));
}

// If the visitor turns reduced motion on mid-visit, settle everything at once.
onMotionChange((allowed) => {
  if (allowed) return;
  document.documentElement.classList.remove('motion');
  document.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-in'));
});
