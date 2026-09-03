# Wanderly — the 2×2

One brief, four arms: two runtimes × the `squad-designer` skill on and off, on the
stack the brief actually names.

|                            | skill off                  | skill on                  |
| -------------------------- | -------------------------- | ------------------------- |
| **Codex** `gpt-5.6-sol`    | `sources/codex-skill-off`  | `sources/codex-skill-on`  |
| **Claude** `claude-opus-5` | `sources/claude-skill-off` | `sources/claude-skill-on` |

Every arm received a byte-identical `BRIEF.md`, `OUTPUT-CONTRACT.md`, and the same
21 images, at high reasoning effort. Verified before launch:

```
brief=2a210849dad9  contract=7af55ce57ee9  assets=21   (all four arms)
```

The only difference between an off arm and an on arm is one paragraph in the
prompt telling the on arm to read `skill/SKILL.md` and load the references its
routing conditions select. The skill copy handed to each on arm was hashed before
and after; it came back unchanged.

All four are real Next.js applications. Each one installs, type-checks and builds:

| Arm                | `tsc --noEmit` | `pnpm build` | Stack in use                                                                      |
| ------------------ | -------------- | ------------ | --------------------------------------------------------------------------------- |
| `codex-skill-on`   | exit 0         | ✓ compiled   | `next/image` 7 files · ScrollTrigger 9 · Lenis · lucide 7 · `next/font`           |
| `codex-skill-off`  | exit 0         | ✓ compiled   | `next/image` 8 · ScrollTrigger 9 · Lenis · lucide 6 · `next/font`                 |
| `claude-skill-on`  | exit 0         | ✓ compiled   | `next/image` 6 · ScrollTrigger 5 · Lenis · lucide 5 · `next/font` · `@gsap/react` |
| `claude-skill-off` | exit 0         | ✓ compiled   | `next/image` 7 · ScrollTrigger 4 · Lenis · lucide 6 · `next/font`                 |

## What the measurements say

The shipped gate harness builds a candidate offline with Vite and no
`node_modules`, so it cannot load any of these. The same questions were asked
through a browser the apps can actually run in: `next build`, `next start`, then
axe-core plus hit-area and overflow geometry, after scrolling the whole page so
scroll-revealed content is visible to the checks.

**These are counts of failing measurements, not scores.** A denser page offers
more elements to measure. Read direction, never magnitude.

| Measurement                           | Codex off | Codex on | Claude off | Claude on |
| ------------------------------------- | --------- | -------- | ---------- | --------- |
| axe `color-contrast` nodes, desktop   | **7**     | 17       | 16         | **7**     |
| axe `color-contrast` nodes, mobile    | **7**     | 17       | 16         | **4**     |
| targets under 44 px, desktop          | **16**    | 23       | **20**     | 23        |
| targets under 44 px, mobile           | **17**    | 18       | **18**     | 20        |
| elements past the viewport, desktop   | **30**    | 32       | 21         | **17**    |
| elements past the viewport, mobile    | **23**    | 27       | **22**     | 24        |
| document scrolls horizontally         | no        | no       | no         | no        |
| `scrollable-region-focusable`, mobile | 1         | 1        | 1          | **0**     |

The two runtimes point opposite ways. On Codex the skill-off arm is cleaner on
contrast and hit area. On Claude the skill-on arm more than halves the contrast
failures and is the only arm of the four that gives its horizontally scrolling
region a keyboard tab stop.

Nothing here reproduces across runtimes. On this brief, measured hygiene is a
property of the arm, not of the skill.

## What the rubrics say

The measurements above are hygiene. The question `squad-designer` exists to answer
is whether the design is any good, and that is the five rubrics in
`judging/RUBRIC.md`.

Protocol: each pair is packed into two anonymous source bundles labelled only
`Design 1` and `Design 2`, judged twice with the order swapped, by a judge from
the other provider family — the cross-provider rule in
`evals/squad-designer/eval-contract.md`. The judge is told nothing about how
either design was produced. Full unedited output is in
`judging/verdicts-real-stack.md`.

Each packet carries the arm's **complete** source tree. An earlier attempt at this
judging dropped the `styles/` directory of one arm, and both orders came back
complaining that its type system lived in files they had not been shown. Those
runs are void; a packet that is missing part of a design reads as a design with
no system.

