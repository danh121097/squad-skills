# Backend worked decisions

Read only when a concrete example will improve an architecture, data-safety, reliability or scope decision.
Adapt the reasoning to repository evidence; these are not templates or mandatory stacks.

## 1. Existing webhook handler needs retry safety

**Context:** A NestJS service already has controllers, services, Prisma transactions and a stable error
envelope. A payment provider retries webhook delivery.

**Decision:** Preserve the module boundaries. Verify the signature and timestamp before parsing trusted
fields; store the provider event ID under a unique constraint; apply the business transition and event
record in one transaction; acknowledge a duplicate as the repository/provider contract requires. Add a
focused integration test for first delivery, duplicate delivery, invalid signature and concurrent delivery.

**Avoid:** A new event platform, distributed lock or generic webhook framework when the database invariant
already provides atomic deduplication.

## 2. Choosing REST, GraphQL or gRPC for a new capability

**Context:** A greenfield service exposes a small external CRUD/search API and an internal high-volume
stream between controlled services.

**Decision:** Use REST for the external resource contract unless client-driven graph composition is a real
requirement. Evaluate gRPC streaming for the controlled internal path only when protobuf compatibility,
deadlines, backpressure and operational tooling are acceptable. Do not introduce GraphQL merely to avoid
designing endpoints.

**Evidence:** Consumer needs, deployment/network constraints, compatibility ownership, observability and
load shape—not popularity or benchmark claims.

## 3. Persistent migration versus disposable test schema

**Shared or production-like target:** Resolve ownership and data volume; verify backup and restore path;
use expand/contract; make the backfill bounded, resumable and observable; test old/new compatibility and
lock impact; define rollback or roll-forward.

**Disposable isolated test target:** Prove it is not shared, verify deterministic recreation and fixtures,
then exercise the migration from representative old state. A point-in-time backup adds no recovery value
when the target is intentionally recreated.

**Stop:** If target identity or shared/persistent status is uncertain, treat it as persistent until proven
otherwise.

## 4. Queue retry and exactly-once language

**Context:** A worker sends email after an order transition and may crash after the provider accepts the
request but before acknowledgement.

**Decision:** Assume at-least-once delivery; persist an idempotency key/outbox state; make retries bounded;
classify transient versus permanent errors; define dead-letter ownership and replay procedure. Say
“idempotent effect under these invariants,” not “exactly once,” unless every boundary proves that property.

## 5. Small validated CRUD change

**Context:** An established service needs one field and one endpoint using existing auth, validation, ORM
and test conventions.

**Decision:** Extend the current DTO/schema, service, data access and contract tests. Evaluate compatibility,
authorization, constraints and migration safety, then stop.

**Avoid:** A repository abstraction, command bus, cache, queue, new service or shared framework without a
demonstrated second consumer or operational need.
