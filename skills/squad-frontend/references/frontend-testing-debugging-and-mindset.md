# Frontend testing, debugging, and mindset

Use for validation strategy, UI failures, rendering/hydration bugs, performance diagnosis and maintainable
frontend decisions.

## Testing by boundary

- pure unit/property tests for domain utilities, formatters and state transitions;
- component tests for semantics, interaction, keyboard, forms and state rendering;
- integration tests for router/query/store/API adapter boundaries with realistic fixtures;
- contract tests against published Backend schemas/error shapes;
- browser E2E for critical user journeys, auth/permissions and cross-route behavior;
- accessibility, visual regression and performance checks where regression risk exists;
- cross-browser/device matrix derived from supported audience, not every engine mechanically.

Prefer user-visible queries and deterministic events over implementation selectors/sleeps. Mock at network
or external boundaries; do not mock the component behavior under test. Test error, stale, offline,
permission and race paths, not only happy loading/success.

## Debugging method

1. Reproduce in the real route, build mode, viewport, browser and account/permission path.
2. Capture console, network timing/payload shape, DOM/accessibility tree, state/query devtools and traces.
3. Determine whether source is render, state ownership, stale async result, router, CSS/layout, hydration,
   browser API, service worker/cache, animation lifecycle or Backend contract.
4. Reduce to the earliest incorrect state/DOM/network event; form and test a falsifiable hypothesis.
5. Fix cause, add regression evidence and recheck neighboring states/responsive/a11y/performance.

Hydration debugging compares server markup/data/environment with first client render; do not hide mismatch
with client-only rendering unless the feature truly requires it. Memory issues require listener/timer/
observer/subscription/object URL/GSAP/Motion cleanup inspection.

## Code quality

Prefer repository-native patterns, clear ownership and small composable components. Extract hooks/
composables/services for cohesive behavior, not to satisfy arbitrary line counts. Keep effect dependencies
honest, avoid derived-state duplication and premature memoization, and preserve framework-specific
reactivity rules.

## Frontend mindset

- Model user intent and recovery, not screenshots alone.
- Treat loading/error/permission/offline and long content as product states.
- Keep URL, server cache and client state ownership explicit.
- Respect web platform semantics before replacing them with JavaScript.
- Progressive enhancement and resilience matter where product context supports them.
- Measure performance and accessibility; do not infer them from clean code.
- Visual quality, logic, security and operability form one feature—not separate polish phases.

Completion requires fresh type/lint/build/test plus browser evidence proportional to risk and a precise
statement of what was not tested.
