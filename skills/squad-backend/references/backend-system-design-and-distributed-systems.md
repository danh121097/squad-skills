# Backend system design and distributed systems

Use for architecture changes, capacity planning, service boundaries, asynchronous workflows, scaling,
high availability or cross-service consistency.

## Architecture progression

Quantify the workload first (rates, payload sizes, read/write ratio, burst shape, latency SLO,
availability, durability), then prefer the simplest architecture that meets current evidence: a
well-structured monolith, a modular monolith, a separate worker/read model/service only for independent
scaling, isolation, ownership or lifecycle, and microservices/event-driven only when the organization can
operate them. Avoid a distributed monolith, a shared mutable database across services, chatty synchronous
chains and premature CQRS/event sourcing.

## Distributed-system invariants

- Networks fail, duplicate, delay, reorder and partition messages.
- Delivery is normally at-least-once; consumers must be idempotent.
- Use transactional outbox/inbox or equivalent when DB state and events must agree.
- Define ordering scope, deduplication key, retry budget, backoff/jitter and dead-letter policy.
- Use timeouts everywhere; retry only safe/transient operations within a total deadline, with exponential
  backoff and jitter.
- Circuit breaking, bulkheads and load shedding protect resources but require observable thresholds.
- Avoid distributed transactions unless the platform and failure semantics justify them.

## Consistency and data ownership

Choose consistency per invariant, not per database brand. Document read-your-writes, stale-data tolerance
and conflict resolution. For sagas, list every compensating action and irreversible step. For multi-region,
define write authority, failover, clock/order assumptions and recovery point/time objectives.

## Capacity and scaling

- Find the limiting resource: CPU, memory, event loop/thread pool, connection pool, DB CPU/I/O/locks,
  cache, broker partitions, external quota or network.
- Scale workers only while downstream capacity and connection budgets remain healthy.
- Use queueing and backpressure; bound in-flight work.
- Partition/shard only with a stable key, rebalancing plan, hot-key analysis and operational tooling.
- Separate horizontal scaling claims from measured throughput/latency under representative load.
