# Backend system design and distributed systems

Use for architecture changes, capacity planning, service boundaries, asynchronous workflows, scaling,
high availability or cross-service consistency.

## Start from the workload

Quantify users/tenants, request and event rates, payload sizes, read/write ratio, burst shape, data growth,
latency SLO, availability target, durability, retention, regions, compliance and cost boundary. Identify
critical journeys and what may degrade versus fail closed.

## Architecture progression

Prefer the simplest architecture that meets current evidence:

1. Well-structured monolith.
2. Modular monolith with explicit domain boundaries.
3. Separate worker/read model/service only for independent scaling, isolation, ownership or lifecycle.
4. Microservices/event-driven architecture when organizational and operational capability supports them.

Avoid a distributed monolith, shared mutable database across services, chatty synchronous chains and
premature CQRS/event sourcing.

## Domain and boundaries

- Model bounded contexts and ubiquitous language; keep invariants with the owning domain.
- Define ownership of commands, state, events and read models.
- Make cross-boundary contracts versioned and observable.
- Keep orchestration/choreography choice explicit; document compensation and manual recovery.

## Distributed-system invariants

- Networks fail, duplicate, delay, reorder and partition messages.
- Delivery is normally at-least-once; consumers must be idempotent.
- Use transactional outbox/inbox or equivalent when DB state and events must agree.
- Define ordering scope, deduplication key, retry budget, backoff/jitter and dead-letter policy.
- Use timeouts everywhere; retries only for safe/transient operations and within a total deadline.
- Circuit breaking, bulkheads and load shedding protect resources but require observable thresholds.
- Avoid distributed transactions unless the platform and failure semantics justify them.

## Consistency and data ownership

Choose consistency per invariant, not per database brand. Document read-your-writes, monotonic reads,
eventual convergence, stale-data tolerance and conflict resolution. For sagas, list every compensating
action and irreversible step. For multi-region, define write authority, failover, clock/order assumptions
and recovery point/time objectives.

## Capacity and scaling

- Find the limiting resource: CPU, memory, event loop/thread pool, connection pool, DB CPU/I/O/locks,
  cache, broker partitions, external quota or network.
- Scale workers only while downstream capacity and connection budgets remain healthy.
- Use queueing and backpressure; bound in-flight work.
- Partition/shard only with a stable key, rebalancing plan, hot-key analysis and operational tooling.
- Separate horizontal scaling claims from measured throughput/latency under representative load.

## Design review output

Include context diagram, critical sequence/data flow, state ownership, contracts, SLOs, failure matrix,
capacity assumptions, security boundaries, observability, deployment/migration sequence, rollback and
rejected alternatives.
