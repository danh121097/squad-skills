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
| QA          | Observable-behavior scenarios, assigned tests/fixtures, execution, repro, evidence and PASS/FAIL/NEEDS_ENVIRONMENT                               | Production implementation, broad implementation-quality review, closing work              |
| Code Review | Implementation-quality review, focused finding verification and APPROVE/CHANGES_REQUESTED/NEEDS_EVIDENCE                                         | Replaying QA coverage, feature fixes, self-approval                                       |

Named `squad-*` skills are preferred when installed; the role loads its `SKILL.md` plus task-relevant
references. When absent, the lead gives the role this matrix, the acceptance/ownership/evidence contract and
the relevant section of `domain-coverage-contracts.md`.

### Designer-to-build handoff

The designer hands over presentational component code, not a written spec, with props and slots left open
for the consumer to bind. Behavior belongs downstream: state, data fetching, API integration, routing,
forms submission, and platform lifecycle stay with the build role. A visual or interaction gap returns to
Designer instead of being redesigned inside the slice.

## 2. Automatic routing

- Concrete bug/regression/failing test with unproven cause or owner → `squad-fix` diagnosis/routing stage
  when installed; otherwise perform the same baseline → scout → root-cause proof inline. `squad-fix` is a
  workflow controller, not an implementation role.
- A request that meets the Product trigger in gate 1 of `SKILL.md` → Product before any other role. It
  declares the role capabilities each phase needs, returns the plan and stops; it
  never selects agent instances, assigns a live slice or advances a gate.
- A design decision the user's material and the existing system leave open → Designer before
  Frontend/Mobile. With no such decision, one build owner with no design-system change does the
  presentational work inline.
- Web UI/client logic → Frontend; server API/contract/auth/data → Backend; app UI/offline/device → Mobile;
  CI/container/IaC/cloud/deploy/observability → DevOps.

Do not spawn roles with no real slice. Split cross-role work by contract boundary. Backend publishes the
shared contract; clients consume it. Contract mismatch returns to Backend instead of being reimplemented
inside clients.

## 3. Pipeline

```text
[Diagnose first for bugs] → [Design when needed] → [Plan approval when requested]
→ IMPLEMENT → verify by tier → INTEGRATE → done
```

Tiers, verdicts and return limits are gate 4 of `SKILL.md`. A `light` verify pass is the relevant build,
type, lint and test commands, the behavior observed, and a self-review of the diff, labelled non-independent.
`standard` runs as logical passes when one session runs both gates.

Additional rules:

- A build role never self-approves a `standard` or `high` slice; a warning or suggestion is listed but never
  requests changes on its own.
- The lead sends an approved unit's warnings to the owner only when the user asks.
- `NEEDS_*` is never an inferred pass or a product defect; still missing after one resolution, stop as
  blocked with the next action.
- A change to structure or contract after a gate voids its verdict; both gates run again.
- QA never edits production implementation; Reviewer never implements fixes.

In single-session mode these are separate logical passes and the reduced independence must be disclosed.

## 4. Integration

The lead resolves contract and merge conflicts under explicit ownership, runs combined relevant checks,
and distinguishes per-slice success from integrated success. Check every seam on the artifacts rather than
the reports: what one slice supplies against what the other consumes — an env var one bakes and the other
reads, a route, a schema, a port. Green gates on both sides do not prove the seam. On an empty repository
the lead owns the root workspace layout — package boundaries, task runner, shared TS and lint base — since
that is what makes one owner per file assignable; each package inside it is scaffolded by its layer's role.
Update durable docs only for user-visible behavior, setup/commands, configuration, contracts, architecture,
security or operations changes.

## 5. Final report

The report is as long as the work. A `light` result is three lines: the outcome, the verify commands that
ran, and the residual risk. A `standard` or `high` result adds the acceptance result, execution mode and
whether gates were independent agents or single-session passes, the role/ownership map, evidence at the
level actually verified, QA and Code Review verdicts, any unresolved `NEEDS_*` or blocked state with the
next action, docs impact, residual risks, unresolved questions, and any external mutation with its scope.
