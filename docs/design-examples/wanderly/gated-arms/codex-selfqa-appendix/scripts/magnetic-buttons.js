export function initMagneticButtons() {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!finePointer.matches || reducedMotion.matches) return;

  document.querySelectorAll('[data-magnetic]').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      const bounds = button.getBoundingClientRect();
      const x = (event.clientX - bounds.left - bounds.width / 2) * 0.16;
      const y = (event.clientY - bounds.top - bounds.height / 2) * 0.16;
      button.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });

    button.addEventListener('pointerleave', () => {
      button.animate(
        [{ transform: button.style.transform }, { transform: 'translate3d(0, 0, 0)' }],
        { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
      button.style.transform = '';
    });
  });
}
