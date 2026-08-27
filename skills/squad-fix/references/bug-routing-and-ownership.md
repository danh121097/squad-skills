# Bug routing and ownership

Read after initial scouting and before assigning implementation. The visible failure surface is evidence,
not ownership proof.

## Routing matrix

| Proven root cause | Implementation owner | Typical evidence |
|---|---|---|
| Web component, browser state, client form/navigation/cache/rendering | Frontend | browser repro, client trace, component/state path |
| Server API, auth/authz, shared contract, DB/query/transaction, queue/job | Backend | request/server trace, contract/schema/query evidence |
| App navigation/state/lifecycle/offline/sync/native integration | Mobile | device/emulator repro, lifecycle/native logs |
| Pipeline, container, IaC, cloud, DNS/IAM/secrets wiring, rollout | DevOps | CI job, manifest/plan/provider/runtime evidence |
| Test/fixture/runner defect with correct production behavior | QA for assigned test files | production contract plus test-only failure path |
| Material UX flow/hierarchy/interaction decision exposed by repair | Designer contract, then Frontend/Mobile implementation | accepted design gap or required behavior change |

QA may reproduce, minimize and identify subsystem evidence but never fixes production implementation. Code
Review verifies and gates but never owns the feature fix.

## Route by cause, not symptom

- A button showing “failed” may be a Frontend render bug, Backend error contract bug, authorization defect,
  or a deployment/config failure. Trace the request and state transition before assigning it.
- A mobile crash after an API response may belong to Mobile parsing or Backend contract compatibility.
- A failed integration test may expose production behavior, fixture drift, environment failure or a test bug.
- A CI compile failure belongs to the build role when its code is invalid; it belongs to DevOps when the
  pipeline/toolchain/configuration path is broken.

When two contracts are independently broken, assign separate non-overlapping slices. When one root cause
creates downstream symptoms, keep one owner and let consumers verify compatibility rather than duplicating
fixes at each symptom.

## Test-file ownership

The build role owns co-located unit/contract/regression tests in its assigned slice. QA owns dedicated
scenario, E2E, exploratory automation, performance and QA-harness files only when assigned. One owner edits
a file at a time; QA returns a missing build-owned test case to the owner or accepts an explicit serialized
reassignment.

## Designer trigger

Do not trigger Designer for a typo, broken token reference, overflow regression, missing focus state or
other repair that clearly follows accepted Figma/local patterns. Trigger Designer when the repair requires
a new flow, changes hierarchy/navigation, introduces a new interaction model, or resolves conflicting UX
requirements without an accepted source.

## Relationship with squads-team

`squad-fix` is the issue-centric diagnosis/router. `squads-team` is the general multi-role execution
orchestrator.

- Start with `squad-fix` for a concrete failure whose owner/cause is unknown.
- After diagnosis, use `squads-team` only when multiple independent role slices justify coordination.
- When `squad-fix` runs inside an existing `squads-team` session, return diagnosis, ownership and dependencies
  to that lead; do not invoke another orchestrator.
- Use `squads-team` directly for feature/refactor/release scope that merely contains bugfixes among broader
  work. Do not disguise a net-new feature as a fix.
