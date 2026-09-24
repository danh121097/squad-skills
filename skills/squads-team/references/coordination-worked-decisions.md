# Coordination worked decisions

Read when routing, ownership, execution mode or a gate outcome is ambiguous. Every example is
**constructed** from this skill's hard gates and the shared role contract, not from a recorded run.

## 1. Requested parallelism the ownership cannot support

**Situation:** `--devs 3` is requested, and two of the three slices edit a shared contract file.

**Decision:** Split by capability, not by the requested number: run the isolated slice in parallel,
serialize the overlapping two under one owner at a time, and report the reduced parallelism with its reason.

**Why:** Two owners in one file is a merge conflict the pipeline cannot gate.

## 2. Single session is an execution-shape change

**Situation:** No delegation engine is available, so the lead would carry every role.

**Decision:** In `auto`, name the missing capability and the resulting shape, then run — the mode was
selected from what exists, so the user has nothing to decide. Ask only when the user forced an unavailable
mode. Either way, label every gate a logical, non-independent pass.

## 3. A proven cause comes before an owner

**Situation:** A failing test is reported and the owning layer is not established.

**Decision:** Run diagnosis first — an installed bugfix skill, or its evidence-first contract inline — and
assign the slice once the cause is proven. Never nest a second orchestrator inside this one.

**Why:** Assigning on the symptom routes work to whoever owns the file the error surfaced in.

## 4. Parallel work follows the dependency frontier

**Situation:** Backend owns an accepted API contract and its implementation; Frontend consumes it; an
unrelated DevOps slice owns CI configuration.

**Decision:** Start all three once ownership is isolated. Frontend builds against the accepted contract
without waiting for the implementation; only API-dependent QA and integration wait for the executable API.
Independent slices enter their own gates as soon as they finish.

**Why:** Dependencies bound parallelism, not phase labels.

## 5. An upstream change invalidates only affected work

**Situation:** Backend changes the accepted error shape while Frontend and DevOps are running.

**Decision:** Send Frontend a `DELTA` naming the new revision and the checks to rerun; its gate verdicts are
invalidated. DevOps keeps its verdicts and is not interrupted — it consumes nothing that changed. A peer
message alone cannot move the contract.
