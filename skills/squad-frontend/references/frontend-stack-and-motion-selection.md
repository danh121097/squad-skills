# Frontend stack and motion selection

Read this reference when classifying an existing versus greenfield project, proposing a UI dependency,
porting a design across frameworks, or implementing non-trivial animation.

## 1. Existing codebase

Preserve the repository's framework, components, tokens, CSS strategy, motion utilities, API/state
patterns, accessibility semantics, and interaction language. Reuse or extend local primitives. Do not add
the preferred greenfield stack merely to standardize the project.

A new UI or motion dependency requires a concrete gap, compatibility/performance assessment, and user
approval.

## 2. Greenfield React/Next.js

- Establish semantic tokens and reusable variants before feature composition.
- Prefer shadcn/ui for open-code components.
- Use selected beUI source/patterns when their interaction directly supports the design.
- Use Motion for React for component-state, enter/exit, layout, gesture, and ordinary scroll-linked motion.
- Use GSAP only for complex timelines, precise multi-target choreography, ScrollTrigger, or specialized
  SVG/canvas animation.

## 3. Greenfield Vue/Nuxt

- Establish the same semantic token and variant foundation.
- Prefer Reka UI for accessible headless primitives.
- Use the selected CSS/Tailwind token layer for styling.
- Use shadcn-vue when a shadcn-like styled open-code layer powered by Reka UI is desired.
- Use Motion for Vue (`motion-v`) for component-state, enter/exit, layout, gesture, and ordinary
  scroll-linked motion.
- Use GSAP only for complex timelines, ScrollTrigger, precise choreography, or specialized SVG/canvas.

## 4. Other established web stacks

Preserve these when present; do not rewrite them into React/Vue:

- **Svelte/SvelteKit:** use runes/store conventions matching the project, load/actions/hooks, SSR/client
  boundaries, progressive enhancement and Svelte transitions where appropriate.
- **Angular:** preserve standalone/module choice, signals/RxJS boundaries, dependency injection, router,
  forms and Angular CDK/Material or local design system.
- **TanStack Start/Router/Query:** respect type-safe routes, loaders/server functions, cache ownership,
  SSR/dehydration and framework adapter differences.
- **Solid/SolidStart:** preserve fine-grained reactivity, resources, control-flow primitives and server/client
  boundaries; do not apply React memoization rules mechanically.
- **Astro:** keep islands and client directives minimal; prefer server/static HTML and framework components
  only where interactivity requires them.
- **Qwik, Lit/Web Components, Preact, Ember or other stacks:** follow repository conventions and official
  versioned docs; apply the same state, security, accessibility, performance and test contracts.

Framework choice follows rendering/deployment/product needs and team capability—not trend ranking.

## 5. Rendering model

Identify CSR, SPA, SSR, SSG, ISR, streaming, resumability/islands, React Server Components or hybrid
behavior before choosing data boundaries. Keep secrets/server-only modules outside client graphs. Define
cache/freshness, hydration, auth, SEO/metadata and failure behavior for each route.

Do not force SSR for authenticated app surfaces without measurable value; do not force SPA-only rendering
when crawlability, first response, sharing metadata or edge delivery require server/static output.

## 6. Animation implementation

Choose the lightest suitable tool:

- **CSS:** local hover, color, opacity, and small transform transitions.
- **Motion:** declarative component-state, layout, gesture, enter/exit, and ordinary scroll behavior.
- **GSAP:** timeline, pin/scrub/snap, multi-target choreography, or advanced SVG/canvas requirements.

Do not let Motion and GSAP control the same elements. Scope selectors to the component. Create animation
inside the framework lifecycle; revert/kill timelines, contexts, listeners, and ScrollTriggers on teardown.
Honor responsive variants and reduced motion. Verify that animation does not block input, cause layout
shift, retain detached DOM, or violate the performance budget.

Use CSS instead of adding Motion or GSAP for an effect CSS already handles cleanly.

### Cross-role ownership

Motion ownership follows authorship: whoever writes the animation code owns its lifecycle scoping,
teardown, and reduced-motion fallback. Motion arriving inside designer-authored presentational components
is already scoped and cleaned up there — verify it, do not re-own it. Frontend owns the motion it writes
while wiring behavior, such as route transitions and data-driven animation, plus dependency approval and
bundle/performance verification of the whole app.

The shared greenfield baseline is intentionally repeated for standalone operation; keep it aligned with
Designer's `ui-foundation-and-motion-selection.md`, and resolve conflicts through accepted design first,
then the repository's existing system.

## 7. Cross-framework port

Port the UX contract, component state, keyboard/focus behavior, layout continuity, timing, reduced motion,
and tokens through the target framework's native composition model. Never paste React components into Vue
or Vue components into React.
