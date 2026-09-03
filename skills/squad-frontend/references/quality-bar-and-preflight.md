# Quality bar and pre-flight

Read before handing a slice to QA, Code Review or the next role. Every check runs in the repository's own
browser, test and build tooling, so the pass holds with no other skill installed.

## What weak frontend output looks like

- A screen that renders one state. Loading, empty, error, stale, offline, permission-denied and long-content
  paths exist in the product but not in the component.
- Tests bound to the implementation: internal selectors, a mocked child that is the behavior under test, a
  fixed sleep standing in for a deterministic event.
- A hydration mismatch hidden behind client-only rendering instead of reconciled with the server data.
- Effects that never clean up — listeners, timers, observers, subscriptions, object URLs, animation
  instances — so a second mount leaks or double-fires.
- Derived state duplicated into a store, dishonest effect dependencies, memoization added before any
  measurement asked for it.
- Motion with no lifecycle: nothing cancels on unmount, interruption is undefined, and the reduced-motion
  path removes the transform that was the only thing bringing content into view.
- Accessibility and performance asserted from clean code. A scrollable track with no tab stop and a 3.4:1
  label both read fine in review and fail a measurement.
- A server defect absorbed by the client: a longer timeout, a shape-tolerant parser, a retry that hides the
  contract break instead of routing it to Backend.

## Pre-flight

Pass every applicable check honestly.

### Behavior and data

- Every state the API, permissions and navigation can produce is reachable and rendered.
- Fetch, mutate, cache, cancel and retry behavior follows the published contract, not one observed response.
- URL, server cache and client state each have one owner, and the flow agrees with the logic it renders.

### Platform and accessibility

- Semantic HTML first; keyboard path, focus order and visible focus work across the changed surface.
- Contrast, labels, announcements and hit areas are measured on the built page, not inferred from tokens.
- Responsive layout and reduced motion are both exercised, and all content stays reachable under each.

### Code and tests

- Repository patterns preserved; components composed from existing primitives rather than duplicated.
- Tests query what a user sees, await real events, and cover at least one failure path.

## Proof to hand over

Name the checks that ran — type, lint, build, tests, browser, accessibility, performance — the route,
viewport and build mode they ran in, and what was not tested. A check that could not run is reported as
not run, never as a pass.
