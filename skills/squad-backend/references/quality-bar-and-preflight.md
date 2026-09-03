# Quality bar and pre-flight

Read before handing work to QA, Code Review or a consumer. Every check here is readable in the diff or
runnable with the repository's own commands, so the pass holds with no other skill installed.

## What weak backend output looks like

- An abstraction with one caller: repository wrapper, command bus, event platform, cache or queue added
  where a constraint, a transaction or a direct call already met the requirement.
- A contract only its happy path describes, leaving error shape, pagination, versioning, idempotency and
  auth requirement for each consumer to infer differently.
- Guarantees the code does not hold: "exactly once" over an at-least-once transport, "atomic" across two
  systems with no transaction or outbox, "safe migration" on a target never resolved as shared or disposable.
- Authorization at the entrance only, with the query underneath loading a record by unscoped id.
- Swallowed causes: broad catch, silent fallback value, or a rethrow that discards the original error.
- A boundary test that mocks the boundary it exists to prove, so the double passes and the contract is
  never exercised.
- Anything unbounded: query without a limit, retry without a ceiling, payload without a size cap,
  concurrency without a pool boundary.
- Completion inferred from reading the diff — "should work" — rather than from a run.

## Pre-flight

Pass every applicable check honestly.

### Contract and compatibility

- Request/response schema, error envelope, status codes, pagination and versioning match what ships.
- Existing consumers keep working, or the break is intentional, named and routed to its owner.
- Idempotency and retry semantics are stated in words the transport actually supports.

### Data and safety

- Target environment resolved; persistent targets have a restore path, disposable ones a recreation path.
- Constraints, indexes, transaction boundaries and concurrent-writer behavior were decided together.
- Migrations have a forward path, a rollback or roll-forward decision, and a bounded, resumable backfill.

### Security

- Input validated at the boundary; authorization enforced server-side on every changed path.
- Injection, SSRF, tenant isolation, rate limits and secret exposure checked across the changed surface.
- No secret, credential, token or internal error detail reaches a log, a response or a fixture.

### Code and tests

- The change follows repository patterns, and any new module earns its boundary.
- Failure paths are tested alongside success: duplicate, concurrent, expired, unauthorized, empty.

## Proof to hand over

Name the tests, migration checks and build commands that actually ran, the environment they ran in, and
what stayed unverified. A check that could not run is reported as not run, never as a pass.
