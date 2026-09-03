/**
 * Masthead: pinned state, search control, full-screen menu, anchor scrolling.
 *
 * All local view state — pinned, search open, menu open — is presentational
 * and lives in class names and aria attributes. Nothing is stored anywhere.
 */

import { addScrollTask } from '../lib/scroll-driver.js';
import { motionAllowed } from '../lib/motion-preference.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

function initPinnedState(masthead) {
  let pinned = false;
  addScrollTask((scrollY) => {
    const next = scrollY > 48;
    if (next === pinned) return;
    pinned = next;
    masthead.classList.toggle('is-pinned', pinned);
  });
}

function initSearch(masthead) {
  const toggle = masthead.querySelector('[data-search-toggle]');
  const form = masthead.querySelector('[data-search-form]');
  if (!toggle || !form) return;

  const field = form.querySelector('input');

  const setOpen = (open) => {
    form.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open && field) field.focus();
  };

  toggle.addEventListener('click', () => {
    setOpen(form.hidden);
  });

  form.addEventListener('submit', (event) => {
    // Presentational only — there is nothing to submit to.
    event.preventDefault();
  });

  form.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      toggle.focus();
    }
  });
}

function initMenu(masthead) {
  const menu = masthead.querySelector('[data-menu]');
  const openButton = masthead.querySelector('[data-menu-open]');
  const closeButton = masthead.querySelector('[data-menu-close]');
  if (!menu || !openButton || !closeButton) return { close: () => {} };

  const words = Array.from(menu.querySelectorAll('.menu__word'));
  let open = false;
  let lastFocused = null;

  const playItems = () => {
    if (!motionAllowed() || typeof menu.animate !== 'function') return;
    words.forEach((word, index) => {
      word.animate(
        [
          { transform: 'translate3d(0, 105%, 0)', opacity: 0 },
          { transform: 'translate3d(0, 0, 0)', opacity: 1 },
        ],
        {
          duration: 900,
          delay: 120 + index * 80,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'backwards',
        }
      );
    });
  };

  const setOpen = (next) => {
    if (next === open) return;
    open = next;
    openButton.setAttribute('aria-expanded', String(open));

    if (open) {
      lastFocused = document.activeElement;
      menu.hidden = false;
      document.body.style.overflow = 'hidden';
      // let the element paint hidden before the fade begins
      window.requestAnimationFrame(() => {
        menu.classList.add('is-open');
        playItems();
        closeButton.focus();
      });
    } else {
      menu.classList.remove('is-open');
      document.body.style.overflow = '';
      const finish = () => {
        menu.hidden = true;
      };
      if (motionAllowed()) window.setTimeout(finish, 380);
      else finish();
      if (lastFocused instanceof HTMLElement) lastFocused.focus();
    }
  };

  openButton.addEventListener('click', () => setOpen(true));
  closeButton.addEventListener('click', () => setOpen(false));

  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const items = Array.from(menu.querySelectorAll(FOCUSABLE)).filter(
      (item) => item.offsetParent !== null
    );
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  return { close: () => setOpen(false) };
}

function initAnchorScrolling(closeMenu) {
  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (!link) return;
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;

    event.preventDefault();
    closeMenu();
    target.scrollIntoView({
      behavior: motionAllowed() ? 'smooth' : 'auto',
      block: 'start',
    });

    // Move focus with the view so keyboard users are not left behind.
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}

export function initMasthead() {
  const masthead = document.querySelector('[data-masthead]');
  if (!masthead) return;
  initPinnedState(masthead);
  initSearch(masthead);
  const menu = initMenu(masthead);
  initAnchorScrolling(menu.close);
}
