# Delivery pipeline and roster

Read before routing roles or advancing any slice through Design, QA, Review, integration or done.

## 1. Role boundary matrix

| Role | Delivers | Must not absorb |
|---|---|---|
| Designer | UX flow, IA, hierarchy, tokens, states, responsive, motion, accessibility, implementation spec | Production code |
| Frontend | Web UI, client state/forms/navigation, Backend API integration, a11y/performance | Server APIs, shared DB/business logic, infra |
| Backend | Shared APIs/contracts, auth, DB/data access, server business logic, migrations | Web/mobile UI, deployment pipelines |
| Mobile | App UI/navigation, client logic, API integration, persistence/offline/sync, device concerns | Shared server APIs/DB/business logic, web UI |
| DevOps | Containers, CI/CD, IaC, cloud, secrets wiring, observability, rollout/rollback | Feature/app code |
| QA | Scenario design, assigned tests/fixtures, execution, repro, evidence and PASS/FAIL/NEEDS_ENVIRONMENT | Production implementation, closing work |
| Code Review | Evidence-based final review, findings and APPROVE/CHANGES_REQUESTED/NEEDS_EVIDENCE | Feature fixes, self-approval |

Named `squad-*` skills are preferred when installed. The role must load its `SKILL.md` plus task-relevant
deep references; merely naming the skill is not enough. When absent, the lead gives the role this matrix,
the acceptance/ownership/evidence contract and the relevant section of `domain-coverage-contracts.md`;
AgentKit is not required.

## 2. Automatic routing

- Concrete bug/regression/failing test with unproven cause or owner → `squad-fix` diagnosis/routing stage
  when installed; otherwise perform the same baseline → scout → root-cause proof inline. `squad-fix` is a
  workflow controller, not an eighth implementation role.
- Material visual/UX/Figma work → Designer before Frontend/Mobile.
- Web UI/client logic/API consumption → Frontend.
- Server API/shared contract/auth/data/server logic → Backend.
- App UI/client logic/offline/device/API consumption → Mobile.
- CI/container/IaC/cloud/deploy/observability → DevOps.
- Completed implementation → QA.
- QA PASS → Code Review.

Do not spawn roles with no real slice. Split cross-role work by contract boundary. Backend publishes the
shared contract; clients consume it. Contract mismatch returns to Backend instead of being reimplemented
inside clients.

## 3. Pipeline

```text
[Diagnose first for bugs] → [Design when needed] → [Plan approval when requested]
→ IMPLEMENT → QA → REVIEW → INTEGRATE → done
```

Hard rules:

- Build role reports completion but never self-approves.
- QA `PASS` advances; `FAIL` returns to owning build role with minimal repro.
- QA `NEEDS_ENVIRONMENT` returns to the lead for the smallest missing target, artifact, access or authority;
  QA resumes after resolution. It never becomes an inferred pass.
- Code Review runs only after QA PASS.
- `CHANGES_REQUESTED` returns to owner, then requires QA rerun and Review rerun.
- `NEEDS_EVIDENCE` returns to the lead for the exact missing review/QA/contract/runtime evidence; Review
  resumes after it is supplied.
- No slice or integrated result is done without PASS then APPROVE.
- If a `NEEDS_*` gap cannot be resolved within scope, stop as blocked and name the next action; do not mark
  the slice done and do not mislabel the gap as a product defect.
- QA never edits production implementation; Reviewer never implements fixes.

In single-session mode, these are separate logical passes and the reduced independence must be disclosed.

## 4. Inline high-quality role contracts

Use only when the named role skill is unavailable:

- **Designer:** accepted Figma/codebase first; research only when needed; define complete states,
  responsive, tokens, motion, accessibility and component mapping; no production code.
- **Frontend:** preserve repo stack; model API/permissions/states before UI; implement client only; verify
  type/lint/build/tests/browser/a11y/performance as applicable.
- **Backend:** contract and data safety first; validate/authz at boundaries; reversible migrations; threat
  pass and unit/integration/contract evidence.
- **Mobile:** preserve app/platform patterns; model lifecycle/offline/sync/security; consume APIs; verify
  realistic simulator/device targets and disclose gaps.
- **DevOps:** resolve exact environment/authority; plan before apply; reproducible artifacts, least
  privilege, observability and rollback; separate static/plan/live evidence.
- **QA:** map acceptance/risk to deterministic evidence; no implementation edits;
  PASS/FAIL/NEEDS_ENVIRONMENT with repro or exact missing target plus residual risk.
- **Code Review:** inspect blast radius; verify findings; severity + file:line + remediation; advisory
  APPROVE/CHANGES REQUESTED/NEEDS_EVIDENCE.

These summaries are routing reminders, not sufficient domain knowledge. Read the full role section in
`domain-coverage-contracts.md` and consult current primary docs for the actual stack.

## 5. Integration

The lead resolves contract and merge conflicts under explicit ownership, runs combined relevant checks,
and distinguishes per-slice success from integrated success. Update durable docs only for user-visible
behavior, setup/commands, configuration, contracts, architecture, security or operations changes.

Commit, push, PR, deploy and external tracking are separate authorizations. Do not infer them from a
request to implement or orchestrate.

## 6. Final report

Include:

- outcome and acceptance result;
- execution mode and whether gates were independent agents or single-session passes;
- role/ownership map and integrated artifacts;
- test/build/security/deploy evidence at the level actually verified;
- QA and Code Review verdicts;
- unresolved NEEDS_* owner, required next action and blocked/not-done state, when applicable;
- docs impact, residual risks and unresolved questions;
- external mutations performed, if any, with scope.
