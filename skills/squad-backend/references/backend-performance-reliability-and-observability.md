# Backend performance, reliability, and observability

Use for hot paths, scale changes, caches, queues, database tuning, production reliability or incidents.

## Measure first

Compare p50/p95/p99, error/timeout rate, saturation and cost to a baseline under representative load
(concurrency, data distribution, cache state, dependency latency). Profile before optimizing; avoid
microbenchmarks that omit database/network/serialization behavior.

## Database and storage

- Inspect actual execution plans, row estimates, scanned/returned rows, locks, I/O and query frequency.
- Derive indexes from query predicates/order/join and write cost; avoid duplicate/unused indexes.
- Size connection pools across all instances against DB capacity; monitor wait/saturation and leaks.
- Eliminate N+1 and unbounded reads; paginate/stream large data; batch within safe limits.
- Understand replica lag, read consistency, vacuum/compaction and backup impact.

## Caching

Define source of truth, key, TTL/freshness, invalidation owner, negative caching, stampede prevention,
tenant isolation and failure behavior. Measure hit rate and avoided work. Never use broad key scans on hot
production paths. Cache absence/failure must not violate correctness or authorization.

## Service observability

Instrument RED (rate/errors/duration) for the service and USE (utilization/saturation/errors) for its
resources. Use structured logs with correlation/trace and safe business identifiers; never secrets/PII.
Trace critical cross-service paths with OpenTelemetry or the repository standard. Metrics need stable
low-cardinality labels. Health endpoints separate liveness, readiness and detailed diagnostics; do not
expose internals publicly.

## Evidence

Report baseline, workload, environment, change, measurements and residual bottleneck. Distinguish static
reasoning, local benchmark, staging load and production observation.
