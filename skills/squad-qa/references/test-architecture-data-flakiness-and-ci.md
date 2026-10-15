# Test architecture, data, flakiness, and CI

Use when creating/auditing/optimizing suites, fixtures, CI lanes or unreliable tests.

## Test architecture and data

- Keep helpers thin so setup and assertions stay visible.
- Separate fast deterministic checks from environment-heavy lanes; preserve a reliable local path.
- Use factories/builders with valid defaults and explicit overrides, isolated per transaction, schema,
  tenant or namespace; control clock, randomness, IDs, locale and timezone; use synthetic or redacted data.
- Test migrations with representative old states, restore/rollback or roll-forward, and large or
  problematic values.

## Determinism and flakiness

Wait for observable state or events with a bounded timeout. Reproduce a flake with
repeat/shuffle/parallel/stress and capture an artifact. Fix cause; quarantine only with owner, tracking,
expiry and preserved visibility. Report a deterministic product failure as a failure; a retry does not clear it.

A stochastic subject is not a flaky test. Variance in a model's output or a randomized algorithm is a
property of what is under test, not a flake to fix. Evidence for it is a distribution: pin what can be
pinned, state the sample size, and assert a threshold on the aggregate, recording both. One pass proves
nothing; one failure is not yet a FAIL.

## Coverage and test quality

Use changed-code and risk coverage. Remove redundant or deceptive tests only with replacement evidence. Audit for the weak
shapes listed in the quality bar, plus ignored exit codes and CI conditions that silently bypass gates.

## CI design

- Cache only keyed, verified artifacts; keep untrusted PR jobs apart from secrets and deploy privileges.
- Shard by measured duration; retain minimal redacted logs/screenshots/traces with bounded retention.
- Optimization preserves the risk matrix: use historical duration/failure/change data, not blanket
  parallelism or docs-only skips that could miss generated/schema/config behavior.
