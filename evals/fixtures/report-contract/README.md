# Report-contract fixtures

Six QA reports, produced 2026-09-04 by an A/B run over
`evals/fixtures/gate-corpus/`. Three arms loaded `squad-qa`'s `SKILL.md` and the
three references of its `scenario-design-and-run` task; three got only the brief
and the code under test. No arm saw `fixed.ts`, `defect.yml`, or
`reference-checks.ts`.

**These files are verbatim model output and must never be edited.** They are the
validation data for `src/eval/role-report-contract.ts`, and their whole value is
that they were written before that checker existed — nothing in them was shaped
to satisfy it. Editing one to make a check pass destroys the only evidence that
the check measures anything. Add a new fixture instead.

| File                                | Arm     | Case                              |
| ----------------------------------- | ------- | --------------------------------- |
| `pagination-clamp.skill.md`         | skill   | boundary condition                |
| `pagination-clamp.control.md`       | control | boundary condition                |
| `transfer-rollback.skill.md`        | skill   | unawaited promise                 |
| `transfer-rollback.control.md`      | control | unawaited promise                 |
| `document-authorization.skill.md`   | skill   | broken object-level authorization |
| `document-authorization.control.md` | control | broken object-level authorization |

What they showed, and why the checker exists: all six produced tests caught their
seeded defect, so the deterministic catch/miss gate separated nothing. The
reports did separate. Four of the five contract elements and the verdict are
present in every skill arm and absent from every control arm.

`acceptance-traceability` is satisfied by all six and separates neither. It stays
in the contract because the contract's job is to check a report against what
`squad-qa` requires, not to win an A/B — and because both arms doing it is a
finding about that element, not a fault in it.

Two skill arms are missing elements their own checklist requires:
`document-authorization.skill.md` states neither determinism nor residual risk.
That is a real gap in skill adherence, kept visible rather than corrected.
