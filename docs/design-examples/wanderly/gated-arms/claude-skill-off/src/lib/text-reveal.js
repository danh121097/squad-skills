/**
 * Typography reveal
 *
 * One behaviour, three modes:
 *   data-reveal="lines"  — masked vertical reveal of authored .rl lines
 *   data-reveal="words"  — the same mask, split per word at run time
 *   data-reveal="fade"   — rise and fade, for supporting copy and blocks
 *
 * The hidden state lives in CSS behind html.motion, so this module only ever
 * has to add the finishing class. If it never runs, the text is simply there.
 */

import { whenInView } from './viewport-observer.js';

const STEP = 0.055;

function applyBaseDelay(element) {
  const delay = parseFloat(element.dataset.delay || '0');
  if (delay > 0) element.style.setProperty('--delay', `${delay}s`);
}

/** Wrap each word in a mask/inner pair so it can slide up independently. */
function splitWords(element) {
  if (element.dataset.split === 'done') return;
  const words = (element.textContent || '').trim().split(/\s+/);
  const base = parseFloat(element.dataset.delay || '0');
  const fragment = document.createDocumentFragment();

  words.forEach((word, index) => {
    const mask = document.createElement('span');
    mask.className = 'rw';
    const inner = document.createElement('span');
    inner.className = 'rw__i';
    inner.textContent = word;
    mask.style.setProperty('--word-delay', `${(base + index * STEP).toFixed(3)}s`);
    mask.appendChild(inner);
    fragment.appendChild(mask);
    if (index < words.length - 1) fragment.appendChild(document.createTextNode(' '));
  });

  element.textContent = '';
  element.appendChild(fragment);
  element.dataset.split = 'done';
}

/**
 * Wire every text reveal in `root`.
 * @param {{motion: boolean, root?: ParentNode}} options
 */
export function initTextReveal({ motion, root = document } = {}) {
  const targets = root.querySelectorAll(
    '[data-reveal="lines"], [data-reveal="words"], [data-reveal="fade"]'
  );

  targets.forEach((element) => {
    if (!motion) {
      element.classList.add('is-in');
      return;
    }
    applyBaseDelay(element);
    if (element.dataset.reveal === 'words') splitWords(element);
    whenInView(
      element,
      (target) => target.classList.add('is-in'),
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
  });
}

/** Play a reveal immediately — used for the hero, which must not wait. */
export function revealNow(element) {
  if (element) element.classList.add('is-in');
}
