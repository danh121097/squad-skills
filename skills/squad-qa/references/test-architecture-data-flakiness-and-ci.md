# Test architecture, data, flakiness, and CI

Use when creating/auditing/optimizing suites, fixtures, CI lanes or unreliable tests.

## Test architecture

- Align tests with stable behavior/contracts, not private implementation.
- Keep helpers thin and transparent; avoid a second framework that hides setup/assertions.
- Centralize environment/bootstrap only when semantics are shared; local fixtures improve clarity.
- Make ownership and suite boundaries explicit; keep test names behavioral and diagnostic.
- Separate fast deterministic checks from environment-heavy lanes; preserve a reliable local path.

## Test data

Use factories/builders with valid defaults and explicit overrides; avoid giant shared fixtures. Isolate by
transaction/schema/database/tenant/unique namespace according to system. Control clock, randomness, IDs,
locale and timezone. Use synthetic/redacted data; never copy production secrets/PII casually.

Integration environments need deterministic seed, teardown and parallel safety. Test migrations with
representative old states, restore/rollback or roll-forward, and large/problematic values.

## Determinism and flakiness

Never use arbitrary sleeps. Wait for observable state/event with bounded timeout. Avoid shared accounts,
order dependence, real third-party calls and uncontrolled network/time. Diagnose flake category:

- race/async synchronization;
- environment/resource exhaustion;
- test isolation/data collision;
- animation/browser/device timing;
- external dependency;
- nondeterministic ordering/time/randomness;
- runner/cache/build configuration.

Reproduce with repeat/shuffle/parallel/stress and capture artifact. Fix cause; quarantine only with owner,
tracking, expiry and preserved visibility. Do not retry a deterministic product failure into green.

## Coverage and test quality

Coverage is a map, not proof. Evaluate critical path, branch/state/permission/error/migration boundaries and
assertion quality. A high percentage with mocks/snapshots can be weak. Use changed-code/risk coverage and
mutation/property checks selectively. Remove redundant/deceptive tests only with replacement evidence.

## CI design

- Fast fail: static/type/unit before expensive integration/E2E where dependency permits.
- Cache only keyed/verified artifacts; prevent stale/cross-trust cache poisoning.
- Shard by measured duration and keep deterministic merge/reporting.
- Control concurrency for shared environments; use unique resources and guaranteed cleanup.
- Retain minimal useful logs/screenshots/traces/video with redaction and bounded retention.
- Separate untrusted PR jobs from secrets/deploy privileges.
- Pin/review CI actions/images/tools according to supply-chain policy.

Optimization preserves the risk matrix. Use historical duration/failure/change data, not blanket parallelism
or docs-only skips that could miss generated/schema/config behavior.

## Suite maintenance

Track flaky/slow/low-value tests, ownership and runtime budgets. Audit skipped/only/commented assertions,
placeholder tests, tautologies, over-mocking, stale snapshots, ignored exit codes and CI conditions that
silently bypass gates.
