# Codebase-first design examples

Read the example closest to the current stack and platform. These demonstrate decision
priorities, not fixed visual templates.

## Example 0: Accepted Figma design exists

**Request:** Implement a responsive billing screen from an approved Figma frame.

**Designer response:**

- Inspect the authoritative frame, linked components, variants, variables, Auto Layout,
  constraints, and prototype interactions through Figma MCP.
- Preserve the approved hierarchy and art direction. Map Figma components to repository
  components and semantic tokens; do not redesign the screen with beUI.
- Use another reference only for a missing interaction/state, kept consistent with the Figma
  language.
- Report missing mobile behavior, error/loading states, or codebase conflicts instead of
  silently inventing them.

## Example 1: No Figma; existing React/Next.js application

**Request:** Redesign a project activity panel and make transitions smoother.

**Scout result:** The repository has `Button`, `Tabs`, `Card`, status tokens, an 8px spacing
scale, and a shared `motion-tokens.ts`; it lacks a compact animated filter switcher.

**Designer response:**

- Keep the existing page shell, typography, `Card`, `Button`, status colors, spacing, and focus
  ring; extend the existing `Tabs` API with a compact variant instead of adding a second tab
  system.
- Reference beUI's shared-layout tabs only for indicator continuity; map the behavior to the
  repository's motion tokens and DOM/accessibility contract.
- Build loading, empty, error, permission-disabled, keyboard, and reduced-motion states into the
  component; reject unrelated glass cards, gradients, and animated counters.

## Example 2: No Figma; greenfield React/Next.js product

**Request:** Design an onboarding flow without an existing component library.

**Designer response:**

- Research onboarding flows through the source registry: galleries and award sites for
  direction, teardown libraries for real flow sequence, validation, recovery, and copy; record
  useful and rejected patterns.
- Establish a small semantic token set for surface, text, border, accent, danger, focus, radius,
  spacing, and motion before composing screens.
- Prefer shadcn primitives for form controls and dialog/popover accessibility foundations;
  select beUI components only where their interaction supports the flow, after inspecting live
  source.
- Use Motion for purposeful step continuity, validation feedback, and completion — not a stagger on
  every child.
- Define reusable field, step shell, action bar, and feedback variants. OpenUI stays out of
  scope unless the flow itself contains model-generated UI.

## Example 3: No Figma; greenfield Vue/Nuxt product

**Request:** Establish the first reusable components for a new Nuxt application.

**Designer response:**

- Establish the same semantic token foundation, then use Reka UI as the accessible headless base for
  dialogs, popovers, menus, tabs, focus management, and keyboard behavior.
- Want shadcn-like styled open-code components? Use shadcn-vue on top of Reka UI rather than styling
  every primitive ad hoc.
- Use Motion for Vue (`motion-v`) for layout continuity and coordinated enter/exit; keep simple hover
  and color transitions in CSS; reserve GSAP for genuinely complex timelines.

## Example 4: Existing Vue/Nuxt application

**Request:** Bring a beUI-style morphing action panel into a Nuxt product.

**Scout result:** The project uses Nuxt UI, Vue composables, CSS variables, and Vue transitions; no
React runtime.

**Designer response:**

- Preserve Nuxt UI controls, tokens, validation, focus treatment, and responsive conventions;
  treat the beUI component as an interaction reference, not copy-paste source.
- Specify the portable behavior — shared trigger/panel identity, spatial continuity, content
  entering after space exists, Escape closing, focus return — mapped to Vue slots and the
  existing transition utility. No React, no parallel tokens, no new motion library.
- Define a reduced-motion version using instant layout plus short opacity feedback.

## Example 5: Small UI change that needs no redesign

**Request:** Add an error message below an existing email field.

**Designer response:**

- Reuse the repository's existing field error component, semantic danger token, spacing, and
  live-region behavior.
- Do not consult beUI, add a component, or add animation unless the local field pattern
  already includes it.

## Example 6: Existing React Native application

**Request:** Design a transaction row with an expandable detail state.

**Designer response:**

- Extend the app's existing list row component, theme module, and pressed-state convention; no new
  animation library for one expansion.
- Ship the row inert: amounts, status, and expansion state arrive as props; `squad-mobile` wires data
  and navigation.
- Honor reduce-motion, 44pt/48dp targets, and a grouped `accessibilityLabel`; state that
  verification was compile plus partial render, never a full render gate.

## Example 7: Tablet split-view adaptation

**Request:** Adapt a settings screen into a two-pane tablet layout.

**Designer response:**

- Define the size-class threshold where list and detail combine, selection behavior in each size, back
  behavior when panes merge, and where focus lands when the detail pane appears.
- Reuse the existing navigation and list primitives from the same tokens at both sizes — density
  shifts, the component language does not.
- Verify both orientations, keyboard traversal across panes, and hover-free operation;
  multi-viewport render gates cover web, real devices stay with the build role.