### Claude pair, judged by Codex `gpt-5.6-sol`

| Rubric                            | skill off | skill on | Stable across the swap      |
| --------------------------------- | --------- | -------- | --------------------------- |
| `RUB-HIER-001` visual hierarchy   | 5.0       | 5.0      | tie in both orders          |
| `RUB-COHERE-001` system coherence | 4.0       | **5.0**  | **yes — on**                |
| `RUB-MOTION-001` motion purpose   | 3.5       | **5.0**  | **yes — on**                |
| `RUB-CONTENT-001` content realism | **5.0**   | 4.0      | **yes — off**               |
| `RUB-SLOP-001` absence of AI-slop | 5.0       | 5.0      | tie in both orders          |
| Total                             | 22.5      | **24.0** |                             |
| `OVERALL`                         |           | **on**   | **yes — on in both orders** |

Every rubric held its direction through the swap, and so did the overall verdict.
This is the first order-stable overall result in the whole exercise.

The judge's reason for `RUB-MOTION-001` was "clearer ownership, capability-gated
teardown, native fallbacks, and more complete live reduced-motion handling", and
for `RUB-COHERE-001`, centralised semantic tokens and primitives. Its reason for
giving content realism to the skill-off arm was richer authored copy — journey
details, article summaries, price context.

### Codex pair, judged by Claude `claude-opus-5`

| Rubric                            | skill off | skill on | Stable across the swap       |
| --------------------------------- | --------- | -------- | ---------------------------- |
| `RUB-HIER-001` visual hierarchy   | 4.0       | 3.5      | weak — off, then tie         |
| `RUB-COHERE-001` system coherence | **4.0**   | 3.0      | **yes — off**                |
| `RUB-MOTION-001` motion purpose   | **4.0**   | 2.5      | **yes — off**                |
| `RUB-CONTENT-001` content realism | 3.5       | 4.0      | weak — on, then tie          |
| `RUB-SLOP-001` absence of AI-slop | 3.5       | 3.5      | contradicted itself          |
| Total                             | **19.0**  | 16.5     |                              |
| `OVERALL`                         | **off**   |          | **yes — off in both orders** |

Order-stable as well, and pointing the other way.

Both judges independently landed on the same two rubrics as decisive — system
coherence and motion — and split on which arm won them. That is not a wash: the
Codex judgement rests on a specific, checkable engineering claim, and the claim is
correct.

`codex-skill-on/components/motion/smooth-scroll.tsx`:

```tsx
const raf = (time: number) => {
  lenis.raf(time);
  frame = requestAnimationFrame(raf);
};
frame = requestAnimationFrame(raf);
```

`codex-skill-off/components/motion/smooth-scroll.tsx`:

```tsx
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(update);
gsap.ticker.lagSmoothing(0);
```

The skill-on arm drives Lenis from its own `requestAnimationFrame` loop and never
tells ScrollTrigger that the scroll position moved, so every pinned and scrubbed
section it ships desyncs from the smooth scroll it also ships. Its custom cursor
carries no `prefers-reduced-motion` gate and calls `setState` on every
`pointermove`. Three of the four arms wire this correctly; that arm is the
exception, and its rubric loss is that defect, not a property of the skill.

### What replicated, and what did not

|                                 | Claude pair     | Codex pair   | Replicates           |
| ------------------------------- | --------------- | ------------ | -------------------- |
| Judge order-stable on `OVERALL` | yes             | yes          | **yes**              |
| Which arm won `OVERALL`         | on              | off          | **no — reverses**    |
| `RUB-COHERE-001`                | stable, on      | stable, off  | **no — reverses**    |
| `RUB-MOTION-001`                | stable, on      | stable, off  | **no — reverses**    |
| `RUB-SLOP-001`                  | tie both orders | contradicted | no signal either way |
| Measured contrast               | on much better  | off better   | **no — reverses**    |

Nothing about the skill's effect replicated across the two runtimes. What did
replicate is the method: with complete packets, both judges were order-stable on
the overall verdict, which they were not in the earlier round below.

