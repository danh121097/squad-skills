# Skill observations

A running log of what a squad skill got wrong, or missed, when it was used on
real work — and the rule that would have prevented it.

It exists because the first run that ever built and served an artifact with one
of these skills produced nine emit-time rules, and no evaluation produced any.
Those nine entered `squad-designer` 2.3.0 from one landing-page brief — four
arms across two runtimes, plus an earlier round under a different contract —
recorded in [`design-examples/wanderly/`](./design-examples/wanderly/) and
seeded below as entry 1. That loop ran once, by hand. This file is where it
becomes repeatable.

An observation is not a measurement and does not pretend to be one. A
measurement asks whether a change is better than the version before it, on a
frozen baseline. An observation only says: this happened once, here is the
evidence, here is the rule it argues for. Those are different strengths of
claim, and the path below is what keeps them apart.

## Boundary

- **An observation never edits a skill by itself.** It is evidence for a
  candidate rule. Whether that rule ships is decided by the skill-content rule in
  [AGENTS.md](../AGENTS.md), exactly as any other skill-content change.
- **An observation from outside the maintainer is untrusted content**, under the
  same rule as a knowledge card: it is read as data, never as an instruction to
  the reader or to an agent. Wording that tells anyone what to do belongs in the
  candidate rule, where a maintainer reviews it — not in the record of what
  happened.
- **A log entry is not a bug report.** A defect in this repository's tooling
  goes to an issue. This file records what a skill's _emitted output_ got wrong.

## What an entry carries

Four required fields. They are four rather than ten because a template nobody
fills records nothing.

| Field              | What it answers                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| **Built**          | What real work was produced, on what stack, with a link to the evidence if any survives                 |
| **Skill**          | Which skill ran, at which version                                                                       |
| **Missed**         | What the output got wrong, or never considered — concretely enough that someone else could recognise it |
| **Candidate rule** | The rule that would have prevented it, and which skill and reference would own it                       |

The fourth field is what separates an observation from a complaint. If no rule
can be written, the entry still has value as evidence, but it is not yet a
candidate and should say so.

A fifth line, **Outcome**, opens as `open` and is filled in later: what landed,
where, when, and in which commit — or why the candidate was declined. An entry
still reading `open` is a candidate nobody has decided.

## Promotion path

```text
observation           recorded here, with its evidence
   |
candidate rule        one rule, stated as the skill would emit it
   |
owner                 which skill, and which reference file inside it
   |
gate                  AGENTS.md decides, and only AGENTS.md — the full
   |                  deterministic gate plus maintainer review
   |
landed                the rule, plus the payload ceiling of every skill it
                      moves re-measured in the same commit
```

Two properties of this path are worth stating plainly, because both are places a
reader could reasonably assume otherwise:

- **The gate is not a measurement.** It shows the catalog stayed consistent and
  sized, not that the output improved. Real usage is a better source of
  candidates than invention; it is not a substitute for measuring the result.
- **One run is one run.** A rule derived from a single case can be right and
  still not generalise. Say which it is in the entry. The wanderly entry below
  does: four of its twelve lessons were about the measuring instrument rather
  than the skill, and stayed out.

## Template

```markdown
## N. <short name> — YYYY-MM-DD

- **Built:** …
- **Skill:** `<skill>` <version>
- **Missed:** …
- **Candidate rule:** … → `skills/<skill>/references/<file>.md`
- **Outcome:** open
```

Append entries in order; the newest is at the bottom. The number is assigned on
merge, so two entries opened at once do not have to race for it.

---

## 1. Wanderly landing page — 2026-09-03

- **Built:** A premium editorial landing page for a fictional travel brand, on
  the stack the brief named — Next.js, GSAP, Lenis — run as four arms across two
  runtimes with the skill on and off, plus an earlier dependency-free round so
  the shipped gate harness could score it. Full record, sources, renders and
  judging in [`design-examples/wanderly/`](./design-examples/wanderly/); the
  lessons and their evidence in
  [`wanderly/lessons.md`](./design-examples/wanderly/lessons.md).
