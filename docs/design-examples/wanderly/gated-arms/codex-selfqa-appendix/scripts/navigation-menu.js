export function initNavigation() {
  const openButton = document.querySelector('[data-menu-open]');
  const closeButton = document.querySelector('[data-menu-close]');
  const menu = document.querySelector('#mobile-menu');
  if (!openButton || !closeButton || !menu) return;

  let lastFocused = null;

  function focusableElements() {
    return [...menu.querySelectorAll('a, button:not([disabled])')];
  }

  function openMenu() {
    lastFocused = document.activeElement;
    menu.hidden = false;
    document.body.classList.add('menu-is-open');
    openButton.setAttribute('aria-expanded', 'true');
    openButton.setAttribute('aria-label', 'Close menu');
    closeButton.focus();

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      menu.querySelectorAll('.mobile-menu-links a').forEach((link, index) => {
        link.animate(
          [{ opacity: 0, transform: 'translateY(2rem)' }, { opacity: 1, transform: 'translateY(0)' }],
          {
            duration: 480,
            delay: index * 50,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'backwards'
          }
        );
      });
    }
  }

  function closeMenu() {
    menu.hidden = true;
    document.body.classList.remove('menu-is-open');
    openButton.setAttribute('aria-expanded', 'false');
    openButton.setAttribute('aria-label', 'Open menu');
    lastFocused?.focus();
  }

  openButton.addEventListener('click', openMenu);
  closeButton.addEventListener('click', closeMenu);
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (event) => {
    if (menu.hidden) return;
    if (event.key === 'Escape') {
      closeMenu();
      return;
    }
    if (event.key !== 'Tab') return;

    const elements = focusableElements();
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}
