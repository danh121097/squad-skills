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
- **Outcome:** Second rule landed 2026-09-07 in
  `framing-and-acceptance-criteria.md`, under "Constraints": evidence inside an earlier
  plan is a claim with a date, re-check each load-bearing one and say which no
  longer holds. This repository supplied the proof while the rule was still open
  — the `squad-architect` plan's two load-bearing findings were recorded with
  evidence and no expiry; one died and one had been wrong from the start, and
  nothing caught it until a second walk months of context later.

  First rule still open. "The best plan is no plan carries the same evidence
  standard as a plan" held true when that same architect plan was abandoned — but
  its own phase-1 stop condition already carried it, so it is not yet clear the
  rule adds anything a well-written stop condition does not.
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
- **Outcome:** Second rule landed 2026-09-07 in
  `scope-phasing-and-sequencing.md`, under "The first slice": an empty repository's first
  slice gets its own phase, the lead owns the workspace layout and each package
  goes to its layer's role. It became statable only once `squads-team` took
  ownership of that layout the same day — before that, product had a phase with
  no owner to name and could only report the gap.

  First rule still open. "A request can arrive partly framed" is right, but one
  run did not produce the test for _which_ half is missing, and a rule that
  cannot say that is one a run cannot apply.

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

  Second, `requirements-and-unknowns.md`, under "An empty repository inverts
  that", assumes an empty repository means an undecided stack. Here the stack was
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

## 4. The first run under DECISION-RECORD-001 — 2026-09-07

- **Built:** A frontend stack and rendering-model selection for `apps/web` in
  `ecommerce-erp`, a real project of the maintainer's, run against the
  brainstorm contract it already carries — stack fixed to Next.js 16 App Router
  / React 19, presentational layer reused from the `create-prism-app` `nextjs`
  template without redesign, architecture noted as "RSC shell + TanStack Query
  islands". Nothing was written into that repository. The run existed to answer
  a question the gate cannot: does `frontend-stack-and-motion-selection.md`'s
  new `## 8. Selection output` change what a selection pass produces, or only
  what it looks like.
- **Skill:** `squad-frontend`, `frontend-stack-and-motion-selection.md`
  sections 5 and 8, immediately after `DECISION-RECORD-001` landed.
- **Missed:** The clause did what it was bound for, and the way it did it was
  not the way the plan predicted.

  Producing "what would reopen it" for the rendering model forced the run to
  name its preconditions, and one of them was already an open question in the
  brainstorm: the deployment target. That question was logged there as a
  backend concern — its stated effect is "Prisma driver choice and connection
  pooling". It is equally a frontend blocker: an edge or non-Node target
  changes what the RSC shell can do at all. Without the reopen condition the
  run would have recorded "RSC shell + TanStack Query islands, preserved from
  the template" and stopped, and the shared dependency between two roles'
  decisions would have stayed invisible in a question filed under one of them.

  The second thing it surfaced is a contradiction inside the accepted
  architecture. The request path is drawn as `Next RSC/client → axios
(HMAC-signed, bearer JWT) → Express`, and the reused template pieces include
  an axios interceptor with a browser-side refresh manager. An RSC render has
  no browser, so server-side data fetching either duplicates the auth and
  refresh path or the shell carries no tenant-scoped data at all. Section 5 already
  demanded auth behavior per route; what made the contradiction unavoidable was
  having to state the condition under which the shell/islands split stops
  holding, because the condition is true today.

  What the clause did **not** do is anything for the two clauses that were cut
  from it in phase 1. "Options rejected" and "the deciding constraint" produced
  nothing here, because the framework fork was closed before the run started —
  which is the case the narrowing was for, and one run is not evidence that it
  generalises.

- **Candidate rule:** None yet for `squad-frontend`. One run is not enough to
  argue a rule, and the reference change under test is one commit old.

  What this argues for instead is a claim about the clause's placement:
  `squad-product`'s unknown register requires each unknown to name "what it
  would change", and here an unknown named one consequence and had two, in two
  different roles. If a second run reproduces that shape, the rule to write is
  on `skills/squad-product/references/requirements-and-unknowns.md` — an
  unknown records every role its answer changes, not the first one that
  noticed it — and not on the frontend reference at all.

- **Outcome:** open

## 5. Three parallel role slices on one empty repository — 2026-09-07

- **Built:** The scaffolding slice of `ecommerce-erp` — the slice that brings an
  empty repository into existence — run through `squads-team` as lead with
  `squad-backend`, `squad-frontend` and `squad-devops` executing concurrently
  under non-overlapping file ownership. The repository was never the goal; it
  was the vehicle for a multi-role run, and the maintainer stopped it once the
  observations were in hand.
