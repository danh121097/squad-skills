# Frontend testing and debugging

Use for hydration or render bugs and animation or listener cleanup.

Hydration debugging compares server markup/data/environment with the first client render; do not hide a
mismatch with client-only rendering unless the feature truly requires it. Memory issues require inspecting
listener/timer/observer/subscription/object URL/GSAP/Motion cleanup.

Test error, stale, offline, permission and race paths, not only happy loading/success. Derive the
cross-browser/device matrix from the supported audience, not every engine mechanically.
