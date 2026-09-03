import { motionPreferences } from "./motion-preferences.js";

export function initMagneticButtons() {
  if (!motionPreferences.precisePointer || motionPreferences.reduced) return;

  document.querySelectorAll("[data-magnetic]").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const bounds = button.getBoundingClientRect();
      const x = (event.clientX - bounds.left - bounds.width / 2) * 0.16;
      const y = (event.clientY - bounds.top - bounds.height / 2) * 0.16;
      button.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });

    button.addEventListener("pointerleave", () => {
      button.style.transform = "translate3d(0, 0, 0)";
    });
  });
}
