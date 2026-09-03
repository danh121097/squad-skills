# Wanderly — what transferred

Lessons from two rounds of the same brief: four arms on the stack the brief names,
and four earlier arms under a dependency-free contract so the shipped gates could
score them. Each lesson is tied to the evidence that produced it. Where the
evidence is a single run, it says so.

Nothing here is skill content. A lesson that proves durable across more than one
case becomes a candidate for `skills/squad-designer/references/` in a later cycle,
where it passes the normal gates and human promotion first.

## 1. Smooth scroll must be wired into the scroll-driven animations

The single most consequential defect across all eight arms, and the one a blind
judge caught in both orders. `lenis` and `ScrollTrigger` each maintain their own
idea of the scroll position. Driving Lenis from a private `requestAnimationFrame`
loop leaves ScrollTrigger reading the native scroll while the page moves on
Lenis's eased curve, so every pinned and scrubbed section desyncs from the smooth
scroll shipped alongside it.

Wrong — `sources/codex-skill-on/components/motion/smooth-scroll.tsx`:

```tsx
const raf = (time: number) => {
  lenis.raf(time);
  frame = requestAnimationFrame(raf);
};
frame = requestAnimationFrame(raf);
```

Right — the other three arms, here `sources/codex-skill-off`:

```tsx
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(update); // ticker reports seconds, Lenis wants ms
gsap.ticker.lagSmoothing(0);
```

Nothing errors either way. The page scrolls, the animations play, and the pinning
drifts under load. Three of four arms got this right; the fourth lost a rubric for
it. It is a two-line integration, and it is worth checking first in any review of
a GSAP + Lenis page.

## 2. Measuring beats instructing

The strongest single effect in either round was not a prompt. One dependency-free
Codex arm had network access and spent 25 of its 38 minutes in a
measure-fix-remeasure loop: 11 headless Chrome launches, axe-core, and three
Lighthouse passes.

It passed **nine of twelve** gates. Every other arm passed six or seven, and it
beat the skill-on arm on all six gates that arm failed.

| Gate               | self-QA arm | skill-on arm |
| ------------------ | ----------- | ------------ |
| `INV-A11Y-001`     | pass        | fail (6)     |
| `INV-ANIMCOST-001` | pass        | fail (10)    |
| `INV-TOUCH-001`    | pass        | fail (14)    |
| `INV-CONTRAST-001` | fail (38)   | fail (85)    |
| `INV-OVERFLOW-001` | fail (21)   | fail (31)    |
| `INV-TOKEN-001`    | fail (41)   | fail (75)    |

**This is not a skill result** — the two arms had different sandbox policies, and
the loop is what the extra access bought. See `matrix.md` for why it is
disqualified as an A/B.

The difference is not that one arm thought to verify and the others did not. All
three Codex arms reached for a browser. The two under `workspace-write` were
stopped by the sandbox — six `ENOTFOUND` and four `getaddrinfo` failures each,
fetching their tooling. The full-access arm recorded **zero** network errors and
completed the loop. Intent was equal; only access differed.

It remains the finding with the widest reach: on everything a machine can check, a
build that renders itself and reads its own numbers outperforms a build that was
merely told the rules. Contrast ratios, hit areas and layout overflow are
measurements, and no amount of instruction substitutes for taking them.

## 3. A dark surface needs its own secondary ink

The trap: define `--ink-soft` against the light ground, then reach for it — or for
the light ink at reduced opacity — on the dark section. `#f7f5f0` at 40–50% over
`#111713` composites to roughly `#6b6b65`, which is **3.38:1**. It reads fine to
the eye and fails AA.

Both dependency-free Claude arms avoided it by construction, each with a second
named token:

```css
--on-forest-soft: rgba(247, 245, 240, 0.68); /* skill off */
--night-text-secondary: rgba(247, 245, 240, 0.74); /* skill on */
```

A hand-built reference implementation did not, and produced ten desktop and nine
mobile contrast failures from that one rule. The fix was a token, not an override:

```css
--color-muted-inverse: #9b9c98; /* 6.58:1 on the night surface */
```

Rule: every ground gets its own secondary ink. Opacity is not a colour system.

The real-stack round shows the cost of getting this wrong at scale. Contrast is
where the four arms differ most — 4 failing nodes at best, 17 at worst — and the
spread is almost entirely about how each arm handled its dark sections.

## 4. `overflow-x: hidden` on `body` silently kills scroll-driven motion

Setting `overflow-x: hidden` forces the other axis to `auto`. `body` becomes its
own scroll container, the document stops scrolling, and every ScrollTrigger bound
to the default scroller never fires. Nothing errors. The page just sits there.

`overflow-x: clip` does not do this. Verified: `"hidden auto"` and `scrollY 0`
before, `"clip visible"` and `scrollY 13869` after.

## 5. An unlayered component class outranks every Tailwind utility

A bare `.eyebrow { color: var(--color-muted) }` beats `text-muted-inverse` sitting
right beside it in the markup, because Tailwind's utilities live in
`@layer utilities` and unlayered rules win against any layer. The utility looks
applied in the source and does nothing in the browser.

Moving the component rules into `@layer components` restored the expected order
and cleared the contrast failures the utility was supposed to fix.

## 6. A horizontally scrolling region needs a tab stop

An `overflow-x: auto` track with no focusable child is unreachable by keyboard.
`tabIndex={0}` plus an `aria-label` gives it arrow-key access and a name when it
is announced. axe reports this as `scrollable-region-focusable`.

This one is stubborn: axe reports it on the mobile viewport of **three of the
four** real-stack arms. `sources/claude-skill-on` is the only one that ships the
tab stop, and it is the only arm of the four with `tabIndex` anywhere in its
components. Worth treating as a default review item on any horizontal track rather
than something a brief needs to ask for.

