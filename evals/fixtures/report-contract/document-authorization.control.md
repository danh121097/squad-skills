Wrote 11 tests and ran them. Type stripping works natively on this Node (v22.20.0), no flags needed.

**File:** `/Users/danhnguyen/Documents/Danh/BUILDER/squad-skills/.eval-runs/qa-baseline-260904/document-authorization/control/produced.test.ts`

**Observed result:** `# tests 11 / # pass 8 / # fail 3` (exit code 1)

**Failing tests — all trace to one real bug in `subject.ts`:**

`updateDocument` never compares the actor to the owner. It has

```ts
if (actorId === '') throw new Error('forbidden');
```

where it should be `if (found.ownerId !== actorId)`. The empty-string check is a stand-in that only refuses an anonymous actor; any other named actor passes straight through to `store.set`.

Consequences the three failures document:
1. `non-owner updating is refused as forbidden` — no exception thrown at all ("Missing expected exception").
2. `a refused update by a non-owner leaves the stored document untouched` — the stranger's write lands; `body` becomes `'hijacked body'` while `ownerId` stays `'user-owner'`. Silent data corruption, not just a missing guard.
3. `read and update give a non-owner the same refusal` — read throws `'forbidden'`, update returns normally, so acceptance criterion 2's "same refusal in both cases" is violated.

**Passing behavior (correct in the subject):** owner read, owner update with ownership preserved, non-owner read refused as `'forbidden'`, missing-document read and update both refused as `'not found'` regardless of actor, and a refused update on a missing id does not create an entry (`store.size` stays 2).

Note on ordering: both functions check existence before authorization, so a non-owner probing a missing id gets `'not found'` rather than `'forbidden'`. That is an existence oracle, but the brief explicitly requires it ("A missing document is refused as not found, whoever asks"), so I tested it as specified rather than flagging it as a defect.

Status: DONE
Summary: Wrote 11 tests against the brief's three acceptance criteria; observed 8 pass / 3 fail, with all three failures pinpointing a missing ownership check in `updateDocument` that lets any non-empty actor overwrite another user's document body.