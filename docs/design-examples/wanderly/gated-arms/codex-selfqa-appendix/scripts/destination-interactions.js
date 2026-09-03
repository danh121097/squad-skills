export function initDestinationInteractions() {
  document.querySelectorAll('[data-destination]').forEach((destination) => {
    const titleLink = destination.querySelector('h3 a');
    if (!titleLink) return;

    const engage = () => destination.classList.add('is-engaged');
    const disengage = () => destination.classList.remove('is-engaged');
    titleLink.addEventListener('pointerenter', engage);
    titleLink.addEventListener('pointerleave', disengage);
    titleLink.addEventListener('focus', engage);
    titleLink.addEventListener('blur', disengage);
  });
}
