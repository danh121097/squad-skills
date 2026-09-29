# Diagnosis, root cause, and fix loop

Read for non-trivial bugs, unclear causality, intermittent failures, regressions or repeated fix attempts.

## 1. Establish the baseline

Record before edits: the exact error/assertion/observed behavior with identifiers intact; the expected
behavior from acceptance, contract, tests or a verified product decision; the smallest real operational path,
input, data, permissions, timing and environment that triggers it; the version/commit/build/config context
when relevant; and safe artifacts (logs, trace, network, query plan, test output) with secrets and personal
data redacted.

Prefer deterministic reproduction. When runtime reproduction is impossible but source/contract evidence
proves the defect—for example an invalid import or unscoped authorization query—record the static proof and
why execution is unnecessary. Do not claim a runtime reproduction from static reasoning. Without Git history,
state that "why now" history is unavailable rather than inventing an introducer.

## 2. Build a red-capable loop before hypothesizing

A red-capable loop is one command you have already run that goes red on this exact symptom and green once the
defect is gone. Build one before hypothesizing: reading code to construct a theory without it is how a run
repairs a nearby defect instead of the reported one. Where section 1's static proof already establishes the
defect, record why no loop is needed and carry on. Under `--quick` on a narrow single-owner defect the loop
is the one failing check, taken as it stands: no tightening, no minimization.

Take the cheapest construction that still drives the real code path: a failing test at the seam nearest the
defect, then an HTTP call, CLI diff, headless browser script, replay of a captured payload or trace, a minimal
harness with the rest stubbed, a randomized-input loop for intermittently wrong output, a scripted bisection
or a differential run of two versions or configs.

Then tighten it. Cut setup until it finishes in seconds, assert the user's exact symptom rather than the
absence of a crash, and pin time, seeds, filesystem and network until the verdict repeats.

For an intermittent failure the target is a reproduction rate high enough to debug against, not a clean
single repro. Loop, parallelize, add load, narrow the timing window or inject delay at the suspected race
until the rate is workable, and record that rate with the baseline.

Once the loop is red, shrink the scenario to the smallest one that stays red, cutting inputs, callers, config,
data and steps one at a time until removing any remaining element turns it green. What survives is
load-bearing and becomes the regression test.

When no loop can be built and no static proof stands, say so with what was tried, and ask for the one thing
that unblocks it: an environment that reproduces, a redacted artifact such as a HAR file, log dump or
timestamped recording, or authority to add temporary instrumentation. Continue on evidence, never on an
untested theory.

## 3. Trace and test hypotheses

Start at the earliest observable divergence and trace backward through callers, contracts, state/data and
environment, separating the primary failure from cascading errors. Do not assume the newest commit is guilty.

Generate three to five ranked falsifiable hypotheses before testing any of them; a single hypothesis anchors
the run on the first plausible idea. `--quick` reduces this to the one hypothesis the evidence already names,
and never permits guessing. Each states the observation that would kill it — "if X is the cause,
changing Y removes the symptom" — and one that cannot state its prediction is sharpened or dropped. Where the
session can reach the user, show the ranked list before testing: domain knowledge re-ranks it in seconds and
an already-ruled-out cause is cheap to learn. Proceed on your own ranking when no answer arrives.

Run the narrowest safe check that can falsify the top hypothesis, changing one variable at a time. Do not edit
code to “see if it helps.” Tag every temporary probe with a unique marker such as `[DEBUG-a4f2]` so removal is
one grep. For a performance regression measure first: establish a baseline number with a timing harness,
profiler or query plan, then bisect against it. If evidence is unavailable, request the smallest
artifact/access needed or return `NEEDS_ENVIRONMENT` through QA when the missing target blocks verification.

## 4. Select the repair

Preserve public contracts unless changing one is explicitly accepted. Reuse existing validation, error,
state, transaction, component and test patterns. Add defense at more than one layer only when each layer
prevents a distinct real failure.

For schema/data mutation, identify the target first. Shared/persistent/staging/production targets require
appropriate recoverable backup and credible restore/rollback or roll-forward controls before mutation.
An isolated disposable local/test target requires proven recreation/reset plus deterministic fixtures.

## 5. Verify and prevent

Rerun the exact baseline first. Add regression evidence that would fail without the repair and asserts
behavior rather than implementation trivia, at a seam that exercises the defect as it occurs at the real call
site. When the only reachable seam is too shallow to carry that pattern — a single-caller test for a defect
that needs several, a unit test that cannot build the chain that triggered it — record the shortfall as a
finding: the architecture is what prevents this defect from being locked down. Report it with the repair and
route it as separately scoped work, rather than shipping a test that passes without covering the bug.

Do not weaken assertions, increase sleeps/retries, swallow errors, reset user data, bypass authorization or
change expected behavior merely to turn a check green.

## 6. Retry discipline

If verification fails, compare new evidence with the root-cause model before another edit, and re-diagnose
when the prediction was wrong. At the loop cap in the entrypoint's stop conditions, list each attempted
cause/fix and result and question the architecture or assumption.
