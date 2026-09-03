/* Navigation state and the full-screen menu.

   Local view state only — pinned or not, open or not. No routing, no persistence.
   The menu manages focus properly: focus moves to the toggle, Tab is kept inside the overlay,
   Escape closes, and focus returns to whatever opened it. */

import { registerScrollReader } from "./scroll-driver.js";
import { motionAllowed } from "./motion-preferences.js";

const PIN_AFTER = 48;
const CLOSE_DELAY = 420;

export function initNavigation() {
  const nav = document.querySelector("[data-nav]");
  if (!nav) return;

  registerScrollReader(({ scrollY }) => {
    nav.classList.toggle("is-pinned", scrollY > PIN_AFTER);
  });

  window.requestAnimationFrame(() => nav.classList.add("is-ready"));

  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  const toggleLabel = document.querySelector("[data-menu-label]");
  if (!toggle || !menu) return;

  Array.from(menu.querySelectorAll("a")).forEach((link, index) => {
    link.style.setProperty("--i", String(index));
  });

  let opener = null;
  let closeTimer = 0;

  /* While the menu is open the page behind it is made inert where supported: that takes it out
     of the tab order without hiding focusable content from assistive technology the way
     `aria-hidden` would. The focus trap below covers browsers without `inert`. */
  const background = [document.querySelector("main"), document.querySelector("footer")];
  const supportsInert = "inert" in HTMLElement.prototype;
  const setBackgroundInert = (state) => {
    if (supportsInert === false) return;
    background.forEach((region) => {
      if (region) region.inert = state;
    });
  };

  const focusable = () => [toggle].concat(Array.from(menu.querySelectorAll("a, button")));

  const onKeydown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;

    const items = focusable();
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  function open() {
    window.clearTimeout(closeTimer);
    opener = document.activeElement;
    menu.hidden = false;
    document.body.classList.add("is-menu-open");
    toggle.setAttribute("aria-expanded", "true");
    if (toggleLabel) toggleLabel.textContent = "Close menu";
    setBackgroundInert(true);
    window.requestAnimationFrame(() => menu.classList.add("is-open"));
    document.addEventListener("keydown", onKeydown);
  }

  function close() {
    menu.classList.remove("is-open");
    document.body.classList.remove("is-menu-open");
    toggle.setAttribute("aria-expanded", "false");
    if (toggleLabel) toggleLabel.textContent = "Open menu";
    setBackgroundInert(false);
    document.removeEventListener("keydown", onKeydown);

    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(
      () => {
        menu.hidden = true;
      },
      motionAllowed() ? CLOSE_DELAY : 0
    );

    if (opener && typeof opener.focus === "function") opener.focus();
    else toggle.focus();
    opener = null;
  }

  toggle.addEventListener("click", () => {
    if (toggle.getAttribute("aria-expanded") === "true") close();
    else open();
  });

  menu.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("a") : null;
    if (target) close();
  });

  /* Growing past the menu's breakpoint hands navigation back to the bar: close cleanly rather
     than leaving a locked body behind an invisible overlay. */
  const wide = window.matchMedia("(min-width: 1024px)");
  const onBreakpoint = () => {
    if (wide.matches && toggle.getAttribute("aria-expanded") === "true") close();
  };
  if (typeof wide.addEventListener === "function") wide.addEventListener("change", onBreakpoint);
}
