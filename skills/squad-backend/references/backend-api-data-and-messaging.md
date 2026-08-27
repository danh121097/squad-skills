# Backend API, data, and messaging

Use for public/internal contracts, persistence, migrations, streaming, webhooks or background processing.

## Contract design

For every operation define input/output schema, validation, authN/authZ, error taxonomy, idempotency,
pagination, filtering/sorting, concurrency control, rate/quota behavior, observability and compatibility.
Generate/publish machine-readable schemas when the stack supports them; test consumers and providers.

### REST/HTTP

Use resource/action semantics that match the domain; correct methods/status/cache headers; cursor pagination
for mutable/high-volume collections; ETag/version for optimistic concurrency; Problem Details or the
repository's stable error envelope. Avoid leaking existence across authorization boundaries.

### GraphQL

Design schema around domain capabilities; enforce field-level authorization, input limits, depth/complexity
budgets, persisted/allowlisted operations where warranted, batching/DataLoader, cursor connections and
resolver observability. Treat introspection and subscriptions according to threat and environment.

### gRPC/RPC

Preserve protobuf field numbers and compatibility; set deadlines, cancellation, status mapping, retries,
message limits, streaming backpressure and reflection exposure. Use mTLS/service identity as required.

### WebSocket/SSE/webhooks

Define authentication refresh, reconnect/resume, ordering, replay, heartbeat, backpressure and disconnect
cleanup. Webhooks require signatures, timestamp/replay defense, idempotency, retries, delivery logs and
secret rotation.

## Data modeling

- Start from invariants and query/write patterns.
- Relational: constraints, normalization, transaction boundaries, isolation, indexes and execution plans.
- Document: aggregate boundaries, schema validation, document growth, indexes and transaction needs.
- Key/value/cache: key cardinality, TTL, eviction, stampede prevention and invalidation ownership.
- Search/vector/time-series/graph: treat as specialized projections unless they own authoritative state.
- Multi-tenancy: tenant key in every boundary, isolation strategy, index design and administrative access.

## Migrations and data changes

Resolve the target first. For shared/persistent/staging/production data, create or verify a recoverable
backup and credible restore path before mutation. For an isolated disposable local/test target, verify its
recreation/reset and deterministic seed/fixture path. Prefer expand → backfill → dual/read compatibility →
switch → contract. Make backfills resumable, bounded, observable and idempotent. Test forward, rollback or
roll-forward, old/new application compatibility, lock duration and representative data.

## Messaging and jobs

Choose queue versus event stream by semantics, not throughput marketing. Define producer schema/version,
partition/order key, acknowledgement, retry/dead-letter, poison message, dedupe/idempotency, visibility
timeout, retention/replay and consumer lag. Never acknowledge before durable effect unless loss is allowed.

## Transactions and concurrency

Choose isolation and locking from invariants. Use optimistic versioning for low-conflict workflows;
pessimistic locks for short critical sections. Detect lost update, write skew, duplicate request, double
spend, stale cache and out-of-order event paths. Keep external calls outside DB transactions when possible.

## Contract handoff

Publish schemas/examples, error codes, auth/scopes, idempotency rules, pagination, event/webhook semantics,
compatibility window, rollout order, observability and test fixtures. Consumers must not infer behavior
from implementation internals.
