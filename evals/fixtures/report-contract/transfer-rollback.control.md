Wrote `/Users/danhnguyen/Documents/Danh/BUILDER/squad-skills/.eval-runs/qa-baseline-260904/transfer-rollback/control/produced.test.ts` — 6 tests using only `node:test` + `node:assert/strict`, with a hand-built two-phase `Ledger` double (settled balances + staged deltas; `read` returns settled + pending so the subject's post-stage overdraft check is meaningful).

**Observed result of `node --test produced.test.ts`: 6 tests, 4 pass, 2 fail (exit code 1).**

Passing (AC 1 and 2 hold):
1. In-balance transfer commits both sides, resolves `true`
2. Transfer draining sender to exactly `0` commits (boundary — the check is `< 0`, not `<= 0`)
3. Over-balance transfer resolves `false`
4. Declined transfer leaves both balances unchanged, calls `rollback`, never calls `commit`

Failing — both trace to one real defect in `subject.ts` line 18:

```ts
if (ledger.read(from) < 0) {
  ledger.rollback();   // not awaited
  return false;
}
```

5. `waits for the rollback to finish before resolving false` — with a rollback that settles on a later microtask, `transfer` resolves while both deltas (`alice: -100`, `bob: +100`) are still staged. The function returns before the rollback it initiated has completed.
6. `surfaces a failed rollback to the caller instead of reporting a clean decline` — this is AC 3 and it is not met. With a rejecting `rollback`, `transfer` resolves `false` (`Missing expected rejection`), so the caller is told the transfer was cleanly declined. The runner additionally reports: the floating rejection escaped as an `unhandledRejection` after the test ended, which in production would be a process-level crash rather than an error the caller can handle.

Fix would be `await ledger.rollback();` — that satisfies both failing tests without touching the passing four. I did not modify `subject.ts`, and no other files were created.

Status: DONE
Summary: Wrote 6 Node-test cases against the brief's three acceptance criteria; 4 pass and 2 fail, both failures isolating the un-awaited `ledger.rollback()` on line 18 of subject.ts, which breaks AC 3 (a failed rollback is reported to the caller as a clean `false` and escapes as an unhandled rejection).