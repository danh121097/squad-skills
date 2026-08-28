# Platform: adaptive layout and input

Read this reference when one deliverable must adapt across mobile, tablet, and desktop form
factors, or when input modality — pointer, touch, keyboard — changes the design. It composes with
the target's platform reference; it replaces none of them.

**Verification tier:** adaptive behavior is render-gated through multi-viewport testing on web
targets. On native targets it inherits that platform's tier.

## Layout adaptation

- Adapt at content and task thresholds, then map them to the project's breakpoints or the
  platform's size classes; never fork layouts per marketing device name.
- Mobile is not desktop stacked vertically: re-rank what the screen shows by task priority, keep
  primary actions reachable, and collapse secondary content behind explicit disclosure.
- Two-pane and split-view: define the pane the flow starts in, what selection does in each size,
  how back behaves when panes merge, and where focus lands when a pane appears or collapses.
- Density shifts with form factor: comfortable spacing and larger targets on touch, tighter
  scanning-oriented density on desktop — from the same tokens, not a parallel scale.
- Specify reflow, priority, overflow, and sticky behavior per size; verify with long content,
  large text sizes, zoom, and both orientations. Respect safe areas and keyboard displacement.

## Input modality

- Hover is an enhancement, never the only path: every hover-revealed affordance has a touch and
  keyboard equivalent.
- Touch targets meet the platform minimum (44pt/48dp/24px CSS minimum per WCAG 2.2) with adequate
  spacing; pointer-precision interactions get larger forgiving hit areas on touch.
- Keyboard: full traversal in visual order, visible focus, arrow-key behavior inside composite
  widgets, and shortcuts only where the platform convention expects them.
- Detect capability, not device: design against pointer/hover capability and viewport size, and
  let hybrid devices (touch laptops, tablets with keyboards) pass both paths.
- Gestures need a visible alternative; drag, swipe, and long-press are accelerators, not the only
  route to an action.

## Handoff additions

State the size thresholds and their rationale, the behavior matrix per size class (layout,
navigation, density, disclosure), the input paths verified per modality, and which viewports the
render gates exercised versus what remains for a build role on real devices.
