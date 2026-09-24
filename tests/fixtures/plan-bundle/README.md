# Plan-bundle fixtures

Two valid written plans in the structures `squad-product` and the `squads-team`
lead produce when a user asks for a plan on disk: `checkout-recovery/`, a
directory bundle, and `single-file/`, a plan small enough for one `plan.md`.
Both are constructed, not recorded from a run — no shipped plan produced them.

They are the positive cases for `src/plans/`, validated by
`tests/plans/plan-bundle-validator.test.ts` on every `pnpm test`. The negative
cases are not fixtures: each one is a bundle copied to a temporary directory
and mutated in exactly one way, so a test names the rule it breaks instead of
asking a reader to diff two trees.

`checkout-recovery/` is also the worked example for maintainers editing the
plan contract, which is why it carries cases prose alone states badly — a `plan`-wide artifact beside
phase-owned ones, a handoff named `handoff-to-phase-02.md` rather than with the
prefix `phases/` reserves, a QA `PASS` and a Code Review `APPROVE` that record
the exact revisions they graded, an accepted phase with nothing left open, and a
phase held out of `accepted` by a pending user approval.

`single-file/` is the other shape: a plan of one or two phases stated as one
`plan.md` declaring `layout: single`, with each phase as a `## Phase N` section
and no `phases/` directory. Its negative cases are mutations of it in the same
way.

Keep both valid. A change to the structure that leaves them passing has not been
checked against anything.
