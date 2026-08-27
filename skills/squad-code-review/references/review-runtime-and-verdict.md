# Review runtime and verdict

Read before review or when AgentKit, stack specialists, test environments, docs lookup, or QA evidence is
unavailable.

## Review dimensions

Select dimensions by change risk:

- correctness: logic, boundary/error paths, lifecycle, race, concurrency and regression;
- security/privacy: authN/authZ, tenant isolation, injection, SSRF, secrets, validation and logging;
- compatibility: API/schema/types/events/env/config, migrations, clients and rollback;
- performance: hot paths, N+1, rendering, memory, I/O, bundle/startup and infrastructure cost;
- maintainability: repository conventions, clarity, duplication, ownership and error handling;
- verification: test quality, missing regression cases, docs/runbook and observability impact;
- delivery: feature flags, rollout, migration sequencing, health signals and rollback.

## Capability mapping

| Need | Preferred when installed | Native fallback |
|---|---|---|
| Scope/blast radius | `ak:scout` | Search callers, consumers, schemas, configs and tests directly |
| Core review | `ak:code-review`, PR review skill | Inspect target diff and repository evidence manually |
| Security | Security skills/scanners | Manual threat lens plus existing repository scanners |
| Stack checks | Framework/provider specialists | Use repository patterns and current official docs |
| Verify claim | Debug/test skill | Run focused repro/test/static command directly |

AgentKit is optional. Never auto-install a skill, scanner, package, plugin, MCP server or CLI. If required
QA evidence or runtime access is missing, state the limitation; do not convert uncertainty into approval.

## Severity

- **Blocking:** likely correctness, security, data, contract, deployment or acceptance failure that must
  be fixed before merge/release.
- **Warning:** real maintainability, performance or resilience risk with a credible failure path but not an
  immediate release blocker.
- **Suggestion:** optional improvement with no demonstrated defect or contract risk.

## Finding format

- `[Severity] Short title`
- `file:line`
- Trigger/failure condition.
- User/system impact.
- Evidence or reproduction.
- Smallest cause-aligned remediation.

Do not inflate severity, duplicate one root cause across many findings, or report lint/style already
enforced automatically unless the change bypasses that enforcement.

## Verdict

- **APPROVE:** no blocking findings; list residual risk and checks actually run.
- **CHANGES REQUESTED:** at least one blocker; return to owner, then require QA rerun before re-review.
- **NEEDS_EVIDENCE:** required target, QA, contract, docs or runtime evidence is unavailable. Name the exact
  gap and smallest next action, return it to the lead, and resume Review after evidence is supplied. It is
  not eligible for done and must not be converted into a speculative finding.
