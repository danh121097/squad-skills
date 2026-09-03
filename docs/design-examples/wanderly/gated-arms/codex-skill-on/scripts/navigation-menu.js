export function initNavigationMenu() {
  const menu = document.querySelector("[data-mobile-menu]");
  const openButton = document.querySelector("[data-menu-open]");
  const closeButton = document.querySelector("[data-menu-close]");
  if (!menu || !openButton || !closeButton) return;

  let previouslyFocused = null;

  const focusable = () => [...menu.querySelectorAll("a[href], button:not([disabled])")];

  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    menu.inert = !open;
    menu.setAttribute("aria-hidden", String(!open));
    openButton.setAttribute("aria-expanded", String(open));
    openButton.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    document.body.classList.toggle("menu-open", open);

    if (open) {
      previouslyFocused = document.activeElement;
      closeButton.focus();
    } else if (previouslyFocused instanceof HTMLElement) {
      previouslyFocused.focus();
    }
  }

  function onKeydown(event) {
    if (!menu.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      setMenu(false);
      return;
    }
    if (event.key !== "Tab") return;

    const items = focusable();
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  openButton.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
  closeButton.addEventListener("click", () => setMenu(false));
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", onKeydown);
}
