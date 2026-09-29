# Frontend stack and motion selection

Read this reference when classifying an existing versus greenfield project, proposing a UI dependency,
porting a design across frameworks, or implementing non-trivial animation.

## 1. Existing codebase

Preserve the repository's framework, components, tokens, CSS strategy, motion utilities, API/state
patterns, accessibility semantics, and interaction language. Reuse or extend local primitives. Do not add
the preferred greenfield stack merely to standardize the project.

A new UI or motion dependency requires a concrete gap, compatibility/performance assessment, and user
approval.

## 2. Greenfield

Establish semantic tokens and reusable variants before feature composition.

- **React/Next.js:** shadcn/ui for open-code components.
- **Vue/Nuxt:** Reka UI for accessible headless primitives, styled through the project's CSS/Tailwind token
  layer; shadcn-vue when a shadcn-like styled layer is wanted.
- **Motion library:** follow `squad-designer`'s motion decision when it ran; otherwise Motion for React /
  `motion-v` for component-state, layout, gesture and enter/exit motion, GSAP only for complex timelines,
  ScrollTrigger or specialized SVG/canvas work.

## 3. Animation implementation

CSS covers local hover, color, opacity and small transforms; add Motion or GSAP only for what CSS cannot
do cleanly. Do not let Motion and GSAP control the same elements. Scope selectors to the component. Create
animation inside the framework lifecycle; revert/kill timelines, contexts, listeners and ScrollTriggers on
teardown. Verify that animation does not block input, cause layout shift, retain detached DOM, or violate
the performance budget.

### Cross-role ownership

Motion ownership follows authorship: whoever writes the animation code owns its lifecycle scoping,
teardown, and reduced-motion fallback. Motion arriving inside designer-authored presentational components
is already scoped and cleaned up there — verify it, do not re-own it. Frontend owns the motion it writes
while wiring behavior, such as route transitions and data-driven animation, plus dependency approval and
bundle/performance verification of the whole app.

## 4. Cross-framework port

Port the UX contract, component state, keyboard/focus behavior, timing, reduced motion and tokens through
the target framework's native composition model, never by pasting components across frameworks.

## 5. Selection output

Record the framework and rendering model chosen or preserved, each UI or motion dependency added with
the gap it closes, the alternatives rejected, and the constraint that decided each. A decision another
role implements records what would reopen it, not only what was chosen.
