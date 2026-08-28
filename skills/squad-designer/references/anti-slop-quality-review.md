# Anti-slop quality review

Read this reference for material UI creation/redesign, a visual audit, or final design pre-flight. It
defines how to use [Taste Skill](https://www.tasteskill.dev/) without letting a generic framework override
the product's actual design authority.

## Authority order

Resolve conflicts in this order:

1. Explicit user decisions and accepted product requirements.
2. Accepted Figma design intent.
3. Existing repository components, tokens, content density, and interaction language.
4. Task-specific UX evidence from real products and current research.
5. Taste Skill and this anti-slop checklist as critique layers.

Taste Skill may identify generic output or missing craft. It must not silently redesign accepted Figma,
replace a working design system, introduce a fashionable stack, or expand scope.

## Designer mindset

- Start from product purpose, content, audience, and the existing system; style is a consequence.
- Distinguish novelty from differentiation and familiarity from generic output; prefer one strong
  design thesis with coherent constraints over a collage of trends.
- Evaluate the whole flow over isolated hero frames; motion is information in time — spatial
  relationship, causality, feedback, continuity.
- Treat accessibility, performance, localization, and implementation cost as design materials.
- Preserve verified user and product decisions; make trade-offs visible when evidence conflicts.

## Know the current vocabulary

Rejecting trends requires knowing them. Stay current on how contemporary products actually handle
type scale and weight, spacing rhythm, surface and elevation treatment, component anatomy, motion
character, and emerging interaction patterns — including agent-native primitives such as streaming
output, tool-call display, and approval surfaces. Use that vocabulary to recognize when a screen
reads as dated, when a convention has genuinely shifted, and to name precisely what a trending
reference is doing. Knowing the vocabulary is not adopting it: currency informs the critique below;
product fit decides what ships.

## Taste Skill routing

- Inspect the live skill catalog first. When a compatible Taste Skill capability is already installed,
  load only the variant relevant to the task—for example general frontend taste, a model-specific variant,
  or redesign audit.
- Treat the website's package names and versions as changing external information. Check current docs when
  exact behavior matters; do not assume a previously seen variant is stable.
- Never auto-install Taste Skill. If absent, apply the manual pre-flight below. Suggest installation only
  when repeated high-fidelity work would materially benefit, then wait for explicit approval.
- Do not activate it for logic-only changes, narrow bug fixes, or exact local-pattern extensions unless a
  visual audit is explicitly requested.

## Manual pre-flight

Pass every applicable check honestly:

### Brief and direction

- The direction follows industry, audience, task, content, brand, and desired mood.
- The screen has a clear design thesis; it is not a generic dashboard/landing composition.
- Existing-project redesigns preserve what already works and name every modernization lever.

### Hierarchy and composition

- Typography, spacing, grouping, alignment, and contrast create hierarchy before decoration.
- Content density matches the workflow; whitespace is neither empty spectacle nor cramped residue.
- Layout has intentional rhythm and variation without random asymmetry or novelty.
- Primary, secondary, and destructive actions are unmistakable.

### System coherence

- Components share tokens, anatomy, variants, radii, borders, shadows, icons, and state behavior.
- New blocks extend one coherent system instead of forming isolated showcase pieces.
- Realistic content and long/short values do not collapse the composition.

### Anti-patterns

- No gratuitous gradient, glow, glass, bento grid, pill, card stack, oversized heading, or floating blob.
- No decorative icon, illustration, chart, or animation without product meaning.
- No copied composition, brand asset, or distinctive interaction from research references.
- No trendy effect that weakens readability, navigation, accessibility, or performance.

### Interaction and motion

- Motion explains space, feedback, state, or continuity and uses the lightest suitable tool.
- Frequent actions feel immediate; expressive choreography is reserved for meaningful moments.
- Focus, keyboard, touch, interruption, loading, reduced-motion, and error/recovery behavior are designed.

### Final proof

- Responsive layouts and dark/light themes preserve hierarchy when both themes are in scope.
- WCAG 2.2 checks, realistic states, and implementation mapping are complete.
- The emitted components are complete enough that a build role wires behavior without filling visual
  gaps with generic AI defaults.

Record failed checks and revise the components before handoff. Do not claim Taste Skill ran when only this
manual fallback was used.
