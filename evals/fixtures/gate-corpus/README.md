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

## What makes a case worth running

A case earns its place by separating a careful run from a careless one. The
first three did not, and the way they failed is worth stating so the next case
avoids it.

`pagination-clamp`'s brief says, in as many words, "A page number below 1 serves
the first page." That hands over the defect. When it was run against an arm
carrying no skill at all, that arm wrote the clamp tests, flagged the missing
`Math.max` unprompted, and scored exactly as the skill-loaded arms did. The case
measured whether the model can read a brief, which was never in question.

So a discriminating case needs all three:

- **The brief states behavior, not boundaries.** The risk set has to be derived
  from the domain. Enumerate the edge case and every arm passes.
- **The obvious edge case survives.** If the first redelivery test a reader
  thinks of already fails against `buggy.ts`, the case stops at that reader.
- **The defect is not one visible line in a short file.** Reading twelve lines
  is not the skill under test.

`survives` is where this shows. A case whose `survives` list is only the happy
path is probably measuring reading comprehension.

### Precision is the second axis

The oracle has two halves — fail on `buggy.ts`, pass on `fixed.ts` — and only the
first is about noticing the defect. The second catches the opposite error: a run
that derives its expectations from the code in front of it rather than from the
brief. Such a run reads `buggy.ts`'s control flow as the specification, and the
correct implementation then violates it.

`duplicate-webhook-delivery` turned out to separate arms on that half rather than
on detection. Both arms caught the race on `buggy.ts`. Both then failed
`fixed.ts`: one asserted that the event is recorded only after the charge settles
and that a failed charge leaves it retryable — neither is in the brief, and both
contradict the brief's own contract for `claim`; the other asserted, inside an
otherwise behavioral happy-path test, that `markProcessed` was the method called.
A case that only measures detection cannot see either mistake.

### When the arms disagree with the fix, check the fix first

`display-name-truncation` shipped with a `fixed.ts` that counted code points.
Both arms failed it on a base letter plus a combining accent, and both were
right: the brief asks for characters "counted the way a reader counts them",
which is graphemes. The fix is now `Intl.Segmenter`, and the two combining-mark
checks that exposed it are part of the case.

An oracle that cannot separate `buggy.ts` from `fixed.ts` is the thing to repair.
Read nothing about an arm until it can.

## Cases

| Case                         | Defect class                      | Why this class                                                                       |
| ---------------------------- | --------------------------------- | ------------------------------------------------------------------------------------ |
| `pagination-clamp`           | boundary-condition                | Clamped at one end only; the happy path is untouched. Known not to discriminate.     |
| `transfer-rollback`          | unawaited-promise                 | The dropped rejection is invisible until the rollback fails.                         |
| `document-authorization`     | broken-object-level-authorization | The write path checks presence where the read path checks ownership.                 |
| `duplicate-webhook-delivery` | check-then-act-race               | Sequential redelivery passes; only two deliveries in flight separate the two stores. |
| `display-name-truncation`    | encoding-unit-mismatch            | Every ASCII assertion passes; the risk is in the data domain, not in the parameters. |

Adding a case means adding those five files and nothing else; the corpus test
discovers directories rather than reading a list.
