# Quality bar and pre-flight

Read before issuing a verdict. Every check uses the repository's own runners and fixtures, so the pass
holds with no other skill installed. A weak QA pass is more dangerous than none: it converts absence of
evidence into permission to ship.

## What weak QA output looks like

- A suite that cannot fail: assertions on mocks, a missing assertion, a swallowed error, `skip` or `only`
  left in, a snapshot over unstable output, a file that never runs in CI.
- A retry that passed once, reported as a fix.
- Determinism bought with a longer sleep instead of an observable readiness signal.
- Order, clock, shared data or a live third party left as hidden inputs.
- `PASS` issued because the environment was unavailable, or confidence language standing in for a run.
- Cascading assertions chased instead of the first causal failure.
- Requirements invented through testing: a check asserting behavior no accepted criterion asked for.
- "Not observed", "not tested", "cannot reproduce" and "verified absent" used interchangeably.
- A repro that is not minimal — the original steps, environment and data handed over unreduced.
- A build-owned regression case written into a build-owned file without its owner.

## Pre-flight

Pass every applicable check honestly.

### Traceability

- Every acceptance criterion maps to a test, an observation, or a stated risk-based reason it has neither.
- The risk surface is covered where it exists: boundary, error, permission, concurrency, lifecycle,
  offline, security, accessibility, performance, compatibility, rollback.

### Determinism

- Synchronization is on events or state, fixtures are isolated, and test data is created and torn down.
- A reported failure reproduced more than once; an intermittent one carries its frequency and correlation.
- The commands run, and the environment they ran in, are recorded well enough to repeat exactly.

### Ownership

- Only QA-owned files were edited; a case belonging to a build-owned file went back to its owner.
- No production implementation was changed to make a check pass.

## Proof to hand over

State the verdict, the commands and environment, the build or commit under test, what each check covered,
and the residual risk. `FAIL` carries a minimal repro with expected versus actual and the owning role.
`NEEDS_ENVIRONMENT` names the exact missing target, artifact or access and the smallest next action. Say
whether this was independent-agent QA or a single-session logical pass. Unavailable evidence is never a
pass.