## 7. `fullPage` screenshots lie about `100svh` layouts

Playwright's `fullPage` resizes the viewport to the document height. Sections sized
in `svh` or `vh` then balloon to that height, and everything below is pushed out of
the capture — producing a screenshot that is two-thirds empty and looks like a
rendering bug that does not exist.

Capture viewport-sized tiles while scrolling and stitch them. Every render in this
folder is built that way.

## 8. "Motion removed" is not the same as "content still reachable"

The most common reduced-motion fallback is also the most dangerous one:

```css
[data-horizontal-track] {
  transform: none !important;
}
```

If that transform was the only thing bringing panels 2–4 into view — the track is
`display: flex; width: max-content` with no `overflow-x`, inside a `350svh`
section — then honouring the preference deletes the content. The user gets three
and a half viewports of empty scroll and never sees three of the four panels.

`INV-MOTION-001` **passes** this. The gate asks whether motion is removed under
`prefers-reduced-motion`, and it was. No deterministic check in the registry asks
the follow-up question: is everything still reachable afterwards?

The arm that got this right shipped a module instead of a CSS override — one that
reads the query, subscribes to mid-session changes, and re-lays-out the affected
sections as ordinary static scrollers. Two blind judges, reading in opposite
orders, made the same call, and the source confirms it.

Rule: a reduced-motion path is a layout you have to design, not a property you turn
off. Test it by loading the page with the preference on and trying to reach
everything.

## 9. A custom cursor is a motion feature and a pointer feature at once

It needs two gates, not one: `(hover: hover) and (pointer: fine)` so it never
appears on touch, and `prefers-reduced-motion` so it never appears for someone who
asked for stillness. Three of the four real-stack arms gate both — through
`gsap.matchMedia()`, a `useReducedMotion()` hook, or a plain `matchMedia` pair.

The fourth gates neither, and additionally calls `setState` on every
`pointermove`, re-rendering a React tree at pointer frequency for an effect that
should be a transform on one element.

## 10. An LLM judge's overall verdict is only usable when the packet is complete

In the dependency-free round, **both judges named `Design 1` the winner in both
orders** — a different design each time. Position bias determined the headline
verdict every time it was asked for, and only one rubric finding survived its
order swap.

In the real-stack round, both judges were order-stable on the overall verdict and
on most rubrics. The visible difference between the rounds is that the second
round's packets carried every source file. The first real-stack attempt did not:
it dropped one arm's `styles/` directory, and both orders came back marking that
arm down for having no visible type system — a verdict about the packet, not the
design. Those runs are void.

The discipline that follows: build the packet by walking the whole source tree,
never a curated extension list; run the swap; and trust a rubric only when both
orders agree _and_ the claim can be confirmed against the source. Two findings in
this exercise met that bar — §1 and §8.

## 11. Two ways to organize tokens, and what each buys

One arm wrote a small palette with a usage law in the comment:

> Accent rule: `--green` is only ever used on paper, `--ember` only on forest.
> Both are chosen so they clear 4.5:1 against their own ground.

Another separated primitives from semantic roles, so a section can re-map meaning
without touching the palette:

```css
--text-secondary: var(--ink-soft);
--night-text-secondary: rgba(247, 245, 240, 0.74); /* set locally by .on-night */
```

Blind judges saw exactly this split in both rounds, and rewarded the role-based
arm for coherence while crediting the law-based one with bespoke character.
Neither is the better answer. A page with two surfaces wants roles; a page with one
wants the law and the smaller file.

## 12. The instrument shapes what can be learned

The gate harness builds offline with no `node_modules`. Any arm it can score is
therefore an arm that could not use Next.js, GSAP or Lenis — which is to say, not
the brief. Any arm built to the brief cannot be scored by it.

That is why this folder has two rounds and why no number crosses between them.
It is also the most actionable finding for the repository itself: the gates and
the briefs currently describe different worlds, and the checks that ran against
the real applications here — axe plus hit-area and overflow geometry against
`next build && next start` — are the shape a gate for this class of work would
need to take.

## What landed in the skill

Nine of these became emit-time rules in `squad-designer` 2.3.0, on 2026-09-03:

| Lesson | Rule                                                                  | Reference it landed in                          |
| ------ | --------------------------------------------------------------------- | ----------------------------------------------- |
| 1      | A smooth-scroll library and a scroll-driven timeline share one ticker | `platform-web-foundations-and-motion.md`        |
| 4      | Never `overflow-x: hidden` on `html` or `body`                        | same                                            |
| 5      | Component CSS belongs in a cascade layer                              | same                                            |
| 7      | `100svh`, not `100vh`, for a full-height section                      | same                                            |
| 9      | A custom cursor is gated twice, and moves outside the render cycle    | same                                            |
| 3      | An inverted surface needs its own ink                                 | `design-system-ux-accessibility-and-handoff.md` |
| 6      | A scrollable region needs a tab stop                                  | same                                            |
| 8      | Reduced motion means reachable, not merely still                      | same                                            |
| —      | Content is data, not decoration                                       | `anti-slop-quality-review.md`                   |

The last row is the exception in kind: it is the one rule the skill already
carried, as `Realistic content and long/short values do not collapse the
composition`, and every arm broke it anyway. It was rewritten with the three
concrete tells rather than added, so the next cycle measures whether naming the
failure binds where naming the principle did not.

The three references grew 718 -> 883, 746 -> 871, and 802 -> 871 words. The
growth was sized to leave `degraded-runtime-fallback` the median-setting task
type, so `budget.median_loaded_words` is unchanged at 1,959 against its 2,018
ceiling. `SKILL.md` and the routing table were not touched.

Lessons 2, 10, 11 and 12 are about the instrument, not the skill, and stay here.
