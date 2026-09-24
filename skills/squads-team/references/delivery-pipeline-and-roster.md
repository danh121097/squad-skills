# Delivery pipeline and roster

Read before routing roles or advancing any slice through Design, QA, Review, integration or done.

## 1. Role boundary matrix

| Role        | Delivers                                                                                                                                         | Must not absorb                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Product     | Outcome, constraints, non-goals, checkable acceptance criteria, the scope cut, and phases that name required roles and distinct responsibilities | Stack/architecture/UI decisions, implementation, file or agent-instance assignment, gates |
| Designer    | UX flow, IA, hierarchy, tokens, states, responsive, motion, accessibility, and the presentational components that render them                    | State, data, API, routing, platform lifecycle                                             |
| Frontend    | Web UI, client state/forms/navigation, Backend API integration, a11y/performance                                                                 | Server APIs, shared DB/business logic, infra                                              |
| Backend     | Shared APIs/contracts, auth, DB/data access, server business logic, migrations                                                                   | Web/mobile UI, deployment pipelines                                                       |
| Mobile      | App UI/navigation, client logic, API integration, persistence/offline/sync, device concerns                                                      | Shared server APIs/DB/business logic, web UI                                              |
| DevOps      | Containers, CI/CD, IaC, cloud, secrets wiring, observability, rollout/rollback                                                                   | Feature/app code                                                                          |
| QA          | Observable-behavior scenarios, assigned tests/fixtures, execution, repro, evidence and PASS/FAIL/NEEDS_ENVIRONMENT                                | Production implementation, broad implementation-quality review, closing work              |
| Code Review | Implementation-quality review, focused finding verification and APPROVE/CHANGES_REQUESTED/NEEDS_EVIDENCE                                         | Replaying QA coverage, feature fixes, self-approval                                        |

Named `squad-*` skills are preferred when installed. The role must load its `SKILL.md` plus task-relevant
deep references; merely naming the skill is not enough. When absent, the lead gives the role this matrix,
the acceptance/ownership/evidence contract and the relevant section of `domain-coverage-contracts.md`.
Pair installed specialist skills with the role that needs them; none of them are required. Designer
and the build roles consult a design-intelligence skill as reference data for UI/UX decisions, resolved by
capability from the live catalog — `ui-ux-pro-max` here — and never delegate a screen to it.

### Designer-to-build handoff

The designer hands over presentational component code, not a written spec, with props and slots left open
for the consumer to bind. Behavior belongs downstream: state, data fetching, API integration, routing,
forms submission, and platform lifecycle stay with the build role. Frontend and Mobile wire behavior into the components they receive; a
visual or interaction gap returns to Designer instead of being redesigned inside the slice.

## 2. Automatic routing

- Concrete bug/regression/failing test with unproven cause or owner → `squad-fix` diagnosis/routing stage
  when installed; otherwise perform the same baseline → scout → root-cause proof inline. `squad-fix` is a
  workflow controller, not an implementation role.
- Idea, outcome or vague ask carrying no checkable acceptance criteria, or an empty repository → Product
  before any other role. It declares the role capabilities each phase needs, returns the plan and stops; it
  never selects agent instances, assigns a live slice or advances a gate.
- A design decision the user's material and the existing system leave open → Designer before
  Frontend/Mobile; one build owner with no design-system change does the presentational work inline.
- Web UI/client logic/API consumption → Frontend.
- Server API/shared contract/auth/data/server logic → Backend.
- App UI/client logic/offline/device/API consumption → Mobile.
- CI/container/IaC/cloud/deploy/observability → DevOps.
- Completed `standard` or `high` implementation → QA; QA PASS → Code Review. `light` closes on the
  owner's combined verify.

Do not spawn roles with no real slice. Split cross-role work by contract boundary. Backend publishes the
shared contract; clients consume it. Contract mismatch returns to Backend instead of being reimplemented
inside clients.

## 3. Pipeline

```text
[Diagnose first for bugs] → [Design when needed] → [Plan approval when requested]
→ IMPLEMENT → verify by tier → INTEGRATE → done
```

The lead names the gate tier in one line before building. `light` is one owner and no change to a public
contract, auth, data or migration, infrastructure or a dependency; the owner closes it with one combined
verify pass — the relevant build, type, lint and test commands, the behavior observed, and a self-review of
the diff — labelled non-independent. `standard` is the default and runs QA then Code Review, as logical
passes when one session runs both. `high` is a fixed list, not a judgment — auth or permissions, payment,
data or migration, production infrastructure or secrets, data deletion — and runs both as independent agents
where the runtime allows. When in doubt, take the higher tier.

Hard rules:

- Build role reports completion but never self-approves a `standard` or `high` slice.
- QA `PASS` advances; `FAIL` returns to owning build role with minimal repro. Code Review runs only after
  QA PASS.
- `CHANGES_REQUESTED` returns to owner, then requires affected/regression QA and focused Review rerun;
  broaden either pass only when the changed contract or risk surface requires it. A warning or suggestion
  is listed but never requests changes on its own.
- Each gate unit returns to its owner at most twice. A third `FAIL` or `CHANGES_REQUESTED` stops the loop:
  the lead receives it as `BLOCKED` with the evidence and puts two to four options to the user.
- `NEEDS_ENVIRONMENT` or `NEEDS_EVIDENCE` returns to the lead for one resolution of the exact missing
  target, artifact, access or evidence, then the gate resumes. Never an inferred pass. Still missing, stop
  as blocked with the next action; do not mislabel the gap as a product defect.
- No slice or integrated result is done without its tier's verify: PASS then APPROVE above `light`.
- A change to structure or contract after a gate marks the recorded verdict superseded and requires QA then
  Code Review again. This holds whether the verdict lives in a prose handoff or in a written plan bundle.
- QA never edits production implementation; Reviewer never implements fixes.

In single-session mode, these are separate logical passes and the reduced independence must be disclosed.

## 4. Integration

The lead resolves contract and merge conflicts under explicit ownership, runs combined relevant checks,
and distinguishes per-slice success from integrated success. Check every seam on the artifacts rather than
the reports: what one slice supplies against what the other consumes — an env var one bakes and the other
reads, a route, a schema, a port. Green gates on both sides do not prove the seam. On an empty repository
the lead owns the root workspace layout — package boundaries, task runner, shared TS and lint base — since
that is what makes one owner per file assignable; each package inside it is scaffolded by its layer's role.
Update durable docs only for user-visible behavior, setup/commands, configuration, contracts, architecture,
security or operations changes.

Commit, push, PR, deploy and external tracking are separate authorizations. Do not infer them from a
request to implement or orchestrate.

## 5. Final report

The report is as long as the work. A `light` result is three lines: the outcome, the verify commands that
ran, and the residual risk. A `standard` or `high` result includes:

- outcome and acceptance result;
- execution mode and whether gates were independent agents or single-session passes;
- role/ownership map and integrated artifacts;
- test/build/security/deploy evidence at the level actually verified;
- QA and Code Review verdicts;
- unresolved NEEDS_* owner, required next action and blocked/not-done state, when applicable;
- docs impact, residual risks and unresolved questions;
- external mutations performed, if any, with scope.