**The honest reading of this 2×2 is that it does not resolve the question.** One
runtime's pair says the skill helps, the other's says it hurts, both with
order-stable judging, and the losing arm on the Codex side lost for a reason that
is an integration bug rather than a design decision. n = 1 per cell.

## The earlier round, and why it exists

`gated-arms/` holds a first pass at the same brief under a dependency-free
contract, so the shipped gate harness could score it. Those numbers are the only
ones in this folder produced by the repository's own instrument.

### Claude, dependency-free

| Invariant          | Severity | skill off  | skill on  | Better |
| ------------------ | -------- | ---------- | --------- | ------ |
| `INV-A11Y-001`     | critical | **pass**   | fail (5)  | off    |
| `INV-CONTRAST-001` | critical | fail (49)  | fail (81) | off    |
| `INV-OVERFLOW-001` | critical | fail (113) | fail (47) | on     |
| `INV-TOUCH-001`    | high     | fail (8)   | fail (74) | off    |
| `INV-ANIMCOST-001` | high     | fail (15)  | fail (5)  | on     |
| `INV-TOKEN-001`    | medium   | fail (53)  | fail (44) | on     |

### Codex, dependency-free

| Invariant          | Severity | skill off | skill on  | Better |
| ------------------ | -------- | --------- | --------- | ------ |
| `INV-A11Y-001`     | critical | fail (3)  | fail (6)  | off    |
| `INV-CONTRAST-001` | critical | fail (42) | fail (85) | off    |
| `INV-OVERFLOW-001` | critical | fail (78) | fail (31) | on     |
| `INV-TOUCH-001`    | high     | fail (42) | fail (14) | on     |
| `INV-ANIMCOST-001` | high     | **pass**  | fail (10) | off    |
| `INV-TOKEN-001`    | medium   | fail (47) | fail (75) | off    |

`BUILD`, `DEP`, `KEYBOARD`, `MOTION`, `SCOPE`, `SOURCE` pass on all four.

Three-three on Claude with accessibility flipping against the skill; four-two on
Codex with animation cost flipping against it. At gate level, on that contract,
the skill did not help either runtime.

Rubric judging on that round was swamped by position bias: both judges named
`Design 1` the winner in both orders — a different design each time — so no
overall verdict from it is usable. Only one finding survived its order swap and
source confirmation, and it is `lessons.md` §8.

The two rounds are **not comparable to each other**. Different contract, different
stack, different instrument. No number crosses between them.

## How much of this can be believed

- **n = 1 per cell.** One brief. Nothing here generalizes to the skill's behaviour
  on other cases, and nothing here is a promotion input.
- **Outside the protocol.** `evals/squad-designer/eval-contract.md` forbids judging
  a case whose arms are gate-blocked. The dependency-free arms all are; the
  real-stack arms cannot be gated at all. Every rubric number here is
  **advisory**.
- **Source, not pixels.** The judges read code. They never saw the rendered pages.
  `renders/` exists so a person can supply the eye the judge did not have.
- **Three process defects were found and corrected mid-run**, which is the main
  reason to distrust anything that was not re-verified afterwards:
  1. One dependency-free Codex arm ran under `danger-full-access` while its pair
     ran under `workspace-write`. The full-access arm used the network for a
     measure-fix-remeasure loop the other was denied. It is kept as
     `gated-arms/codex-selfqa-appendix` and is **not** a cell of any 2×2.
  2. Two agents were writing into one arm's output directory. The cause was that
     `claude -p` rewrites its own `argv`, so a `pkill -f 'claude -p …'` aimed at a
     stale process never matched it and it survived to collide with its
     replacement. Both Claude arms were rerun from clean directories, with exactly
     one process per arm verified by PID and working directory before the run was
     trusted.
  3. The first judging pass shipped an incomplete packet, as described above.
- **The supplied imagery is synthetic** gradient placeholders, not photography.
  Judge composition, type, rhythm and motion; the pictures are stand-ins.

## Renders

`renders/` holds a stitched full-page capture of each arm at 1440×900 and 390×844,
assembled from real viewport tiles — a `fullPage` screenshot resizes the viewport,
which balloons `100svh` sections and pushes later content out of frame.

`renders/compare/` places two arms side by side, aligned from the top, with the
left arm named in the caption strip.
