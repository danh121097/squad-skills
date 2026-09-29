# Codebase-first design examples

Read the example closest to the current stack and platform. These demonstrate decision
priorities, not fixed visual templates.

## Example 0: The user supplied the design

**Request:** "Make the pricing page like this" with a screenshot, plus a link to a competitor's live
checkout "for reference".

- The screenshot is accepted intent: keep its hierarchy, grouping and emphasis, mapped onto repository
  components and semantic tokens. With an accepted Figma frame instead, inspect frames, variants,
  variables and Auto Layout through Figma MCP to the same end.
- The link is direction only: take its plan-comparison flow, never its brand, copy or assets.
- Research only what neither shows — the narrow-viewport layout and the loading and error states — and
  report a conflict with the codebase instead of silently inventing around it.

## Example 1: No Figma; existing React/Next.js application

**Request:** Redesign a project activity panel and make transitions smoother.

**Scout result:** The repository has `Button`, `Tabs`, `Card`, status tokens, an 8px spacing scale, and a
shared `motion-tokens.ts`; it lacks a compact animated filter switcher.

- Keep the existing page shell, typography, `Card`, `Button`, status colors, spacing, and focus ring;
  extend the existing `Tabs` API with a compact variant instead of adding a second tab system.
- Take indicator continuity from shared-layout tabs patterns, mapped to the repository's motion tokens
  and DOM/accessibility contract.
- Build loading, empty, error, permission-disabled, keyboard, and reduced-motion states into the
  component; reject unrelated glass cards, gradients, and animated counters.

## Example 2: No Figma; greenfield React/Next.js product

**Request:** Design an onboarding flow without an existing component library.

- Research onboarding flows: galleries for direction, teardowns for real flow sequence, validation,
  recovery, and copy; record useful and rejected patterns.
- Establish a small semantic token set (surface, text, border, accent, danger, focus, radius, spacing,
  motion) before composing screens, and prefer shadcn primitives for form controls and dialog/popover
  accessibility.
- Use Motion for purposeful step continuity, validation feedback, and completion — not a stagger on
  every child.
- Define reusable field, step shell, action bar, and feedback variants.

## Example 3: Existing Vue/Nuxt application

**Request:** Bring a reference morphing action panel into a Nuxt product.

**Scout result:** The project uses Nuxt UI, Vue composables, CSS variables, and Vue transitions; no
React runtime.

- Preserve Nuxt UI controls, tokens, validation, focus treatment, and responsive conventions; treat the
  reference as interaction intent, not copy-paste source.
- Specify the portable behavior — shared trigger/panel identity, spatial continuity, content entering after
  space exists, Escape closing, focus return — mapped to Vue slots and the existing transition utility. No
  React, no parallel tokens, no new motion library.
- Define a reduced-motion version using instant layout plus short opacity feedback.

## Example 4: Small UI change that needs no redesign

**Request:** Add an error message below an existing email field.

- Reuse the repository's existing field error component, semantic danger token, spacing, and live-region
  behavior; add no component or animation unless the local field pattern already includes it.

## Example 5: Existing React Native application

**Request:** Design a transaction row with an expandable detail state.

- Extend the app's existing list row component, theme module, and pressed-state convention; no new
  animation library for one expansion.
- Ship the row inert: amounts, status, and expansion state arrive as props; `squad-mobile` wires data
  and navigation.
- Honor reduce-motion, 44pt/48dp targets, and a grouped `accessibilityLabel`; state that verification was
  compile plus partial render, never a full render gate.

## Example 6: Tablet split-view adaptation

**Request:** Adapt a settings screen into a two-pane tablet layout.

- Define the size-class threshold where list and detail combine, selection behavior in each size, back
  behavior when panes merge, and where focus lands when the detail pane appears.
- Reuse the existing navigation and list primitives from the same tokens at both sizes — density shifts,
  the component language does not.
- Verify both orientations, keyboard traversal across panes, and hover-free operation; multi-viewport
  render gates cover web, real devices stay with the build role.
