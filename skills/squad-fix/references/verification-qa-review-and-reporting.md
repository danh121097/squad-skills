# Verification, QA, Review, and reporting

Read before completion or whenever verification reveals a side effect, missing environment or uncertain
review evidence.

## Verification layers

1. Rerun the exact pre-fix reproduction or static proof.
2. Run the focused regression test/check that protects the repaired invariant.
3. Test the blast radius: affected modules, callers/consumers, contracts, permissions, data/lifecycle/timing
   paths and supported platforms relevant to the defect.
4. Run type/lint/build and integration/performance/security/operations checks when the changed contract or
   risk requires them.
5. Confirm no unrelated public contract, schema, environment/config key or user workflow changed silently.

Report static, local, browser/device, integration, CI, staging and production evidence separately. A lower
verification level can be sufficient for a low-risk bug, but it must never be described as a higher level.

## Regression ownership

The build role owns regression tests co-located with its implementation slice. QA owns only explicitly
assigned scenario/E2E/performance/harness files. One owner edits each file at a time; QA returns a needed
build-owned case to the owner or accepts a serialized reassignment.

## QA gate

- `PASS`: acceptance and material-risk evidence passed; list environment, checks and residual risk.
- `FAIL`: evidence proves a defect/unmet criterion; provide minimal repro, expected/actual, owner and retest
  scope.
- `NEEDS_ENVIRONMENT`: a required target/artifact/access is unavailable; name it and the smallest next
  action. It blocks `done` without claiming product failure.

After a fix for QA FAIL, rerun the affected and regression scope before changing verdict.

## Code Review gate

- `APPROVE`: no blocking finding; list evidence and residual risk.
- `CHANGES_REQUESTED`: a verified blocker returns to the implementation owner, then QA, then Review.
- `NEEDS_EVIDENCE`: target/QA/contract/docs/runtime evidence is insufficient for a defensible verdict; name
  the exact gap and return it to the lead. It blocks `done` without inventing a defect.

In one session, QA and Review are fresh logical passes but not independent-agent judgments. State this in
the final report. Never call self-checks independent.

## Side effects and scope

If verification exposes a regression or required contract change outside accepted scope, stop and present
the evidence, cause and concrete options. Do not silently expand the fix. Commit, push, PR, deploy, data
mutation and external tracking remain separate authorizations.

## Final report

Include:

- symptom, expected/actual, root cause and why now;
- implementation owner(s), files/contracts changed and prevention;
- pre/post reproduction plus focused and blast-radius evidence;
- QA and Review verdicts with execution/independence mode;
- anything not verified, residual risk and exact next action;
- docs impact and task-owned process/resource cleanup;
- authorized external mutations performed, if any.
