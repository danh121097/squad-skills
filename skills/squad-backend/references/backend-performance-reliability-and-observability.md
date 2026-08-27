# Backend performance, reliability, and observability

Use for hot paths, scale changes, caches, queues, database tuning, production reliability or incidents.

## Measure first

Define SLI/SLO and representative load: throughput, concurrency, payload/data distribution, cache state and
dependency latency. Compare p50/p95/p99, error/timeout rate, saturation and cost to a baseline. Profile
before optimizing; avoid microbenchmarks that omit database/network/serialization behavior.

## Database and storage

- Inspect actual execution plans, row estimates, scanned/returned rows, locks, I/O and query frequency.
- Derive indexes from query predicates/order/join and write cost; avoid duplicate/unused indexes.
- Size connection pools across all instances against DB capacity; monitor wait/saturation and leaks.
- Eliminate N+1 and unbounded reads; paginate/stream large data; batch within safe limits.
- Understand replica lag, read consistency, vacuum/compaction, storage growth and backup impact.

## Caching

Define source of truth, key, TTL/freshness, invalidation owner, negative caching, stampede prevention,
serialization, tenant isolation and failure behavior. Measure hit rate and avoided work. Never use broad key
scans on hot production paths. Cache absence/failure must not violate correctness or authorization.

## Reliability patterns

Use deadlines and cancellation end-to-end. Retry only transient/idempotent work with exponential backoff,
jitter and a total budget. Bound queues and concurrency; use load shedding, circuit breakers and bulkheads
with observable thresholds. Define graceful shutdown, draining, readiness and dependency degradation.

## Observability

Instrument RED (rate/errors/duration) for services and USE (utilization/saturation/errors) for resources.
Use structured logs with correlation/trace and safe business identifiers; never secrets/PII. Trace critical
cross-service paths with OpenTelemetry or repository standard. Metrics need stable low-cardinality labels.

Health endpoints separate liveness, readiness and detailed diagnostics; do not expose internals publicly.
Alerts map to user/SLO impact and an owned runbook, not every metric fluctuation.

## Capacity and release

Model bottleneck and downstream budgets before adding workers. Load test beyond expected peak only in an
authorized environment, observe saturation and stop conditions, and compare results to SLO. Use canary or
progressive delivery for high-risk changes, with rollback signals and compatibility with migrations/events.

## Evidence

Report baseline, workload, environment, change, measurements, confidence, cost and residual bottleneck.
Distinguish static reasoning, local benchmark, staging load and production observation.
