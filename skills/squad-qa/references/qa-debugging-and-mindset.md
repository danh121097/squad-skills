# QA debugging and mindset

Use for bug reproduction, weak/deceptive suite audits, failure triage and evidence-based sign-off.

## Reproduction protocol

1. Convert report into expected/actual, scope, environment and earliest observable symptom.
2. Resolve version/commit/build, config/flags, account/permissions, data, browser/device/OS and timing.
3. Reproduce through the real operational path; capture minimal safe logs/network/screenshot/trace/data.
4. Reduce variables and steps while preserving failure; test clean state and neighboring conditions.
5. Classify product defect, test defect, environment, flaky dependency, spec ambiguity or unsupported path.
6. Produce a minimal repro and regression test proposal; owning role diagnoses/fixes implementation.

QA may identify likely subsystem/root-cause evidence but does not edit production implementation. Never
expose secrets/PII or mutate production data without authority.

## Failure triage

Read full output and first causal failure; do not chase cascading assertions. Compare recent code/config/
dependency/environment changes. Re-run narrowly only to test a hypothesis. For intermittent failure, record
frequency and correlation; do not call one passing retry a fix.

## Test audit mindset

Look for tests that always pass, assert mocks instead of behavior, omit assertion, swallow errors, use
`skip`/`only`, snapshot unstable noise, duplicate production logic, depend on order/time/shared data, retry
away defects or never run in CI. Verify CI conditions and exit propagation.

## QA mindset

- Start from user/system risk and contracts, not tool inventory.
- Independent-agent QA requires separate judgment/execution. In every mode, the QA posture still requires
  willingness and ability to block; a single-session logical pass must disclose its reduced independence.
- Seek counterexamples and failure recovery; happy path is necessary but insufficient.
- Determinism is engineered through control and observability, not longer sleeps.
- Coverage breadth, assertion depth and environment fidelity are trade-offs.
- A test suite is production software: readable, owned, observable and maintainable.
- Distinguish “not observed,” “not tested,” “cannot reproduce” and “verified absent.”
- Preserve acceptance scope; do not invent product requirements through testing.

## Sign-off discipline

PASS states what ran, where, against which build/data and residual risk. FAIL states minimal repro and owner.
NEEDS_ENVIRONMENT states the exact missing capability/artifact. Never use confidence language to replace
fresh evidence.
