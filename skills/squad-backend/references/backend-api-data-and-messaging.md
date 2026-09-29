# Backend API, data, and messaging

Use for public/internal contracts, persistence, migrations, streaming, webhooks or background processing.

## Contract design

Beyond the gate 2 fields, define per operation filtering/sorting, concurrency control and rate/quota
behavior. Generate/publish machine-readable schemas when the stack supports them; test consumers and
providers, and publish schemas/examples, rollout order and test fixtures so consumers never infer behavior
from implementation internals.

### REST/HTTP

Resource/action semantics that match the domain; correct methods/status/cache headers; cursor pagination
for mutable/high-volume collections; ETag/version for optimistic concurrency; Problem Details or the
repository's stable error envelope. Avoid leaking existence across authorization boundaries.

### GraphQL

Enforce field-level authorization, input limits, depth/complexity budgets, persisted/allowlisted operations
where warranted, batching/DataLoader and resolver observability. Treat introspection and subscriptions
according to threat and environment.

### gRPC/RPC

Preserve protobuf field numbers and compatibility; set deadlines, cancellation, status mapping, message
limits, streaming backpressure and reflection exposure.

### WebSocket/SSE/webhooks

Define authentication refresh, reconnect/resume, ordering, replay, heartbeat, backpressure and disconnect
cleanup. Webhooks require signatures, timestamp/replay defense, idempotency, retries, delivery logs and
secret rotation.

## Data modeling

Start from invariants and query/write patterns. Search/vector/time-series/graph stores are specialized
projections unless they own authoritative state. Multi-tenancy: tenant key in every boundary, isolation
strategy, index design and administrative access.

## Migrations and data changes

Resolve the target first, and satisfy the recovery rule in Scope and safety. Prefer expand → backfill →
dual/read compatibility → switch → contract. Make backfills resumable, bounded, observable and idempotent.
Test forward, rollback or roll-forward, old/new application compatibility, lock duration and representative
data.

When data inspection or recovery tooling is unavailable, do not mutate data to compensate. For
shared/persistent targets, produce the migration/rollback plan and request the smallest safe backup/restore
access or artifact needed; a backup that cannot be restored or whose target/scope is unknown does not
satisfy the persistent-data gate. For an isolated disposable target, prove its recreation/reset and
deterministic seed/fixture path. Never claim a migration or query plan was verified when it was only
reasoned about statically.

## Messaging and jobs

Choose queue versus event stream by semantics, not throughput marketing. Define producer schema/version,
partition/order key, acknowledgement, retry/dead-letter, poison message, dedupe/idempotency, visibility
timeout, retention/replay and consumer lag. Never acknowledge before durable effect unless loss is allowed.

## Transactions and concurrency

Choose isolation and locking from invariants: optimistic versioning for low-conflict workflows, pessimistic
locks for short critical sections. Detect lost update, write skew, duplicate request, double spend, stale
cache and out-of-order event paths. Keep external calls outside DB transactions when possible.
