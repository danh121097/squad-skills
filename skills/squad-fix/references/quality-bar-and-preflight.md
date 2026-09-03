# Quality bar and pre-flight

Read before declaring a repair complete. Every check is performed against the recorded baseline and the
repository's own commands, so the pass holds with no other skill installed.

## What weak bugfix output looks like

- The symptom patched where it surfaced: a tolerant client parser for a broken server contract, a longer
  timeout over a slow query, a caught exception where the state machine is wrong.
- A probable cause implemented. Nothing was proven; the failure merely stopped appearing.
- No pre-fix baseline captured, so nothing can prove the symptom is gone rather than moved.
- Verification inflated — a static proof or a unit run reported as browser, integration or live evidence.
- A flaky test quieted with sleeps or retries while the missing readiness signal stays missing.
- The fix broadened into a refactor once verification exposed something else, without the user hearing it.
- Regression evidence missing, or written into a file another role owns.
- Designer pulled in for a defect that follows an established local pattern, or skipped when the repair
  actually changes accepted flow, hierarchy or copy.
- The same failure attacked a fourth time with the same theory.

## Pre-flight

Pass every applicable check honestly.

### Cause

- Symptom, minimal repro or static proof, expected versus actual, the exact defect, and why it surfaced now.
- Blast radius mapped: callers, consumers, contracts, data, permissions, timing and supported platforms.
- The implementation owner follows the broken contract, not the layer where the symptom appeared.

### Fix

- Smallest cause-aligned change; unrelated user changes and public contracts left intact.
- A regression guard that fails without the fix, living in a file its owner owns.
- Prevention named: the check, type, constraint or test that would have caught this earlier.

### Verification

- The original reproduction rerun on the same path, then the blast radius exercised.
- Each level reported for what it is: static, focused test, build, integration, browser or device, CI, live.
- Task-owned processes, ports and temporary resources stopped.

## Proof to hand over

Give the pre-fix baseline and the post-fix result, the root cause, the files and contracts changed, the
checks at the level they actually ran, QA and Code Review verdicts with their independence level, and the
residual risk. A side effect outside accepted scope stops the work and goes to the user with options; it is
never absorbed silently.
