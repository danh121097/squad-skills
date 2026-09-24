# Worked bugfix examples

Read when ownership, Designer routing, evidence sufficiency or scope is ambiguous.

## 1. Checkout button shows a generic error

**Evidence:** HTTP 200 with a shape that differs from the published schema; Frontend handles the documented
shape correctly.

**Route:** Backend owns contract compatibility and the regression test; Frontend verifies the corrected
path. Do not patch the client to accept the accidental shape unless compatibility is required.

## 2. Failed upload needs a new recovery flow

**Evidence:** No accepted retry/resume behavior exists; the repair changes flow, copy and states.

**Route:** Designer defines the recovery contract; Frontend or Mobile implements it. It stays a bugfix only
while it restores an accepted or required outcome — otherwise it is a redesign, out of scope here.

## 3. Migration fails only in CI

**Evidence:** Works locally; CI applies migrations out of order because the pipeline glob sorts
differently.

**Route:** DevOps owns pipeline ordering; Backend verifies the migration's dependency assumptions.

## 4. Flaky E2E test passes after retries

**Evidence:** Production behavior is correct; the test waits a fixed duration for a readiness event and
fails under load.

**Route:** QA repairs the synchronization — no longer sleeps, no retries hiding the failure. If the app
never emits a reliable readiness state users or tests need, route that missing behavior to the build role.

## 5. Unknown cross-stack timeout

**Evidence:** The browser aborts at 30 seconds; the query plan shows a missing index for a new query shape.

**Route:** Backend fixes the index; Frontend never masks the server defect with a longer timeout.
