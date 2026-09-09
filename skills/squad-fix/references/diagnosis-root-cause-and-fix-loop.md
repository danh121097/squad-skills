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

## 2. Build a red-capable loop before hypothesizing

A red-capable loop is one command you have already run that goes red on this exact symptom and green once the
defect is gone. Build one before hypothesizing: reading code to construct a theory without it is how a run
repairs a nearby defect instead of the reported one. Where section 1's static proof already establishes the
defect, record why no loop is needed and carry on. Under `--quick` on a narrow single-owner defect the loop
is the one failing check, taken as it stands: no ladder walk, no minimization.

Reach for the cheapest construction that still drives the real code path, in roughly this order.

1. A failing test at the seam nearest the defect.
2. An HTTP call against a running service.
3. A CLI invocation diffed against known-good output.
4. A headless browser script asserting on DOM, console or network.
5. A replay of a captured payload, event log or trace through the isolated path.
6. A minimal harness booting one service with the rest stubbed.
7. A randomized-input loop when the symptom is intermittently wrong output.
8. A scripted bisection between two known-good and known-bad states.
9. A differential run of two versions or configs over one input.
10. A scripted human-in-the-loop checklist whose captured output returns to the run.

Then tighten it. Cut setup and unrelated initialization until it finishes in seconds, assert the user's exact
symptom rather than the absence of a crash, and pin time, seeds, filesystem and network until the verdict
repeats. A thirty-second flaky loop and no loop are close to the same thing.

For an intermittent failure the target is a reproduction rate high enough to debug against, not a clean
single repro. Loop the trigger, parallelize it, add load, narrow the timing window or inject delay at the
suspected race until the rate is workable, and record that rate with the baseline.

Once the loop is red, shrink the scenario to the smallest one that stays red: cut inputs, callers, config,
data and steps one at a time, rerunning after each cut, until removing any remaining element turns it green.
What survives is load-bearing, which narrows the hypothesis space and becomes the regression test.

When no loop can be built and no static proof stands, say so with what was tried, and ask for the one thing
that unblocks it: access to an environment that reproduces, a redacted artifact such as a HAR file, log dump
or timestamped recording, or authority to add temporary instrumentation. Continue on evidence, never on an
untested theory.

## 3. Trace and test hypotheses

Start at the earliest observable divergence, then trace backward through callers, contracts, state/data and
environment. Separate primary failure from cascading errors. Compare known-good and failing paths; inspect
recent relevant change evidence when available, without assuming the newest commit is guilty.

Generate three to five ranked falsifiable hypotheses before testing any of them; a single hypothesis anchors
the run on the first plausible idea. `--quick` reduces this to the one hypothesis the evidence already names,
and never permits guessing. Each states the observation that would kill it — "if X is the cause,
changing Y removes the symptom" — and one that cannot state its prediction is sharpened or dropped. Where the
session can reach the user, show the ranked list before testing: domain knowledge re-ranks it in seconds and
an already-ruled-out cause is cheap to learn. Proceed on your own ranking when no answer arrives.

Run the narrowest safe check that can falsify the top hypothesis, changing one variable at a time. Do not edit
code to “see if it helps.” Prefer one breakpoint or REPL inspection over ten logs, and tag every temporary
probe with a unique marker such as `[DEBUG-a4f2]` so removal is one grep. For a performance regression measure
first: establish a baseline number with a timing harness, profiler or query plan, then bisect against it.

If evidence is unavailable, request the smallest artifact/access needed or return `NEEDS_ENVIRONMENT` through
QA when the missing target blocks verification.

## 4. Root-cause contract

Before implementation, be able to state:

1. **Symptom:** exact externally or operationally visible failure.
2. **Reproduction or proof:** deterministic path/command or static contract evidence.
3. **Expected versus actual:** one concrete statement each.
4. **Root cause:** exact defective condition, line/path or broken invariant—not its downstream effect.
5. **Why now:** change, data shape, timing, environment or previously uncovered path that exposed it.
6. **Blast radius:** callers, consumers, contracts, data, platforms, tests and operational paths sharing it.

If any item remains “probably,” continue diagnosis or stop for evidence. A trivial syntax/type/lint error can
satisfy this contract quickly; `--quick` reduces ceremony but never permits guessing.

## 5. Select the repair

Choose the smallest repository-native change that restores the broken invariant and acceptance behavior.
Preserve public contracts unless changing one is explicitly accepted. Reuse existing validation, error,
state, transaction, component and test patterns. Add defense at more than one layer only when each layer
prevents a distinct real failure.

For schema/data mutation, identify the target first. Shared/persistent/staging/production targets require
appropriate recoverable backup and credible restore/rollback or roll-forward controls before mutation.
An isolated disposable local/test target requires proven recreation/reset plus deterministic fixtures.

## 6. Verify and prevent

Rerun the exact baseline first. Add regression evidence that would fail without the repair and asserts
behavior rather than implementation trivia, at a seam that exercises the defect as it occurs at the real call
site. When the only reachable seam is too shallow to carry that pattern — a single-caller test for a defect
that needs several, a unit test that cannot build the chain that triggered it — record the shortfall as a
finding: the architecture is what prevents this defect from being locked down. Report it with the repair and
route it as separately scoped work, rather than shipping a test that passes without covering the bug.

Then verify the mapped blast radius: callers, contracts, permissions, lifecycle/concurrency, data
compatibility, type/lint/build and performance/operations as applicable.

Do not weaken assertions, increase sleeps/retries, swallow errors, reset user data, bypass authorization or
change expected behavior merely to turn a check green. Remove every tagged probe before handing over, and
verify removal by grepping its marker.

## 7. Retry discipline

If verification fails, compare new evidence with the root-cause model before another edit. Re-diagnose when
the prediction was wrong. After three cause-aligned attempts fail, stop: list each attempted cause/fix and
result, question the architecture or assumption, and ask for the smallest decision/evidence needed. Do not
continue random churn.
