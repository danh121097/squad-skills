# Codebase-first design examples

Read the example closest to the current stack. These demonstrate decision priorities; they are not fixed
visual templates.

## Example 0: Accepted Figma design exists

**Request:** Implement a responsive billing screen from an approved Figma frame.

**Designer response:**

- Inspect the authoritative frame, linked components, variants, variables, Auto Layout, constraints,
  prototype interactions, and exportable assets through Figma MCP.
- Preserve the approved hierarchy and art direction. Map Figma components to repository components and
  semantic tokens; do not redesign the screen with beUI.
- Use beUI or another reference only for a missing interaction/state, and keep that addition consistent
  with the Figma language.
- Report missing mobile behavior, error/loading states, or codebase conflicts instead of silently
  inventing them.

## Example 1: No Figma; existing React/Next.js application

**Request:** Redesign a project activity panel and make transitions smoother.

**Scout result:** The repository already has `Button`, `Tabs`, `Card`, status tokens, an 8px spacing
scale, and a shared `motion-tokens.ts`. It lacks a compact animated filter switcher.

**Designer response:**

- Keep the existing page shell, typography, `Card`, `Button`, status colors, spacing, and focus ring.
- Extend the existing `Tabs` API with a compact variant instead of adding a second tab system.
- Reference beUI's shared-layout tabs only for indicator continuity; map the behavior to the repository's
  existing motion tokens and DOM/accessibility contract.
- Build loading, empty, error, permission-disabled, keyboard, and reduced-motion states into the component.
- Reject unrelated glass cards, gradients, and animated counters because they do not support the task.

## Example 2: No Figma; greenfield React/Next.js product

**Request:** Design an onboarding flow without an existing component library.

**Designer response:**

- Research task-specific onboarding and account-setup flows on Dribbble/Pinterest, then compare with
  recent award/trending interaction references. Use UXSnaps/Mobbin to validate the real flow sequence,
  progressive disclosure, validation, recovery, and copy; record useful and rejected patterns.
- Establish a small semantic token set for surface, text, border, accent, danger, focus, radius, spacing,
  and motion before composing screens.
- Prefer shadcn primitives for form controls, dialog/popover behavior, and accessibility foundations.
- Inspect the live beUI catalog and source; select only components whose interaction directly supports
  the onboarding flow.
- Use Motion for purposeful step continuity, validation feedback, and completion—not a stagger on every
  child.
- Define reusable field, step shell, action bar, and feedback variants rather than styling each screen
  independently.
- Treat OpenUI as out of scope unless the onboarding itself contains model-generated interactive UI.

## Example 3: No Figma; greenfield Vue/Nuxt product

**Request:** Design and establish the first reusable components for a new Nuxt application.

**Designer response:**

- Establish semantic color, typography, spacing, radius, surface, focus, and motion tokens first.
- Use Reka UI as the accessible headless primitive foundation for dialogs, popovers, menus, tabs, form
  choices, focus management, and keyboard behavior.
- Add a styling layer with the selected CSS/Tailwind system. If the project wants shadcn-like styled,
  open-code components, use shadcn-vue on top of Reka UI rather than styling every primitive ad hoc.
- Use Motion for Vue (`motion-v`) for layout continuity, coordinated enter/exit, gestures, or scroll
  behavior; keep simple hover/color transitions in CSS.
- Reserve GSAP for a genuinely complex timeline, ScrollTrigger sequence, or SVG/canvas choreography; do
  not install it for ordinary component transitions.
- Research task-specific visual and real-product UX references, then synthesize an original system.

## Example 4: Existing Vue/Nuxt application

**Request:** Bring a beUI-style morphing action panel into a Nuxt product.

**Scout result:** The project uses Nuxt UI, Vue composables, CSS variables, and Vue transitions; it has no
React runtime.

**Designer response:**

- Preserve Nuxt UI controls, semantic tokens, validation, focus treatment, and responsive conventions.
- Treat the beUI component as an interaction reference, not copy-paste source.
- Specify the portable behavior: trigger and panel share visual identity; size changes preserve spatial
  continuity; content enters only after space exists; Escape closes; focus returns to the trigger.
- Map the implementation to Vue slots/composables and the project's current transition or motion
  utility. Do not introduce React or a parallel token system.
- Define a reduced-motion version using instant layout plus short opacity/color feedback.
- Keep the repository's existing motion library. Do not replace it with Motion or GSAP for this one panel.

## Example 5: Small UI change that needs no redesign

**Request:** Add an error message below an existing email field.

**Designer response:**

- Reuse the repository's existing field error component, semantic danger token, spacing, and live-region
  behavior.
- Do not consult beUI, create a new component, or add animation unless the local field pattern already
  includes it.