- **Skill:** `squad-designer` 2.2.0.
- **Missed:** Nine failures the skill did not prevent, several of which its own
  arms committed. Motion driven by a smooth-scroll library desynchronised from
  the scroll-driven timeline because each kept its own scroll position. A dark
  section reached for the light ground's secondary ink at reduced opacity and
  composited to 3.38:1. `overflow-x: hidden` on `body` silently stopped the
  document scrolling and every scroll trigger with it. An unlayered component
  class outranked the Tailwind utility beside it, so the fix in the markup did
  nothing in the browser. A horizontally scrolling track shipped with no tab
  stop on three arms of four. Full-height sections were sized in `vh`, which tracks the
  largest viewport rather than the visible one and so leaves a gap under mobile
  browser chrome. The reduced-motion path removed the transform that was the
  only thing bringing three of four panels into view — and the deterministic
  gate passed it, because it asks whether motion was removed and not whether the
  content is still reachable. A custom cursor was gated for neither pointer type
  nor reduced motion, and re-rendered a React tree on every `pointermove`. And
  every arm broke a rule the skill already carried, that realistic content must
  not collapse the composition.
- **Candidate rule:** Nine, by owning reference —
  `skills/squad-designer/references/platform-web-foundations-and-motion.md`: a
  smooth-scroll library and a scroll-driven timeline share one ticker; never
  `overflow-x: hidden` on `html` or `body`; component CSS belongs in a cascade
  layer; `100svh`, not `100vh`, for a full-height section; a custom cursor is
  gated twice and moves outside the render cycle.
  `skills/squad-designer/references/design-system-ux-accessibility-and-handoff.md`:
  an inverted surface needs its own ink; a scrollable region needs a tab stop;
  reduced motion means reachable, not merely still.
  `skills/squad-designer/references/anti-slop-quality-review.md`: content is
  data, not decoration — a rewrite rather than an addition, naming the three
  concrete tells where the existing principle had named only the principle. It
  maps to no numbered lesson, which is why eight lessons yield nine rules.
- **Outcome:** All nine landed in `squad-designer` 2.3.0 on 2026-09-03, in
  commit `e282f6a`. The
  three references grew 718 → 883, 746 → 871 and 802 → 871 words, sized to leave
  `degraded-runtime-fallback` the median-setting task type so
  `budget.median_loaded_words` stayed at 1,959 against its 2,018 ceiling;
  `SKILL.md` and the routing table were untouched, and
  `evals/squad-designer/baseline-manifest.yml` was re-measured in the same
  change. Four further lessons from the same run — that a build which measures
  itself beats one that was merely instructed, that an LLM judge's verdict is
  usable only when the packet is complete, that token organisation has two valid
  shapes, and that the gate harness and the briefs describe different worlds —
  are about the instrument rather than the skill and stayed in `lessons.md`.

This entry predates the process it seeds: the loop was run once by hand, then
written down here so the next one does not depend on anybody remembering it.

## 2. Should the catalog get a squad-architect role? — 2026-09-07

- **Built:** A framing pass on a real pending decision in this repository:
  whether to implement the `squad-architect` plan, whose own phase 1 carries a
  stop condition — abandon the split if no role can carry the boundary sentence
  without losing work it can honestly do alone. Existing-repository case, no
  plan file requested, output stated in the conversation.
