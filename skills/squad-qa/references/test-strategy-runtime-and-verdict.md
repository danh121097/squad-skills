# Test strategy, runtime pairing, and verdict

Read before designing scenarios or selecting tools, and whenever AgentKit, test runners, browsers/devices,
services or observability are in question.

## AgentKit pairing

Detect AgentKit once per task by inspecting the live skill catalog for `ak:*` entries or an available
`ak` CLI.

- **Installed** — read this skill's task-relevant references first, then pair the phase-matched `ak:*`
  skill with this role's contract so it accelerates the phase. This role's boundary, gates, and evidence
  rules stay authoritative wherever the two disagree.
- **Absent** — run the native fallback for the same phase at the same standard.

Never auto-install AgentKit or any skill, and never report a skill as run when it does not exist.

## Risk matrix

Select applicable dimensions; do not run every category mechanically:

- behavior: happy path, boundary values, invalid input, error and recovery;
- state: loading, empty, stale, retry, cancellation, partial success and idempotency;
- access: unauthenticated, unauthorized, role/tenant isolation and sensitive-field handling;
- timing: concurrency, race, ordering, retry, timeout and duplicate delivery;
- compatibility: API/schema, browser/device/OS, migration and backward compatibility;
- UX: navigation, keyboard/focus, screen reader, contrast, reduced motion and responsive/adaptive layout;
- performance: hot path, latency, memory, throughput, bundle/startup and regressions;
- operations: deploy smoke, health, observability and rollback when infrastructure changed.

## Capability mapping

| Need | Pair when installed | Native fallback |
|---|---|---|
| Scout/scenarios | `ak:scout`, `ak:scenario` | Inspect diff/tests/contracts and derive matrix directly |
| Unit/integration | `ak:test` | Run repository-native test commands and fixtures |
| Web/e2e | `ak:web-testing`, browser skills | Use installed runner/browser or report unavailable target |
| Mobile | Mobile test/device skill | Use repository simulator/emulator/device tooling |
| Performance | k6/web-perf/provider tools | Use existing benchmarks/profilers or state the gap |
| Security smoke | Security scanner | Run existing scanners and targeted manual misuse cases |
| Repro/debug | Debug skill | Trace the failing path and minimize it directly |

Never auto-install a runner, browser, SDK, skill, plugin, MCP server or service. Do not claim a
browser/device/load/deploy check ran without that environment.

## Evidence contract

Record the exact target, command or manual path, environment/version, result, relevant artifact, and any
limitation. Redact tokens, credentials, personal data and private payloads.

## Verdict

### PASS

- Acceptance coverage: criteria and evidence.
- Regression/risk coverage: what was checked.
- Environment: where it ran.
- Residual risk: what remains unverified and why.
- Next gate: Code Review.

### FAIL

- Blocking criterion/risk.
- Minimal steps and fixture/data setup.
- Expected versus actual.
- Deterministic artifact/log reference.
- Owning role and retest scope.

### NEEDS_ENVIRONMENT

- Exact missing executable target, browser/device, service, fixture/data, artifact, access or authorization.
- Why the missing item is required for an acceptance or material-risk decision.
- Smallest safe next action and owner (normally the lead), plus the QA scope to resume afterward.

Use `FAIL` only when evidence demonstrates a product/test defect or unmet criterion. Use
`NEEDS_ENVIRONMENT` when required evidence cannot be obtained in the current environment. It blocks `done`,
returns to the lead for resolution and resumes at QA; it never becomes PASS by inference.
