# QA worked decisions

Read when a verdict, an evidence threshold or the trustworthiness of the instrument is ambiguous. Adapt
the reasoning to the target under test; do not copy a verdict without matching evidence.

Each example carries its provenance. **Observed** happened in a run this catalog's maintainers recorded;
**constructed** is derived from documentation and was not measured. Weigh them accordingly.

## 1. The instrument failed, not the product

**Evidence:** Full-page screenshots of a layout sized in viewport units come back two-thirds empty. The
capture resizes the viewport to the document height, so every viewport-sized section balloons and the rest
is pushed out of frame.

**Decision:** Fix the capture — take viewport-sized tiles while scrolling and stitch them — and file no
defect. Before reporting a rendering bug, prove the harness is not producing it.

**Observed:** the catalog's recorded design runs; every render kept from them is captured that way.

## 2. A gate passes the question it asks, not the risk it names

**Evidence:** A reduced-motion check asks only whether motion was removed. A build that honours the
preference by removing the transform passes it — including when that transform was the only thing bringing
three of four panels into view.

**Decision:** Read what the assertion actually asserts. A passing check covers its own question; the
follow-up — is the content still reachable — needs its own case. Report the gap rather than the pass.

**Observed:** the check's own question, recorded with the gap it leaves. **Constructed:** the build that
fails this way; no run measured one, because the harness could not build the arms the brief required.

## 3. A verdict about the packet, not about the product

**Evidence:** A comparison ran in both orders and agreed — and the artifact set was missing one arm's
styles directory, so both orders marked it down for having no type system.

**Decision:** Void the run, rebuild the artifact set by walking the whole tree rather than a curated
extension list, and re-run. Order-stability confirms the reading was consistent, not that the input was
complete.

**Observed:** the same exercise; those runs are recorded as void.

## 4. The environment cannot exercise the subject

**Evidence:** The harness builds offline with no installed dependencies, so any candidate it can score is
one that could not use the frameworks the brief requires.

**Decision:** `NEEDS_ENVIRONMENT`, naming the exact missing target. An instrument that cannot run the
subject produces no verdict about it, and a build scored under a contract it was not written to is not a
`FAIL`.

**Observed:** the same exercise, recorded as the reason its two rounds share no numbers.

## 5. "Did not run" is not "passed"

**Evidence:** A suite reports a low-severity failure in full and exits zero, but exits non-zero when a check
could not run at all.

**Decision:** Keep the three outcomes separate in the report: passed, failed at a stated severity, could
not run. Exiting non-zero on "could not run" costs a red result nobody's change caused; collapsing it into a
pass costs an unverified path reaching `done`. Pay the first.

**Observed:** this catalog's own evaluation runner separates the three by design.
