/* Destination showcase.

   Pointing at — or keyboard-focusing — a destination crossfades the two plates and lets the
   active photograph drift a few pixels. Hover is only an enhancement here: below 1024px every
   destination carries its own photograph in the flow, so nothing is hover-only. */

export function initDestinationShowcase(scope = document) {
  const section = scope.querySelector("[data-places]");
  if (!section) return;

  const frames = Array.from(section.querySelectorAll("[data-place-frame]"));
  const items = Array.from(section.querySelectorAll("[data-place]"));
  if (!frames.length || !items.length) return;

  const setActive = (index, engaged) => {
    frames.forEach((frame) => {
      frame.classList.toggle("is-hovered", Boolean(engaged));
      Array.from(frame.querySelectorAll("[data-place-image]")).forEach((image) => {
        image.classList.toggle("is-active", Number(image.dataset.placeImage) === index);
      });
    });
    items.forEach((item) => {
      item.classList.toggle("is-active", Number(item.dataset.place) === index);
    });
  };

  items.forEach((item) => {
    const index = Number(item.dataset.place);
    item.addEventListener("pointerenter", () => setActive(index, true));
    item.addEventListener("pointerleave", () => setActive(index, false));
    item.addEventListener("focusin", () => setActive(index, true));
    item.addEventListener("focusout", () => setActive(index, false));
  });

  setActive(0, false);
}
