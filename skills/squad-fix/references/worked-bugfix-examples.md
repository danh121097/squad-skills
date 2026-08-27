# Worked bugfix examples

Read when ownership, Designer routing, evidence sufficiency or scope is ambiguous. Adapt the reasoning; do
not copy conclusions without matching repository evidence.

## 1. Checkout button shows a generic error

**Symptom:** Web UI displays “Something went wrong.”

**Evidence:** Browser request receives HTTP 200 with a response shape different from the published schema;
Frontend handles the documented error shape correctly.

**Route:** Backend owns contract compatibility and its regression test. Frontend verifies the corrected
response path. Do not patch the client to support an accidental undocumented shape unless compatibility is
an accepted requirement.

## 2. Modal close icon is misaligned

**Evidence:** The component uses a stale spacing token while accepted Figma/local modal patterns are clear.

**Route:** Frontend fixes the token/component and regression/visual evidence. Designer is unnecessary because
no UX/UI decision is unresolved.

## 3. Failed upload needs a new recovery flow

**Evidence:** Existing product has no accepted retry/cancel/resume behavior and the repair changes flow,
hierarchy, copy and state transitions.

**Route:** Designer defines the recovery contract; Frontend or Mobile implements it; QA covers interruption,
retry, duplicate submission and accessibility; Review gates. This is still a bugfix only if restoring an
accepted/required outcome—not a disguised unrelated redesign.

## 4. Mobile crashes after background resume

**Evidence:** API contract is stable; stack trace shows a disposed controller/state object accessed during
the app lifecycle transition.

**Route:** Mobile owns lifecycle cleanup/state restoration and a regression test around background/process
resume. Backend only participates if contract timing or token refresh semantics are actually broken.

## 5. Migration fails only in CI

**Evidence:** Migration works against representative old schema locally; CI starts from an empty database
with migrations applied out of order because the pipeline glob sorts differently.

**Route:** DevOps owns pipeline ordering/configuration; Backend verifies migration dependency assumptions and
schema outcomes. Persistent/shared targets still require appropriate recovery controls before mutation.

## 6. Flaky E2E test passes after retries

**Evidence:** Production behavior is correct; test waits a fixed duration for an observable readiness event
and fails under load.

**Route:** QA owns the assigned E2E synchronization/fixture repair. Do not increase arbitrary sleeps or hide
the failure with retries. If the application never emits a reliable state/contract needed by real users or
tests, route that missing behavior to the owning build role instead.

## 7. Unknown cross-stack timeout

**Evidence:** Browser aborts at 30 seconds, API logs show a slow query, and the database plan demonstrates a
missing index caused by a new query shape.

**Route:** Backend owns query/index correction and performance regression evidence; Frontend verifies
cancellation/error UX but does not mask the server defect with a longer timeout. Use `squads-team` only if
these become independent implementation slices that warrant coordination.