- **Skill:** `squads-team` 1.0.0, `squad-qa` 1.1.0, and the three build roles.
- **Missed:** Two, both about what happens between slices rather than inside one.

  **A handoff nobody is required to check.** Frontend's report flagged that
  `apps/web/Dockerfile` bakes `NEXT_PUBLIC_API_URL`, which the app never reads.
  DevOps never saw that flag, because role reports go to the lead and not to
  peers. The lead is the only place the two halves meet, and nothing in
  `delivery-pipeline-and-roster.md` asks the lead to verify a handoff — section 5,
  Integration, says to run combined checks, and `coordination-contract.md` says
  the lead "never upgrades a gap into a result", which is a rule about honesty,
  not about checking. Grepping the two sides confirmed the intersection between
  supplied and consumed variable names was empty. Both slices were green on
  their own gates, and every combined check the pipeline names would also have
  passed: the values are inlined at build time, so the failure is a silently
  wrong origin in the browser, not a build error.

  What makes this a skill gap rather than one role's mistake is that the same
  pipeline produced the opposite outcome twice on the same run. Backend moved
  its health route to `${apiPrefix}/health` to match a path it found hardcoded
  in DevOps's compose file, and DevOps removed `env_file: .env` from the web
  service after reading its own rendered `docker compose config`. Both
  corrections came from reading an artifact rather than a report. The roles
  that read files caught their seams; the seam that was only ever described in
  prose survived three green gates.

  **A skipped test is green.** `packages/db/src/__tests__/tenant-context.integration.test.ts`
  is guarded by `describe.skipIf(!DATABASE_URL)`, and it is the only thing that
  would prove tenant isolation — acceptance criterion 1. It has never executed.
  `squad-qa`'s gate 4 governs determinism and now covers stochastic subjects,
  but nothing in the skill says a criterion whose evidence did not run is
  unevidenced. A suite that reports "0 failed" while its load-bearing case never
  entered the runner reads as a pass at every level above it. DevOps caught this
  one and refused to paper over it with a Postgres service container, on the
  correct ground that the default `postgres` superuser holds `BYPASSRLS` and
  would make the suite pass while proving nothing.

- **Candidate rule:** Two, by owning reference —

  `skills/squads-team/references/delivery-pipeline-and-roster.md` section 5 —
  integration verifies the seams between slices against the artifacts, not the
  reports: what one slice supplies is checked against what the other consumes.
  A handoff written in prose and confirmed by nobody is an untested contract.

  `skills/squad-qa/SKILL.md` or its test-architecture reference — a criterion
  whose evidence did not execute is unevidenced, not passed. A skipped test is
  a gap to report at the same volume as a failure.

  Both need a second run before they land. The first is the stronger of the
  two: it has a positive control in the same run, since two seams that were
  checked against artifacts held and the one checked against prose did not.

- **Outcome:** open

---

## 6. Four material forks arrived as four bullets — 2026-09-07

- **Built:** A parity plan for a Vue map-component wrapper being brought up to
  MapTiler SDK parity — phases, owners, acceptance criteria, and four decisions
  the plan could not make: whether a MapTiler API key exists for QA's smoke
  test, whether the release is `6.0.0` or `2.0.0`, whether two v1 APIs are
  removed outright, and whether MapTiler's own Minimap/terrain/geocoding sit
  outside scope. No plan file; the run was conversational.

- **Skill:** `squad-product` 2.x, run as a child agent under a controller
  session.

- **Missed:** All four forks reached the user as four sentences at the end of a
  report — no options, no consequences, no defaults — and the run had already
  planned past them. The user's own words on seeing it: why does the squad ask
  and then answer itself.

  The cause is a runtime property no skill in the catalog stated. A role spawned
  as a child agent has no channel to the user: the host's question UI belongs to
  the controller session, so a question a child writes into its report is read
  by the lead and by nobody else. `requirements-and-unknowns.md`, under "Ask once, ask
  concretely", is good advice that was, in that execution mode, unfollowable —
  it says to ask, it gives the shape of a good question, and there was nothing
  to ask through. What the role did instead is the only thing left: label a
  default and keep going.

  What makes this a skill gap rather than a runtime limitation is that the
  recovery was available and unstated. The lead could have put all four to the
  user before the dependent phase started. Nothing told it to, because
  `HANDOFF-PLAN-001` binds what an accepted plan contains and nothing bound what
  happens to the choices the plan could not make. The return edge was missing,
  the same way every return edge stood before `HANDOFF-REPRO-001`.

  Two smaller things fell out of the same run. Prose is the wrong shape to hand
  a controller: turning those four sentences into a picker meant composing the
  options, which is authorship of the user's decision by whoever renders it. And
  a fork with no options and no recommendation is the one a user postpones —
  already this file's own advice, one section above where it was needed.

- **Candidate rule:** Landed rather than left open, because the gap is
  structural rather than a judgment call — the rule does not ask a role to
  decide better, it names a channel that does not exist and routes around it.
  `HANDOFF-DECISION-001` in `src/catalog/cross-skill-contract-clauses.ts`:
  each open fork as named options with their consequences, put to the user from
  the session that can ask and never answered by the role that raised it.
  Bound at all ten role entrypoints — the widest reach any clause in this
  catalog has, and deliberately so. The narrow version bound only the two ends
  of the plan edge, on the reasoning that framing is where forks surface; that
  reasoning does not survive the observation, because the missing channel is a
  property of running as a child agent rather than of sitting at a particular
  stage. Under the narrow clause, QA meeting an absent credential and Designer
  meeting an undecided brand direction would have gone on assuming. It is stated
  in `squad-product`'s handoff contract and `squads-team`'s hard gate 1,
  with the detail in `requirements-and-unknowns.md` (how to shape a fork, and
  what to do when this role has no channel) and
  `coordination-contract.md` section 5 (the lead puts it to the user; an unanswered
  fork blocks its phase the way a `NEEDS_*` verdict does).

- **Outcome:** Landed 2026-09-07 with every ceiling re-measured in the same
  change — ten skills, 25 to 32 median words each, recorded per key in
  `skill-payload-ceilings.ts`. One run of
  evidence, from one plan, and the gate proves only that the catalog stays
  consistent and sized: it does not establish that any plan got better. The
  claim worth testing on the next multi-role run is narrow — that a fork the
  controller can render is a fork the user actually answers.
