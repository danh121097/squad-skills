# Gate corpus

Paired sources with one seeded defect each, and the checks that separate them.

The two gate roles in the catalog — `squad-qa` and `squad-code-review` — are the
only ones whose output has ground truth. Proving a build role wrote better code
needs a judge. Proving a gate got better needs only a planted defect and the
question of whether the gate found it. That is what this corpus supplies, and
both planned lanes read the same cases:

- **QA** is handed `brief.md` and `buggy.ts` and writes a test. The test must
  fail against `buggy.ts` and pass against `fixed.ts`. One that passes against
  both asserts nothing, which is the failure mode a weak QA run ships.
- **Code Review** is handed `buggy.ts` and graded on recall against the defect
  in `defect.yml` and precision against findings that match nothing in it.

`defect.yml` is never shown to the skill under evaluation. It is the answer key.

## A case

| File                  | What it is                                                           |
| --------------------- | -------------------------------------------------------------------- |
| `brief.md`            | The acceptance criteria the skill is given. No defect hint.          |
| `buggy.ts`            | The subject under evaluation, carrying one seeded defect.            |
| `fixed.ts`            | The same module with that defect repaired, and nothing else changed. |
| `reference-checks.ts` | The checks a correct test would make, named individually.            |
| `defect.yml`          | The answer key: defect class, location, and which checks catch it.   |

`tests/eval/gate-corpus.test.ts` runs the reference checks against both sources
on every `pnpm test`. Every check must pass against `fixed.ts`, exactly the
checks named in `detected_by` must fail against `buggy.ts`, and `detected_by`
plus `survives` must account for every check. A seeded defect nothing detects is
not a defect, and an answer key that drifts from the checks beside it is worse
than none.

Each case deliberately keeps checks that pass against both sources. They are the
happy path a weak test stops at, and they are what a precision measure needs.

## Cases

| Case                     | Defect class                      | Why this class                                                       |
| ------------------------ | --------------------------------- | -------------------------------------------------------------------- |
| `pagination-clamp`       | boundary-condition                | Clamped at one end only; the happy path is untouched.                |
| `transfer-rollback`      | unawaited-promise                 | The dropped rejection is invisible until the rollback fails.         |
| `document-authorization` | broken-object-level-authorization | The write path checks presence where the read path checks ownership. |

Adding a case means adding those five files and nothing else; the corpus test
discovers directories rather than reading a list.
