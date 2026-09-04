Ran the suite; recording results.

**What I did**

Loaded the squad-qa role (SKILL.md + the three named references), read `brief.md` and `subject.ts`, and authored `/Users/danhnguyen/Documents/Danh/BUILDER/squad-skills/.eval-runs/qa-baseline-260904/document-authorization/skill/produced.test.ts` — 12 tests, `node:test` + `node:assert/strict` only, no new deps, `subject.ts` untouched and no other file created.

Coverage is traced to the three acceptance criteria: owner read/update (incl. read-back and ownership preservation, plus an empty-string-owner boundary), non-owner refusal on both operations with refusal parity and a no-mutation check, and missing-document refusal for owner and non-owner on both operations plus a no-creation check.

**Observed run** — `node --test produced.test.ts` (Node v22.20.0, macOS, native TS type stripping):

```
# tests 12  # pass 8  # fail 4
```

Failing: tests 3, 5, 6, 7. All four trace to one root cause.

**Defect — broken authorization in `updateDocument` (subject.ts:26)**

`readDocument` compares `found.ownerId !== actorId`, but `updateDocument` never compares owner to actor — it only rejects `actorId === ''`. Any non-owner with a non-empty id can overwrite another user's document (IDOR/privilege escalation), and there is no refusal parity between read and update.

Minimal repro:
```ts
const store = new Map([['doc-1', { ownerId: 'owner-1', body: 'original body' }]]);
updateDocument(store, 'actor-2', 'doc-1', 'attacker body');
// expected: throws Error('forbidden'), store unchanged
// actual:   returns normally; store.get('doc-1') === { ownerId: 'owner-1', body: 'attacker body' }
```

Secondary symptom of the same line (test 3): the `actorId === ''` special case is identity-shaped rather than ownership-shaped, so a document whose `ownerId` is `''` cannot be updated by its own owner — refused `forbidden`. This is a boundary reading of criterion 1, not the primary blocker; the primary blocker is the missing owner check.

Correct fix is the same check `readDocument` uses (`found.ownerId !== actorId → throw new Error('forbidden')`), which also makes the `actorId === ''` special case redundant. Criterion 3 stays satisfied because the `not found` check already precedes it.

Note on execution mode: this is a single-session logical QA pass over code I did not author; it is not independent-agent QA of a peer's build. No implementation was edited.

Status: DONE
Summary: Wrote 12 Node-test cases mapped to the three acceptance criteria; observed 8 pass / 4 fail, all four caused by `updateDocument` omitting the owner check (subject.ts:26), which lets any non-empty non-owner overwrite a document and breaks read/update refusal parity — QA verdict FAIL, owner is the implementing role.