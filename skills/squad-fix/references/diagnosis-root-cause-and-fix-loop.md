# Diagnosis, root cause, and fix loop

Read for non-trivial bugs, unclear causality, intermittent failures, regressions or repeated fix attempts.

## 1. Establish the baseline

Record before edits:

- exact error/assertion/observed behavior without paraphrasing away identifiers;
- expected behavior from acceptance, contract, tests or verified product decision;
- smallest real operational path, input/data/permissions/timing and environment that triggers it;
- version/commit/build/config/dependency/browser/device/service context when relevant;
- safe logs, trace, network, screenshot, query/plan or test artifact with secrets and personal data redacted.

Prefer deterministic reproduction. When runtime reproduction is impossible but source/contract evidence
proves the defect—for example an invalid import or unscoped authorization query—record the static proof and
why execution is unnecessary. Do not claim a runtime reproduction from static reasoning.

## 2. Trace and test hypotheses

Start at the earliest observable divergence, then trace backward through callers, contracts, state/data and
environment. Separate primary failure from cascading errors. Compare known-good and failing paths; inspect
recent relevant change evidence when available, without assuming the newest commit is guilty.

For each hypothesis state the predicted observation and run the narrowest safe check that can falsify it.
Do not edit code to “see if it helps.” If evidence is unavailable, request the smallest artifact/access
needed or return `NEEDS_ENVIRONMENT` through QA when the missing target blocks verification.

## 3. Root-cause contract

Before implementation, be able to state:

1. **Symptom:** exact externally or operationally visible failure.
2. **Reproduction or proof:** deterministic path/command or static contract evidence.
3. **Expected versus actual:** one concrete statement each.
4. **Root cause:** exact defective condition, line/path or broken invariant—not its downstream effect.
5. **Why now:** change, data shape, timing, environment or previously uncovered path that exposed it.
6. **Blast radius:** callers, consumers, contracts, data, platforms, tests and operational paths sharing it.

If any item remains “probably,” continue diagnosis or stop for evidence. A trivial syntax/type/lint error can
satisfy this contract quickly; `--quick` reduces ceremony but never permits guessing.

## 4. Select the repair

Choose the smallest repository-native change that restores the broken invariant and acceptance behavior.
Preserve public contracts unless changing one is explicitly accepted. Reuse existing validation, error,
state, transaction, component and test patterns. Add defense at more than one layer only when each layer
prevents a distinct real failure.

For schema/data mutation, identify the target first. Shared/persistent/staging/production targets require
appropriate recoverable backup and credible restore/rollback or roll-forward controls before mutation.
An isolated disposable local/test target requires proven recreation/reset plus deterministic fixtures.

## 5. Verify and prevent

Rerun the exact baseline first. Add regression evidence that would fail without the repair and asserts
behavior rather than implementation trivia. Then verify the mapped blast radius: callers, contracts,
permissions, lifecycle/concurrency, data compatibility, type/lint/build and performance/operations as
applicable.

Do not weaken assertions, increase sleeps/retries, swallow errors, reset user data, bypass authorization or
change expected behavior merely to turn a check green.

## 6. Retry discipline

If verification fails, compare new evidence with the root-cause model before another edit. Re-diagnose when
the prediction was wrong. After three cause-aligned attempts fail, stop: list each attempted cause/fix and
result, question the architecture or assumption, and ask for the smallest decision/evidence needed. Do not
continue random churn.
