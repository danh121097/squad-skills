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

**Decision:** What the missing engine changes is the reporting, not the permission to start. In `auto`,
name the missing capability and the resulting shape before starting, then run: the mode was selected from
what exists, so there is nothing for the user to decide. Ask for direction only when the user forced a
mode that is unavailable, because then the request and the runtime disagree and the lead cannot resolve
that alone. Either way, label every gate a logical pass rather than an independent one. A self-review
reported as an independent QA or Review verdict is the failure this pipeline exists to prevent, and it is
the reason the shape is announced at all.

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

## 7. Parallel work follows the dependency frontier

**Context:** Backend owns an accepted API contract and its implementation. Frontend consumes that contract;
an unrelated DevOps slice owns CI configuration.

**Decision:** Start all three once ownership is isolated. Frontend may build against the accepted contract
without waiting for Backend implementation; only API-dependent QA and integration wait for the executable
API. Independent UI and CI slices enter their own gates as soon as they finish. Parallelism is bounded by
dependencies, not by phase labels.

## 8. An upstream change invalidates only affected work

**Context:** Backend changes the accepted error shape while Frontend and DevOps are running.

**Decision:** The lead sends Frontend a `DELTA` naming the new context revision, invalid assumptions and
checks to rerun. Frontend acknowledges before continuing. DevOps receives no interruption because its inputs
did not change. A peer message alone cannot silently move the contract, and the stale Frontend result cannot
advance to QA.

## 9. Per-run thread authority preserves the outcome boundary

**Context:** One feature has Backend, Frontend and QA slices plus a separately followable research outcome.
The user grants `--allow-new-threads`, and the runtime supports child agents and top-level user threads.

**Decision:** Keep the feature slices under the current lead and use child agents. Create one research
thread under one stable per-run key, with its own acceptance and `CONTEXT` packet, then report its identity.
The blanket authority removes repeated confirmation; it does not turn roles, gates, worktrees or ordinary
parallelism into user-visible tasks, and it expires with the run.
