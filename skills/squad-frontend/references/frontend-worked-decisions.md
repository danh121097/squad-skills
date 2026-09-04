# Frontend worked decisions

Read when a motion, cascade, accessibility or scope decision is ambiguous. Adapt the reasoning to the
repository in front of you; these are not templates.

Each example carries its provenance. **Observed** happened in a run this catalog's maintainers recorded;
**constructed** is derived from documentation and was not measured. Weigh them accordingly.

## 1. Smooth scroll and scroll-driven animation drift apart

**Context:** A page ships a smooth-scroll library and a scroll-driven timeline. Nothing errors, the page
scrolls, and pinned sections desync from the eased curve under load.

**Decision:** Give both one clock. Forward the smooth-scroll position into the timeline library's update
and drive the library from the timeline's ticker, never from a private `requestAnimationFrame` loop. Check
this integration first when reviewing a scroll-driven page.

**Observed:** the catalog's recorded design runs — the most consequential defect across eight builds of
one brief, and the one finding a blind judge caught in both reading orders.

## 2. A reduced-motion path is a layout, not a property

**Context:** A horizontal track is revealed by a transform inside a tall pinned section. The obvious
fallback sets `transform: none` under `prefers-reduced-motion`.

**Decision:** Design the still layout. Re-lay-out those sections as ordinary static scrollers, subscribe to
mid-session preference changes, and load the page with the preference on to confirm every panel is
reachable. Removing motion is not the requirement; reaching the content is.

**Observed:** the recorded reduced-motion check asks whether motion was removed and passes on that question
alone; nothing asks the follow-up. **Constructed:** no run measured a build failing this way — a track laid
out as `width: max-content` with no `overflow-x` is unreachable under the preference by construction.

## 3. The CSS that wins is not the CSS in the markup

**Context:** A utility class sits in the markup and does nothing; separately, scroll-driven animation stops
firing after a layout fix.

**Decision:** Put component rules in a cascade layer: an unlayered rule outranks every layered utility. Use
`overflow-x: clip` rather than `hidden`, which forces the other axis to `auto` and makes `body` its own
scroll container. Confirm both in the browser, not in the source.

**Observed:** the same runs, verified by reading the computed overflow and `scrollY` before and after.

## 4. A horizontally scrolling region needs a tab stop

**Decision:** An `overflow-x: auto` track with no focusable child gets `tabIndex={0}` and an accessible
name. Making each card focusable instead also clears the finding, and costs a tab stop per card — prefer it
only when the cards are interactive anyway. Treat the track as a default review item rather than something
a brief must request.

**Observed:** the same runs — reported by axe on the mobile viewport of three of four builds.

## 5. Render it and read the numbers

**Decision:** Contrast, hit area and layout overflow are measurements. Build, serve and check the running
page before handing over; a build that reads its own numbers beats one that was told the rules. The cost is
real — a measure-fix-remeasure loop took two thirds of one build's time — so spend it on the checks that
have a number, and leave taste to review.

**Observed:** the same runs, as their widest-reaching finding. Those builds also differed in sandbox
access, so it is evidence for verifying rather than a measured effect of any instruction.

## 6. One screen's state does not need a store

**Context:** A single screen needs cross-component state and the repository has no global store.

**Decision:** Use the framework's own composition and the existing server-state client. Introduce a store
when a second consumer or a cross-route requirement exists, not to avoid passing a value.

**Constructed:** the scope rule this role already applies; no recorded run behind it.
