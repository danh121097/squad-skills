# Security, architecture, data, and operations review

Use for sensitive/public/multi-module/data/infra changes and any diff with broad blast radius.

## Threat and authorization

Identify assets, actors, trust/tenant boundaries and abuse cases. Verify server-side authorization at
object/action/field, deny-by-default policy, admin/support paths, IDOR/BOLA, mass assignment and negative
cross-role/tenant tests. Authentication success is not authorization proof. Inspect unsafe sinks, token/
session handling, replay/idempotency, resource exhaustion, secret/logging and supply-chain changes. Findings
need a reachable path and impact, not OWASP label matching.

## Architecture

Check dependency direction, ownership, public interfaces, synchronous chains, state duplication and failure
propagation. A new abstraction/service/queue/cache/store must solve demonstrated coupling, scale,
reliability or ownership need; reject distributed monolith and pattern theater with concrete evidence.
For events/queues verify the consistency mechanism, ordering scope, retries, dead-letter and dedupe; for
external calls verify deadline, cancellation and safe retries.

## Data and migrations

Trace invariants through schema/constraints/application. Review destructive/replacement operations,
expand-contract sequencing, old/new compatibility, backfill resumability/bounds, lock/table rewrite,
rollback or roll-forward, and retention/privacy. Check isolation, lost update/write skew, cache
invalidation and cross-tenant key/index behavior. A migration syntax pass is not representative-data proof.

## Operations and release

Review config defaults/precedence, health/readiness, graceful shutdown, telemetry cardinality/redaction,
feature flag lifecycle, rollout signals and rollback compatibility. Infra review resolves the exact
environment and plan/diff; flag public access, wildcard IAM, secret state/log, unpinned privileged CI and
untested restore.
