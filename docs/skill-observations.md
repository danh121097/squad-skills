# Skill observations

What a squad skill got wrong, or missed, on real work — and the rule that would
have prevented it. An entry is evidence, not an edit: its candidate rule is
skill content and ships only through `pnpm test` plus maintainer review, like any
other change.

Report a problem through the
[skill output problem](https://github.com/danh121097/squad-skills/issues/new?template=skill-feedback.yml)
form; a maintainer records confirmed ones here, newest at the bottom.

## Template

```markdown
## N. <short name> — YYYY-MM-DD

- **Built:** what real work was produced, on what stack
- **Skill:** `<skill>` <version>
- **Missed:** what the output got wrong, concretely enough to recognise
- **Candidate rule:** the rule, and the skill reference that would own it
- **Outcome:** open | landed <date> in <file> | declined — why
```

## 1. Framing concluded the work should not be built — 2026-09-07

- **Built:** framing whether to add a `squad-architect` role to this catalog.
- **Skill:** `squad-product` 1.0.0
- **Missed:** no shape for a framing that concludes "build nothing"; no rule to
  re-check evidence inside a plan written earlier.
- **Candidate rule:** a no-plan conclusion carries the same evidence as a plan;
  earlier plan evidence is a claim with a date → `framing-and-acceptance-criteria.md`
- **Outcome:** second rule landed 2026-09-07 in `framing-and-acceptance-criteria.md`;
  first declined — the plan's own stop condition already carried it.

## 2. Framing an empty repository whose stack is already decided — 2026-09-07

- **Built:** framing `ecommerce-erp`, an empty directory with a brainstorm that
  fixed the stack (Next 16, Express 5, Tailwind 4, Zod 4, Mongoose) and seven
  checkable criteria, but no phases naming an owning role.
- **Skill:** `squad-product` 1.0.0
- **Missed:** a request can arrive **partly framed** — the skill only knew
  "needs framing" or "already framed", so a run either re-framed what the user
  settled or routed an incomplete frame onward for `squads-team` to reject. And
  an empty repository with a decided stack still has no owner for the
  scaffolding slice, which spans every layer at once.
- **Candidate rule:** record what is framed as given, produce only the missing
  part, and name the clause the gap was measured against →
  `framing-and-acceptance-criteria.md`. The scaffolding slice is its own phase
  with a default owner (the lead owns the workspace root) →
  `scope-phasing-and-sequencing.md`.
- **Outcome:** scaffolding rule landed 2026-09-07 in `scope-phasing-and-sequencing.md`;
  partial framing landed 2026-09-24 in `framing-and-acceptance-criteria.md` and
  `squad-product` gate 2.

## 3. The first selection under DECISION-RECORD-001 — 2026-09-07

- **Built:** a frontend stack and rendering-model selection for `ecommerce-erp`
  (Next.js 16 App Router, RSC shell with TanStack Query islands).
- **Skill:** `squad-frontend`, `frontend-stack-and-motion-selection.md` §5 and §8
- **Missed:** nothing in frontend. Stating "what would reopen it" surfaced that
  the deployment target — filed as a backend-only unknown — also decides what
  the RSC shell can do, and that a browser-side auth refresh cannot serve RSC
  data fetching.
- **Candidate rule:** if a second run repeats it, an unknown records every role
  its answer changes, not the first one that noticed →
  `squad-product/references/requirements-and-unknowns.md`
- **Outcome:** open — waiting for a second run.

## 4. Three parallel role slices on one empty repository — 2026-09-07

- **Built:** the scaffolding slice of `ecommerce-erp`, run by `squads-team` with
  backend, frontend and devops in parallel under non-overlapping file ownership.
- **Skill:** `squads-team` 1.0.0, `squad-qa` 1.1.0, three build roles
- **Missed:** the lead never checked the seam between slices: frontend flagged
  that `apps/web/Dockerfile` bakes `NEXT_PUBLIC_API_URL`, which the app never
  reads, and devops never saw it — every gate stayed green. Two other seams held
  only because a role read the other's artifact. Separately, the one test proving
  tenant isolation was guarded by `describe.skipIf(!DATABASE_URL)`, never ran,
  and the suite still read "0 failed".
- **Candidate rule:** integration checks what one slice supplies against what the
  other consumes, on the artifacts, not the reports →
  `squads-team/references/delivery-pipeline-and-roster.md`. A criterion whose
  evidence did not execute is unevidenced and reported at the same volume as a
  failure → `squad-qa`.
- **Outcome:** landed 2026-09-24: the seam check in the pipeline's integration
  section and the team workflow; the unevidenced rule in `squad-qa` gate 1 and
  its quality bar.

## 5. Open forks arrived as bullets from a child agent — 2026-09-07

- **Built:** a parity plan for a Vue map wrapper, run as a child agent.
- **Skill:** `squad-product` 2.x
- **Missed:** four decisions reached the user as prose at the end of a report,
  already answered by defaults; a child agent has no channel to the user.
- **Outcome:** landed 2026-09-07 as `HANDOFF-DECISION-001` at all ten entrypoints:
  each open fork goes to the lead as named options with consequences, and the
  session that can ask puts it to the user. Shortened 2026-09-24 to one line: "each open
  fork goes to the lead, or to the user when run on its own, as named options
  with their consequences, and only the user answers it".

## 6. An external catalog read against this one — 2026-09-09

- **Built:** none — comparative read of `github.com/mattpocock/skills`.
- **Skill:** `squads-team` 2.9.1, gated by `squad-qa` and `squad-code-review`
- **Missed:** no red-capable reproduction loop before hypothesising in
  `squad-fix`; spec compliance merged with other review dimensions in
  `squad-code-review`; no context-lifecycle or peer-invocation rule in
  `squads-team`.
- **Outcome:** landed 2026-09-09 in `diagnosis-root-cause-and-fix-loop.md`,
  `review-runtime-and-verdict.md` and `coordination-contract.md`. An eleventh
  router skill was declined; the need landed as the "Choosing a skill" table in
  `README.md`.

## 7. The plan bundle's file tree read as a manifest — 2026-09-09

- **Built:** a requested plan bundle for a greenfield SaaS monorepo, then its
  first phases.
- **Skill:** `squad-product`, version unknown
- **Missed:** the bundle reached 67k words across 32 files against 3.5k lines of
  source — 83% in optional slots — because the contract drew a tree naming
  eleven files and the run filled every one, including ADRs for decisions the
  plan still listed as pending.
- **Outcome:** landed 2026-09-09: `artifacts/`, `adr/` and `references/` became
  slots that stay absent until they hold something.
