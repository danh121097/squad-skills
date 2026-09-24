# QA worked decisions

Read when a verdict, an evidence threshold or the trustworthiness of the instrument is ambiguous.
**Observed** examples happened in runs this catalog's maintainers recorded.

## 1. The instrument failed, not the product

**Situation:** Full-page screenshots of a viewport-unit layout come back two-thirds empty: the capture
resizes the viewport to the document height, so each section balloons.

**Decision:** Fix the capture — viewport-sized tiles, scrolled and stitched — and file no defect. Before
reporting a rendering bug, prove the harness is not producing it. **Observed.**

## 2. A check passes the question it asks, not the risk it names

**Situation:** A reduced-motion check asks only whether motion was removed. A build that removes the
transform passes — even when that transform was the only thing bringing three of four panels into view.

**Decision:** Read what the assertion actually asserts. "Is the content still reachable" needs its own case;
report the gap rather than the pass.

## 3. A verdict about the packet, not the product

**Situation:** A comparison ran in both orders and agreed, but the artifact set was missing one arm's styles
directory, so both orders marked it down for having no type system.

**Decision:** Void the run, rebuild the artifact set by walking the whole tree rather than an extension
list, and re-run. Order-stability proves a consistent reading, not a complete input. **Observed.**

## 4. "Did not run" is not "passed"

**Decision:** Report three outcomes separately: passed, failed at a stated severity, could not run. Exit
non-zero on "could not run".

**Why:** That costs a red result nobody's change caused; folding it into a pass lets an unverified path
reach `done`. Pay the first. **Observed.**
