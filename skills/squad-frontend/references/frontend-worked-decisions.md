# Frontend worked decisions

Read when a motion, cascade, accessibility or scope decision is ambiguous. **Observed** examples come from
design runs this catalog's maintainers recorded; **constructed** ones were not measured.

## 1. Smooth scroll and scroll-driven animation drift apart

**Situation:** A page ships a smooth-scroll library and a scroll-driven timeline. Nothing errors, but pinned
sections desync from the eased curve under load.

**Decision:** Give both one clock: forward the smooth-scroll position into the timeline's update and drive
the library from the timeline's ticker, never a private `requestAnimationFrame` loop. Check this first when
reviewing a scroll-driven page.

**Observed:** the most consequential defect across eight builds of one brief.

## 2. A reduced-motion path is a layout, not a property

**Situation:** A horizontal track is revealed by a transform inside a tall pinned section; the obvious
fallback sets `transform: none` under `prefers-reduced-motion`.

**Decision:** Re-lay-out those sections as static scrollers, subscribe to mid-session preference changes,
and load with the preference on to confirm every panel is reachable.

**Why:** The requirement is reaching the content, not removing motion. A `width: max-content` track with no
`overflow-x` is unreachable by construction. **Constructed.**

## 3. The CSS that wins is not the CSS in the markup

**Situation:** A utility class in the markup does nothing; separately, scroll-driven animation stops after
a layout fix.

**Decision:** Put component rules in a cascade layer — an unlayered rule outranks every layered utility. Use
`overflow-x: clip`, not `hidden`, which forces the other axis to `auto` and makes `body` a scroll container.
Confirm both via computed styles in the browser. **Observed.**

## 4. A horizontally scrolling region needs a tab stop

**Decision:** An `overflow-x: auto` track with no focusable child gets `tabIndex={0}` and an accessible
name; focusable cards instead only when they are interactive anyway. Review it by default, unrequested.

**Observed:** axe flagged it on mobile in three of four builds.

## 5. Spend the measure loop on numbers

**Decision:** Contrast, hit area and overflow are measurements: serve the page and read them before handing
over. The loop is costly — two thirds of one build's time — so spend it on checks with a number and leave
taste to review. **Observed.**
