# Design system, UX, accessibility, and handoff

Use for non-trivial product flows, new component patterns, design-system work, accessibility requirements
or implementation handoff.

## Components and tokens

Name semantic tokens for the role, not the appearance, with light/dark/high-contrast parity when in scope.
Reuse existing components before adding variants; add a primitive only when semantics or behavior cannot fit
without distortion, and avoid wrappers that only rename styling. Design around content and task thresholds,
then map them to project breakpoints; cross-form-factor layout belongs to the adaptive platform reference.

## Evaluation

Match the review method to risk and never claim user validation from expert critique alone.

## Measure loop

Measure the rendered output rather than judging the code:

1. Render at two viewports — the narrowest and widest the product supports.
2. Run axe or the platform's accessibility scanner, and check text and non-text contrast per surface.
3. Check hit areas against the platform minimum, overflow with the longest real content, and that reduced
   motion still reaches every piece of content.
4. Fix and measure again until the pass is clean, or record exactly what remains and why.

Without a browser, device or scanner, state the tier that ran — compile, partial render or human review —
and what a build role must still measure. Never install tooling to close the gap.

## Accessibility

Semantic platform controls first; WCAG 2.2 and WAI-ARIA APG for custom web widgets, platform HIG/Material
guidance for native. Define focus restoration and announcements for dialogs, route changes and errors.
Automated contrast/axe checks never replace interaction review.

### Failures that survive review

Three recur often enough to check by name before handoff:

- **An inverted surface needs its own ink.** A dark section reusing the light-theme secondary text colour
  is the most common contrast failure; give every surface role its own body and secondary text token, and
  verify the pair rather than the palette.
- **A scrollable region needs a tab stop.** A horizontally scrolling track reachable only by pointer
  strands keyboard users: give it a tab stop and an accessible name, or reach its content another way.
- **Reduced motion means reachable, not merely still.** An element whose reveal is skipped must render in
  its final state. Guard the initial hidden state too, or the fallback ships content at zero opacity.

## Trust and privacy UX

Make data collection, visibility, permission, irreversible action and AI uncertainty clear at the decision
point; consent is specific, revocable and never visually coerced, and asymmetric accept/reject controls are
dark patterns.

## Code handoff

The handoff follows the entrypoint contract, plus source frame/research links, open decisions, an
acceptance checklist, and which of existing component reuse, extension or an approved new dependency each
piece is.

Emitted components must be inert: no fetch, no client/store wiring, no router, no persistence, no
analytics, no secrets. Leave those seams as props, slots, or callbacks the build role binds, and say which
verification you ran versus which the build role must run in the real app.