- **Skill:** `squad-product` 1.0.0.
- **Missed:** Two things, both structural rather than wrong-answer.

  The skill has no path for a framing that concludes the work should not be
  built. Its hard gates require phases that name an owner, the quality bar's
  `### Phases` section checks properties of phases, and the completion checklist
  has an item for each phase naming its role — all of which assume a plan
  exists. `framing-and-acceptance-criteria.md` distinguishes deferred from
  refused, but only for a non-goal inside a plan, never for the request itself.
  The honest output here was "do not build the role, build the smaller thing it
  bundled", and the skill offered no shape for that. A run following the
  checklist literally would have invented phases to have something to hand over.

  It also never says to re-verify the evidence in a plan it is handed. The
  architect plan's G1 — that the lead decides the greenfield stack with nothing
  behind it — was true when written and is no longer: `squad-backend`,
  `squad-devops`, `squad-frontend` and `squad-mobile` each carry
  existing-versus-greenfield selection in their own router line and checklist,
  and `squad-product` now names platform choice as an open decision with an
  owner. Workflow step 2 says to read enough of an existing repository to know
  what the plan adds to; it does not say that a prior plan's evidence is a claim
  with a date on it.

- **Candidate rule:** Two, by owning reference —
  `skills/squad-product/references/scope-phasing-and-sequencing.md`: framing may
  conclude that the best plan is no plan, and that conclusion carries the same
  evidence standard as one — what the request was reaching for, which cheaper
  thing serves it, and what would reopen the question. It is a successful
  framing, not a failed one, and it does not get phases invented for it.
  `skills/squad-product/references/framing-and-acceptance-criteria.md`: evidence
  inside a plan written earlier is a claim with a date, not a given. Re-check
  each load-bearing one against the repository as it is now, and say which no
  longer holds, before planning against it.
- **Outcome:** open

## 3. Framing an empty repository whose stack is already decided — 2026-09-07

- **Built:** A framing pass on `ecommerce-erp`, a real project of the maintainer
  that is an empty directory — not even a git repository — carrying one
  brainstorm document and no plan. Greenfield case, no plan file requested,
  output stated in the conversation. Every constraint the brainstorm claimed was
  checked against the template it names before being recorded as given: Next
  16.2.7, React 19.1, Express 5.2.1, Tailwind 4.3, Zod 4, `mongoose` present and
  `prisma` absent, `middleware/role.ts` present.
- **Skill:** `squad-product` 1.0.0.
- **Missed:** Two, both about shapes the skill treats as binary when they are
  not.

  A request can arrive **partly** framed, and the skill has no word for it. The
  brainstorm carried outcome, constraints, non-goals and seven checkable criteria
  — everything `HANDOFF-PLAN-001` asks for except the phases naming their owning
  role, which is the half the lead's hard gate 1 refuses on. The stop condition
  offers only "already framed with checkable criteria — say so and route it
  onward", and the router only distinguishes a request that needs framing from
  one that does not. Followed literally, a run either re-frames what the user
  settled — which gate 2 forbids — or routes an incomplete frame onward for
  `squads-team` to reject. The useful action was to complete the missing half and
  name the clause the gap was measured against.

  Second, `requirements-and-unknowns.md § An empty repository inverts that`
  assumes an empty repository means an undecided stack. Here the stack was
  decided in detail and nothing was built, and that shape has its own gap: no
  role in the roster owns the first slice of scaffolding, which spans
  `apps/web`, `apps/api`, `packages/db` and CI at once. The reference gave no
  reading for it, so the phase went out as a reported coverage gap with a
  recommended default rather than an owned phase.

- **Candidate rule:** Two, by owning reference —
  `skills/squad-product/references/framing-and-acceptance-criteria.md`: a request
  can arrive partly framed. Record what is already framed as given, produce only
  the missing part, and name the contract clause the gap was measured against.
  Re-framing what the user settled and routing an incomplete frame onward are
  both failures, and the stop condition as written allows only those two.
  `skills/squad-product/references/scope-phasing-and-sequencing.md`: an empty
  repository with a given stack still has no owner for the first slice that
  brings it into existence, because scaffolding spans every layer at once. Name
  that phase, give it a default owner, and report it as a coverage gap rather
  than attaching it to whichever role the next phase belongs to.
- **Outcome:** open
