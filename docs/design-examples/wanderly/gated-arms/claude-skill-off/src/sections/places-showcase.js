/**
 * Destination showcase
 *
 * Pointing at (or tabbing to) a destination crossfades the standing portrait
 * and the landscape plate to that place, nudges them, and updates the index
 * caption. The visuals are decorative duplicates of text that is already on
 * the page, so nothing is lost when they are hidden on small screens.
 */

const NAMES = ['Amalfi Coast', 'Kyoto', 'Bali', 'Swiss Alps'];

export function initPlaces({ root = document } = {}) {
  const list = root.querySelector('[data-places]');
  if (!list) return;

  const tall = root.querySelector('.places__tall');
  const right = root.querySelector('.places__right');
  const stacks = Array.from(root.querySelectorAll('[data-stack]'));
  const indexLabel = root.querySelector('[data-stack-index]');
  const nameLabel = root.querySelector('[data-stack-name]');
  const items = Array.from(list.querySelectorAll('.place'));
  if (!stacks.length || !items.length) return;

  let current = 0;

  const show = (index) => {
    if (index === current) return;
    current = index;
    stacks.forEach((stack) => {
      Array.from(stack.children).forEach((image, position) => {
        image.classList.toggle('is-shown', position === index);
      });
    });
    if (indexLabel) indexLabel.textContent = String(index + 1).padStart(2, '0');
    if (nameLabel) nameLabel.textContent = NAMES[index] || '';
  };

  const setEngaged = (engaged) => {
    if (tall) tall.classList.toggle('is-active', engaged);
    if (right) right.classList.toggle('is-active', engaged);
  };

  items.forEach((item, index) => {
    item.addEventListener('mouseenter', () => {
      show(index);
      setEngaged(true);
    });
    item.addEventListener('focusin', () => {
      show(index);
      setEngaged(true);
    });
  });

  list.addEventListener('mouseleave', () => setEngaged(false));
  list.addEventListener('focusout', (event) => {
    if (!list.contains(event.relatedTarget)) setEngaged(false);
  });
}
