const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

export const motionPreferences = {
  get reduced() {
    return motionQuery.matches;
  },
  get precisePointer() {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  },
  onChange(callback) {
    motionQuery.addEventListener("change", callback);
    return () => motionQuery.removeEventListener("change", callback);
  },
};
