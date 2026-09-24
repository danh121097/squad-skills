# Backend worked decisions

Read only when a concrete example will improve an architecture, data-safety, reliability or scope decision.
These are reasoning patterns, not templates.

## 1. Existing webhook handler needs retry safety

**Situation:** A NestJS/Prisma service receives payment webhooks the provider retries.

**Decision:** Verify signature and timestamp before trusting fields; store the provider event ID under a
unique constraint; apply the business transition and the event record in one transaction; acknowledge a
duplicate as the provider contract requires. Test first, duplicate, invalid-signature and concurrent
delivery.

**Why:** The database invariant already deduplicates atomically. A distributed lock, event platform or
generic webhook framework adds failure modes without adding a guarantee.

## 2. Choosing REST, GraphQL or gRPC for a new capability

**Situation:** A greenfield service has a small external CRUD/search API and a high-volume internal stream.

**Decision:** REST for the external contract unless client-driven graph composition is a real requirement.
gRPC streaming for the internal path only if protobuf compatibility, deadlines, backpressure and tooling are
acceptable. Never GraphQL merely to avoid designing endpoints; consumer needs decide, not popularity.

## 3. Migration target of uncertain status

**Decision:** If you cannot prove a target is isolated and disposable, treat it as persistent: backup,
expand/contract, bounded resumable backfill, rollback boundary.

## 4. Queue retry and exactly-once language

**Situation:** A worker sends email after an order transition and may crash after the provider accepts but
before acknowledgement.

**Decision:** Assume at-least-once; persist an idempotency key or outbox state; bound retries; split
transient from permanent errors; name dead-letter ownership and replay. Say "idempotent effect under these
invariants", never "exactly once", unless every boundary proves it.
