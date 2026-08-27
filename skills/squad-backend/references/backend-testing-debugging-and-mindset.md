# Backend testing, debugging, and mindset

Use for test design, incident diagnosis, refactoring, architectural trade-offs and production-readiness.

## Testing strategy

Choose tests by failure risk rather than fixed percentages:

- unit/domain tests for invariants, calculations and policy;
- integration tests with real DB/cache/broker/provider substitutes for boundaries;
- HTTP/GraphQL/gRPC contract tests for schema, errors, auth, pagination and compatibility;
- migration tests on representative old schema/data for forward and recovery path;
- concurrency/idempotency/property tests for races, duplicates and state machines;
- end-to-end tests for critical cross-service journeys;
- load/soak/fault tests for SLO and resilience when justified;
- security tests for negative auth, injection, SSRF, upload and tenant isolation.

Keep fixtures deterministic and isolated. Prefer real boundary dependencies in containers/ephemeral
environments over mocks that reproduce implementation. Test time, randomness and retries controllably.

## Debugging method

1. State expected versus actual and earliest trustworthy symptom.
2. Reproduce on the exact request/event/data/environment path.
3. Build a timeline from logs, metrics, traces, deploy/config and dependency health.
4. Trace backward through contract, state transition, DB/query, cache and external calls.
5. Form one falsifiable hypothesis; run the narrowest discriminating check.
6. Fix the cause and add regression evidence; verify side effects and original symptom.

Do not mutate production data for diagnosis without explicit authority and backup. Redact sensitive logs.
For performance, profile CPU/heap/allocations/event loop/thread pools and query plans before tuning.

## Engineering mindset

- Think in systems, invariants, queues, feedback loops, bottlenecks and blast radius.
- Ask what fails, duplicates, races, times out, becomes stale, exhausts a pool or violates a tenant boundary.
- Prefer modular boundaries and clear contracts over speculative abstractions.
- Make trade-offs explicit: consistency/availability/latency, simplicity/flexibility, performance/cost,
  build/buy and synchronous/asynchronous.
- Design for operability: configuration, health, telemetry, runbook, rollback and ownership.
- Treat APIs as products and data migrations as production releases.
- Refactor only around demonstrated change pressure; readable repository-native code beats pattern theater.

## Quality and completion

Preserve error causes, avoid silent catch/fallback, bound resources, document non-obvious invariants and
keep public contracts stable. Completion requires fresh tests/build/migration/security evidence and an
honest statement of environment and gaps—not “should work.”
