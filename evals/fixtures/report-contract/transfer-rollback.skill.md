## QA verdict: FAIL

**Subject under test:** `.eval-runs/qa-baseline-260904/transfer-rollback/skill/subject.ts`
**Test file written:** `/Users/danhnguyen/Documents/Danh/BUILDER/squad-skills/.eval-runs/qa-baseline-260904/transfer-rollback/skill/produced.test.ts`
**Command / environment:** `node --test produced.test.ts` from that directory, Node v22.20.0 (native type stripping), no dependencies added.

### Observed result

```
# tests 5   # pass 3   # fail 2   (exit 1)
```

5 tests written. 3 pass, 2 fail — both failures are product defects, not test defects.

### Acceptance traceability

| Criterion | Tests | Result |
|---|---|---|
| Within-balance transfer commits both sides, resolves `true` | commits-both-sides (stage deltas + commit count + balances); whole-balance boundary (`amount === balance` must not read as insufficient) | PASS |
| Beyond-balance transfer declined, balances unchanged, resolves `false` | one-unit-over boundary; declined-transfer-waits-for-rollback | 1 PASS, 1 **FAIL** |
| A failing rollback reaches the caller | failing-rollback-reaches-caller | **FAIL** |

### Defect — single root cause, `subject.ts:18`

```ts
    ledger.rollback();   // returned Promise<void> is never awaited
```

Both failures come from this one missing `await`. Minimal repro is the two failing tests; expected vs actual:

1. **Decline reports before rollback completes.** With a `rollback()` that settles asynchronously (which its `Promise<void>` return type declares), `transfer` resolves `false` while the staged deltas are still in place. Expected: caller sees `false` only after balances are restored. Actual: at the moment the caller receives `false`, the ledger still shows `alice: -400, bob: 525`. The criterion "leaves both balances unchanged" is not met at the observable boundary.
2. **A failing rollback is reported as a clean decline.** When `rollback()` rejects, `transfer` resolves `false` and the rejection is dropped. Expected: rejection propagates (`assert.rejects`). Actual: `Missing expected rejection`. In production this floating rejection would also surface as a process-level `unhandledRejection`; my double attaches its own `.catch` so the failure stays attributable to its own test rather than crashing an unrelated one.

**Fix and confirmation:** changing line 18 to `await ledger.rollback();` makes all 5 tests pass. Verified on a scratch copy at `/private/tmp/.../scratchpad/verify/` — `subject.ts` in the work directory was not modified (`git status` clean; only `produced.test.ts` was created).

### Determinism notes

No sleeps. The ordering test uses a caller-controlled gate promise plus a `setImmediate` microtask flush, so "did `transfer` settle too early" is a deterministic observation rather than a timing race. Fixtures are per-test and self-contained.

### Residual risk (not asserted — no accepting criterion)

`amount = 0`, negative `amount` (which would pull funds from the recipient), `from === to`, non-integer amounts, and a failing `commit()`. The brief specifies no behavior for these, so asserting one would invent requirements. Worth a product decision, especially negative `amount`.

### Execution mode

Independent-agent QA: I authored no implementation code and did not modify `subject.ts`.

Status: DONE
Summary: Wrote 5 node:test tests covering all three acceptance criteria plus the funds boundary; observed 3 pass / 2 fail, both failures caused by the un-awaited `ledger.rollback()` at `subject.ts:18`, which makes a declined transfer report `false` before balances are restored and turns a failing rollback into a silent clean decline.