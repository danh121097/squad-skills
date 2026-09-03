# Platform: web foundations and motion

Read this reference for a web target — classifying an existing versus greenfield web project,
selecting a React/Next.js or Vue/Nuxt UI foundation, porting an interaction across frameworks,
choosing web animation technology, or evaluating OpenUI. Native targets load their own platform
reference instead. Do not use these defaults to replace a working local system.

## 1. Existing codebase

Treat the repository as the implementation authority. Inspect components, variants, tokens, CSS strategy,
layout shells, content density, motion utilities, accessibility behavior, dependencies, routes, and tests.
Reuse and extend them before proposing anything new.

When accepted Figma also exists, preserve its design intent but map it onto repository primitives. Report
material conflicts; do not silently fork the visual system.

Do not introduce shadcn, Reka UI, Motion, GSAP, beUI, or another foundation merely because it is listed
below. A new dependency requires a demonstrated gap and explicit approval.

## 2. Greenfield React/Next.js

- Establish semantic color, typography, spacing, radius, surface, focus, and motion tokens first.
- Prefer shadcn/ui for accessible open-code components.
- Use selected beUI source/components for purposeful animated patterns; inspect live source and dependencies
  before adoption and keep the set coherent.
- Use Motion for React for component-state, layout, gesture, enter/exit, and ordinary scroll-linked motion.
- Reserve GSAP for requirements that need its timeline or plugin model.

beUI is a preferred optional source, not a dependency or authority over the repository/design contract;
its entrypoints live in the source registry. Fetch its agent guide live, verify availability, source,
license and dependencies before adopting a component, and if a deep link moves, use the catalog root or
implement the same accepted behavior with local primitives.

## 3. Greenfield Vue/Nuxt

- Establish the same semantic token foundation before composing screens.
- Prefer Reka UI for accessible unstyled primitives, keyboard behavior, focus management, and composition.
- Style with the project's chosen CSS/Tailwind token layer.
- When a shadcn-like styled open-code layer is desired, use shadcn-vue, whose primitives are powered by
  Reka UI. Raw Reka primitives are not themselves a complete styled component system.
- Use Motion for Vue (`motion-v`) for component-state, layout, gesture, enter/exit, and ordinary
  scroll-linked motion.
- Reserve GSAP for requirements that need its timeline or plugin model.

## 4. Cross-framework adaptation

Port the design and behavior contract—not framework syntax. Translate component states, controlled state,
slots/children, focus and keyboard behavior, layout continuity, timing, responsive behavior, and semantic
tokens through the target framework's native composition model. Never paste React components into Vue or
Vue components into React.

## 5. Animation decision

Choose the lightest tool that satisfies the behavior:

- **CSS:** local hover, color, opacity, and small transform transitions.
- **Motion React / Motion for Vue:** declarative component-state animation, enter/exit, layout continuity,
  gestures, and ordinary scroll-linked UI behavior.
- **GSAP:** precise multi-step timelines, tightly synchronized choreography across many targets,
  ScrollTrigger pin/scrub/snap sequences, or advanced SVG/canvas work.

Do not let Motion and GSAP control the same elements or interaction. Define ownership boundaries. For
GSAP, ship lifecycle-scoped selectors, teardown/revert of timelines, contexts and ScrollTriggers,
responsive variants, and a reduced-motion fallback in the component you write.

Use CSS instead of installing a motion dependency for an effect CSS handles cleanly.

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

The greenfield defaults appear in both skills so each can run alone; maintain them as one policy and
resolve conflict in this order: accepted design, existing repository system, then these defaults.

## 6. Generative UI terminology

- **AI-assisted UI implementation:** an agent writes stable application components during development.
  beUI, shadcn, Reka, and Motion may be used without OpenUI.
- **Runtime Generative UI:** the shipped product asks a model to emit an abstract UI tree while running,
  and a renderer maps it to registered allowed components.

Use the beUI OpenUI guide, registered in the source registry, only for the second behavior. OpenUI is
not a default dependency for normal screens. Treat that guide as changing external documentation and
verify it live before relying on exact APIs.
