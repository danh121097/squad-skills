# Coordination worked decisions

Read when routing, ownership, execution mode or a gate outcome is ambiguous. The lead's artifact is the
decision, not the code, so these examples are decisions.

Every example is **constructed** from this skill's own hard gates and the role contract the squad skills
share. None is drawn from a run this catalog recorded; treat them as calibration, not as measured results.

## 1. Requested parallelism the ownership cannot support

**Context:** `--devs 3` is requested, and two of the three slices both edit a shared contract file.

**Decision:** Split by capability, not by the requested number. Run the isolated slice in parallel,
serialize the two that overlap under one owner at a time, and report the reduced parallelism as a decision
with its reason. Two owners in one file is a merge conflict the pipeline cannot gate.

## 2. Single session is an execution-shape change, not a detail

**Context:** No delegation engine is available, so the lead would carry every role itself.

**Decision:** Say so before starting, get acceptance for the changed shape, and label every gate as a
logical pass rather than an independent one. A self-review reported as an independent QA or Review verdict
is the failure this pipeline exists to prevent.

## 3. `NEEDS_ENVIRONMENT` is neither a failure nor a pass

**Context:** QA cannot reach a required service, so it returns `NEEDS_ENVIRONMENT` rather than a verdict.

**Decision:** It returns to the lead, not to the implementing role. Resolve the smallest missing
capability, access or artifact, then resume at the blocked gate. It is not eligible for `done`, and
inferring a pass from "it probably works" ends the pipeline's only guarantee.

## 4. A proven cause comes before an owner

**Context:** A failing test is reported and the owning layer is not yet established.

**Decision:** Run the diagnosis stage first — an installed bugfix skill, or its evidence-first contract
applied inline — and assign the slice only once the cause is proven. Assigning on the symptom routes the
work to whoever happens to own the file the error surfaced in. Do not nest a second orchestrator inside
this one.

## 5. Design routing is about unresolved decisions, not about UI

**Context:** One task restyles a component against an accepted token; another changes a flow's steps,
hierarchy and copy.

**Decision:** The first goes straight to the build role: no UX decision is open. The second gets the
Designer stage first, because implementing it means deciding it, and a build role deciding flow silently
is how a redesign ships as a fix.

## 6. Not every goal needs a squad

**Context:** The whole goal is one slice, one owner and one file.

**Decision:** Run that role directly and keep the gates. Coordination has a cost, and paying it for a
single slice buys handoffs rather than quality.
