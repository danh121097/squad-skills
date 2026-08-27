# Security, architecture, data, and operations review

Use for sensitive/public/multi-module/data/infra changes and any diff with broad blast radius.

## Threat and authorization

Identify assets, actors, trust/tenant boundaries and abuse cases. Verify server-side authorization at
object/action/field, deny-by-default policy, admin/support paths, confused deputy, IDOR/BOLA, mass assignment
and negative cross-role/tenant tests. Authentication success is not authorization proof.

Inspect injection/unsafe sinks, SSRF, upload, deserialization, redirect, CSRF/CORS, token/session handling,
replay/idempotency, rate/resource exhaustion, secret/logging and third-party/supply-chain changes. Findings
need a reachable path and impact, not OWASP label matching.

## Architecture

Check dependency direction, ownership, bounded contexts, public interfaces, synchronous chains, state
duplication and failure propagation. New abstraction/service/queue/cache/store must solve demonstrated
coupling, scale, reliability or ownership need. Reject distributed monolith and pattern theater with
concrete evidence.

For events/queues verify outbox/inbox or consistency mechanism, schema/version, ordering scope, retries,
dead-letter, dedupe/idempotency, poison messages and recovery. For external calls verify deadline,
cancellation, safe retries, circuit/load-shed behavior and observability.

## Data and migrations

Trace invariants through schema/constraints/application. Review destructive/replacement operation, backup/
restore, expand-contract sequencing, old/new compatibility, backfill resumability/bounds, lock/table rewrite,
indexes from query paths, rollback or roll-forward, replication/lag and retention/privacy.

Check transaction isolation, lost update/write skew, double spend, cache invalidation, stale reads and
cross-tenant key/index behavior. A migration syntax pass is not representative-data proof.

## Operations and release

Review config defaults/precedence, health/readiness, graceful shutdown, telemetry cardinality/redaction,
alerts/runbook, feature flag lifecycle, rollout signals, rollback compatibility and incident recovery.

Infra review resolves exact environment and plan/diff; flag public access, wildcard IAM, secret state/log,
unpinned privileged CI, missing resources/probes, autoscaling downstream risk and untested restore.

## Severity calibration

Blocking requires a credible path to acceptance, security, data, contract, production or release failure.
Warning needs a real maintainability/performance/resilience cost. Suggestion remains optional. If impact
depends on unknown product intent, ask with evidence instead of asserting.
