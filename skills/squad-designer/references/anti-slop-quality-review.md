# Anti-slop quality review

Read for material UI creation or redesign, a visual audit, or the final design pre-flight.

## Authority order

Resolve conflicts in this order:

1. Explicit user decisions and accepted product requirements.
2. Material the user supplied — screenshot, link, brief, accepted Figma. "Make it like this" is accepted
   intent; "for reference" is direction; an unclear one is a single fork to the lead.
3. Existing repository components, tokens, content density and interaction language.
4. Task-specific UX evidence from real products.
5. Critique layers: [Taste Skill](https://www.tasteskill.dev/), `ui-ux-pro-max`, and this checklist. Read
   `ui-ux-pro-max` as reference data; never hand it the design task.

A critique layer may name generic output or missing craft. It never silently redesigns the user's material,
replaces a working design system, introduces a fashionable stack or expands scope. Skip critique layers for
logic-only changes, narrow fixes and exact local-pattern extensions unless an audit was asked for.

## Know the current vocabulary

Rejecting trends requires knowing them; product fit decides what ships.

## Pre-flight

Run it on the rendered output, not on the code, and revise before handoff:

1. The direction follows the product's audience, task, content and brand — one design thesis, not a
   generic dashboard or landing composition.
2. A redesign keeps what already works and names each modernization lever.
3. Typography, spacing, grouping and contrast carry hierarchy before any decoration.
4. Primary, secondary and destructive actions are unmistakable.
5. Components share tokens, anatomy, radii, borders, shadows, icons and state behavior.
6. Content is data: per-item metadata is authored per item, counts follow the data, and containers grow
   with the longest real string rather than one repeated placeholder.
7. No gradient, glow, glass, bento grid, pill, card stack, oversized heading, blob, icon, chart,
   cream or off-white page background, italic accent word in a headline, numbered 01/02/03 section
   label, monospace micro-label or animation without product meaning, and nothing copied from a
   reference.
8. Motion explains space, feedback, state or continuity; frequent actions feel immediate.
9. Focus, keyboard, touch, loading, error and reduced-motion behavior are designed, not defaulted.
10. The measure loop in
    [design-system-ux-accessibility-and-handoff.md](design-system-ux-accessibility-and-handoff.md) came
    back clean, or what remains is recorded.
