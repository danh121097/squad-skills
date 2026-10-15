# Frontend testing and debugging

Use for hydration or render bugs and animation or listener cleanup.

Hydration debugging compares server markup/data/environment with the first client render and reconciles
the mismatch; client-only rendering is for features that truly require it. Memory issues require inspecting
listener/timer/observer/subscription/object URL/GSAP/Motion cleanup.

Test error, stale, offline, permission and race paths, not only happy loading/success. Derive the
cross-browser/device matrix from the supported audience, not every engine mechanically.
