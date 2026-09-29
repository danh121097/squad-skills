# Platform: web foundations and motion

Read this reference for a web target — classifying an existing versus greenfield web project, choosing a
UI foundation, or choosing web animation technology. Native targets load their own platform reference
instead. Do not use these defaults to replace a working local system.

## 1. Existing codebase

Treat the repository as the implementation authority. Inspect components, variants, tokens, CSS strategy,
layout shells, content density, motion utilities, accessibility behavior, dependencies, routes, and tests.
Reuse and extend them before proposing anything new.

When accepted Figma also exists, preserve its design intent but map it onto repository primitives. Report
material conflicts; do not silently fork the visual system.

Do not introduce shadcn, Reka UI, Motion, GSAP, or another foundation merely because it is listed below. A
new dependency requires a demonstrated gap and explicit approval.

## 2. Greenfield

Establish semantic color, typography, spacing, radius, surface, focus, and motion tokens first, then compose
from shadcn/ui (React/Next.js) or Reka UI, with shadcn-vue as the styled layer (Vue/Nuxt).

## 3. Animation decision

Choose the lightest tool that satisfies the behavior:

- **CSS:** local hover, color, opacity, and small transform transitions.
- **Motion React / Motion for Vue:** declarative component-state animation, enter/exit, layout continuity,
  gestures, and ordinary scroll-linked UI behavior.
- **GSAP:** precise multi-step timelines, tightly synchronized choreography across many targets,
  ScrollTrigger pin/scrub/snap sequences, or advanced SVG/canvas work.

Do not let Motion and GSAP control the same elements or interaction. Scope GSAP selectors to the component
and revert timelines, contexts and ScrollTriggers on teardown.

### Scroll-driven integration

Scroll motion breaks in a small set of repeatable ways. Check each before shipping:

- **One clock.** A smooth-scroll library (Lenis, Locomotive) and a scroll-driven timeline must share a
  ticker: drive the library from the animation library's ticker and forward its scroll event to the
  timeline's update. Left on its own `requestAnimationFrame`, the library scrolls the page while the
  timeline reads a stale position, and every pin, scrub and snap desyncs.
- **Never `overflow-x: hidden` on `html` or `body`.** It silently disables `position: sticky` and
  scroll-driven motion. Clip on an inner wrapper instead.
- **`100svh`, not `100vh`,** for a full-height section, so mobile browser chrome does not crop it.
- **A custom cursor is gated twice** — `prefers-reduced-motion` and `(pointer: fine)` — and moves by a
  transform written outside the render cycle, never component state per `pointermove`.
- **Component CSS belongs in a cascade layer.** An unlayered component class outranks every utility
  class, so the utility override the design intends loses silently.

### Cross-role ownership

Motion ownership follows authorship: whoever writes the animation code owns its lifecycle scoping,
teardown, and reduced-motion fallback. Designer therefore owns cleanup for motion inside the
presentational components it ships, alongside interaction intent, spatial model, purpose and timing
character. Frontend and mobile own motion they add while wiring behavior — route transitions, data-driven
and platform-lifecycle animation — plus bundle/performance verification of the whole app.

Resolve conflicts in this order: accepted design, existing repository system, then these defaults.
