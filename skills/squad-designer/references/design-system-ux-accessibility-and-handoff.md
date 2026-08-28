# Design system, UX, accessibility, and handoff

Use for non-trivial product flows, new component patterns, design-system work, responsive/adaptive
behavior, accessibility requirements or implementation handoff.

## UX framing

Define user, job, context, frequency, motivation, constraints, success, failure cost and recovery. Separate
business rule, user need and interface solution. Map entry points, prerequisites, decision points,
progress, cancellation/back, destructive confirmation, interruption, resumption and completion.

Use appropriate evidence: product analytics, support issues, user research, current production flows,
competitive pattern research and repository behavior. Gallery popularity is not UX proof.

## Information architecture and flow

- Use domain language and progressive disclosure; expose complexity when needed, not by default.
- Keep navigation model and object hierarchy stable across routes/screens.
- Minimize irreversible steps and memory burden; provide state, location and next-action feedback.
- Design happy path plus empty, partial, invalid, loading, stale, offline, permission, conflict, timeout,
  destructive and recovery paths.
- For multi-step flows define validation timing, saved progress, abandonment, back behavior and final review.
- For dense tools optimize scanning, comparison, keyboard efficiency and persistent context—not whitespace
  for its own sake.

## Design system model

Build layers without hard-coding component colors/spacing:

1. **Primitive tokens:** palette, type scale, spacing, radius, border, shadow, motion, breakpoint.
2. **Semantic tokens:** surface/text/border/action/status/focus roles and interaction states.
3. **Component tokens/variants:** only when a component needs a stable exception or density/size variant.
4. **Patterns/blocks:** composed flows with documented behavior, not new primitives.

Define light/dark/high-contrast parity when in scope. State fallback fonts, typography measure/leading,
content density, elevation model and icon rules. Token naming describes role, not appearance.

## Component specification

For every component define purpose, anatomy, content rules, variants, size/density, states, controlled/
uncontrolled behavior, keyboard/pointer/touch, focus management, screen-reader name/description/live region,
responsive adaptation, motion/reduced motion, slots/props and composition constraints.

Reuse existing components before adding variants; add a new primitive only when semantics/behavior cannot
fit without distortion. Avoid wrapper components that only rename styling.

## Responsive behavior in components

Design around content and task thresholds, then map to project breakpoints. Specify reflow, collapse,
priority, overflow, sticky behavior, zoom, long text, RTL and localization per component. Cross-form-factor
layout, split view, and input modality belong to the adaptive platform reference.

## Evaluation passes

Before handoff, review in order: comprehension (purpose, state, next action are quickly identifiable);
task (the full job completes, recovers, resumes with realistic data and errors); hierarchy (type, spacing,
contrast, grouping match information priority); consistency (one system without flattening distinct
roles); accessibility (keyboard, touch, screen reader, zoom, reduced motion, cognitive clarity);
responsive (usable across actual supported contexts); craft (alignment, rhythm, typography, states, motion
are intentional); implementation (maps to repository primitives with bounded additions). Match method to
risk — heuristic review, cognitive walkthrough, usability testing — and record evidence and unresolved
assumptions; never claim user validation from expert critique alone.

## Accessibility

Use semantic platform controls first. Define heading/landmark structure, focus order, focus restoration,
keyboard interactions, names/roles/states, error association, announcements, target size, contrast, zoom/
reflow, text spacing, orientation, reduced motion and non-color cues. Follow WCAG 2.2 and WAI-ARIA APG for
custom web widgets; platform HIG/Material guidance for mobile/native.

Accessibility includes cognitive clarity: plain language, consistent actions, visible state, safe recovery,
time-limit handling and reduced surprise. Automated contrast/axe checks never replace interaction review.

## Trust, safety, and privacy UX

Make data collection, audience/visibility, permission, irreversible action and system/AI uncertainty clear
at the decision point. Consent must be specific, understandable, revocable and not visually coerced. Avoid
dark patterns: disguised ads, confirm-shaming, obstruction, forced continuity, hidden costs, preselected
optional sharing and asymmetric accept/reject controls.

Protect sensitive values from casual exposure in screens, notifications, previews, screenshots and shared
devices where the product risk requires it. Design confirmation, undo/recovery, session expiry, account
recovery, export/delete and support escalation. Security controls should explain the next safe action
without leaking protected existence or internal details.

## Code handoff

The handoff is the built presentational layer plus the reasoning behind it. Deliver the component files in
the repository's stack and file layout, the props/slots surface a consumer binds, tokens added or reused,
every applicable state reachable from props, responsive rules as implemented, motion and reduced-motion
behavior as shipped, and the accessibility semantics as built. Add source frame/research links, open
decisions, and an acceptance checklist. Distinguish existing component reuse, extension and approved new
dependency.

Emitted components must be inert: no fetch, no client/store wiring, no router, no persistence, no
analytics, no secrets. Leave those seams as props, slots, or callbacks the build role binds, and say which
verification you ran versus which the build role must run in the real app.
