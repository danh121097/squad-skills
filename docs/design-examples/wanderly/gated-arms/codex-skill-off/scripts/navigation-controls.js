const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function initializeNavigation() {
  const header = document.querySelector("[data-site-header]");
  const menu = document.querySelector("[data-mobile-menu]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const searchTrigger = document.querySelector("[data-search-open]");
  const searchDialog = document.querySelector("[data-search-dialog]");

  if (!header || !menu || !toggle) return;

  let previousFocus = null;

  const closeMenu = ({ returnFocus = true } = {}) => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    menu.setAttribute("aria-hidden", "true");
    menu.classList.remove("is-open");
    header.classList.remove("is-menu-open");
    document.body.classList.remove("menu-open");

    if (returnFocus && previousFocus instanceof HTMLElement) {
      previousFocus.focus();
    }
  };

  const openMenu = () => {
    previousFocus = document.activeElement;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    menu.setAttribute("aria-hidden", "false");
    menu.classList.add("is-open");
    header.classList.add("is-menu-open");
    document.body.classList.add("menu-open");

    const firstLink = menu.querySelector("a");
    window.setTimeout(() => firstLink?.focus(), 50);
  };

  toggle.addEventListener("click", () => {
    if (toggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
      return;
    }

    if (event.key !== "Tab" || toggle.getAttribute("aria-expanded") !== "true") return;

    const focusable = [toggle, ...menu.querySelectorAll(focusableSelector)];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  searchTrigger?.addEventListener("click", () => {
    if (typeof searchDialog?.showModal === "function") {
      searchDialog.showModal();
      window.setTimeout(() => searchDialog.querySelector("input")?.focus(), 0);
    }
  });

  let scheduled = false;
  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 48);
    scheduled = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!scheduled) {
        scheduled = true;
        window.requestAnimationFrame(updateHeader);
      }
    },
    { passive: true },
  );

  updateHeader();
}
