# Plan-bundle fixtures

One valid written plan bundle in the structure `squad-product` and the
`squads-team` lead produce when a user asks for a plan on disk:
`checkout-recovery/`. It is constructed, not recorded from a run — no shipped
plan produced it — and it is here for two jobs at once.

It is the positive case for `src/plans/`, validated by
`tests/plans/plan-bundle-validator.test.ts` on every `pnpm test`. The negative
cases are not fixtures: each one is this bundle copied to a temporary directory
and mutated in exactly one way, so a test names the rule it breaks instead of
asking a reader to diff two trees.

It is also the worked example the plan contract points at, which is why it
carries cases prose alone states badly — a `plan`-wide artifact beside
phase-owned ones, a handoff named `handoff-to-phase-02.md` rather than with the
prefix `phases/` reserves, a QA `PASS` and a Code Review `APPROVE` that record
the exact revisions they graded, an accepted phase with nothing left open, and a
phase held out of `accepted` by a pending user approval.

Keep it valid. A change to the structure that leaves this bundle passing has not
been checked against anything.
