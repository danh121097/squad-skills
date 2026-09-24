# DevOps worked decisions

Read when a delivery, pipeline-trust or supply-path decision is ambiguous. **Observed** examples happened in
a run this catalog's maintainers recorded.

## 1. One contract asserted in three places

**Situation:** The packaged file list lived in the manifest, a release-readiness check and a
package-contents check. They disagreed on one entry; the release gate went red, and because it was the only
job running the full suite, tests, build and packaging did not run for six days.

**Decision:** Pin a multi-owner contract in a test, not prose, and fix every copy in one commit. Then check
what else the red gate was silently skipping.

**Why:** The visible failure was one file name; the damage was six days of unrun checks. **Observed.**

## 2. The pipeline enforces isolation, not the reviewer

**Situation:** A private artifact store must stay unreachable from CI. Review can miss a workflow that names
its variable, triggers on a fork-writable event, or reads a stored secret.

**Decision:** Assert all three in a validator the gate runs, so breaking isolation fails the build.
**Observed.**

## 3. Never path-filter the product's own payload

**Situation:** Ignoring documentation changes in CI looks like a cheap saving.

**Decision:** Not when the shipped product is those files. Filter only what provably cannot affect the
artifact. **Observed:** this catalog's payload is Markdown.

## 4. A third-party check does not belong in the blocking gate

**Situation:** Link liveness fails on external hosts' state, not the change under test.

**Decision:** Run it as its own non-blocking job on a maintainer-owned cadence and report to whoever can
fix it; keep the blocking gate offline and deterministic. **Observed.**
