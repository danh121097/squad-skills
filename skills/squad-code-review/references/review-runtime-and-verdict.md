# Review severity and report shape

Read before review, and whenever QA evidence or docs lookup is in question.

## Review dimensions

Consume current QA behavioral evidence, then select implementation-quality dimensions by change risk:

- correctness: logic, boundary/error paths, lifecycle, race, concurrency and regression;
- security/privacy: authN/authZ, tenant isolation, injection, SSRF, secrets, validation and logging;
- compatibility: API/schema/types/events/env/config, migrations, clients and rollback;
- performance: hot paths, N+1, rendering, memory, I/O, bundle/startup and infrastructure cost;
- maintainability: repository conventions, clarity, duplication, ownership and error handling;
- verification: test quality, missing regression cases, docs/runbook and observability impact;
- delivery: feature flags, rollout, migration sequencing, health signals and rollback.

## Severity

- **Blocking:** likely correctness, security, data, contract, deployment or acceptance failure that must
  be fixed before merge/release; a defect the review reproduces is blocking unless its impact is shown to
  be cosmetic.
- **Warning:** real maintainability, performance or resilience risk with a credible failure path not yet
  shown to fail.
- **Suggestion:** optional improvement with no demonstrated defect or contract risk.

If impact depends on unknown product intent, ask with evidence instead of asserting.

## Finding format

- `[Severity] Short title`
- `file:line`
- Trigger/failure condition.
- User/system impact.
- Evidence or reproduction.
- Smallest cause-aligned remediation.

Report lint/style already enforced automatically only when the change bypasses that enforcement.

Report implementation alignment and production quality as separate ranked lists, both even when one is
empty; where no contract is reachable, say so under implementation alignment.
