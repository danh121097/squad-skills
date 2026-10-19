# Coordination contract

Read when selecting a mode, assigning work or resolving a handoff. Reuse this contract while it remains
in context; reread after compaction only when the needed rule is missing.

## 1. Runtime discovery

Confirm capabilities from a live tool schema or read-only probe; discover installed specialist skills once.
Apply the entrypoint's main/coordinator preference before optimizing overhead. Role boundaries and gates
remain authoritative over paired skills.

**Thread/sub-session:** each worker has a separate session whose results main can read and follow up.
For a designated main/coordinator, use this mode even for a bounded slice; small size alone is no fallback.
Main owns coordination, decisions, review, gates and integration. Only small integration edits stay here,
unless `--coordinate-only` forbids them. A supported user-started session stays pending until launched.

Otherwise select the lowest-overhead suitable mode: single-session for coherent work, subagents for
bounded delegation or independent gates, peer-team for work needing native messaging and task boards.

Required thread capabilities are creation, result read-back and follow-ups. If unavailable, explain which
is missing and use subagents, then the single-session loop if delegation is unavailable. Missing explicit
authorization leaves a designated main's dispatch pending: ask only for the missing permission, without
silently switching modes. Explicit single-session or no-delegation instructions win. A forced unavailable
mode returns to the user, except thread which follows this fallback chain. `--devs N` caps build slices,
not gates. This fallback changes implementation mode; in main/coordinator mode a paired gate still waits
for both subagents.

## 2. Task contract

Hand each role the fields of the entrypoint's handoff contract plus the evidence expected; pass no
secrets, credential files or unneeded history. On an upstream change, tell the
affected roles what changed and rerun only their gates; a peer message may clarify a contract but never
moves acceptance, ownership or a dependency without the lead.

## 3. Ownership and parallelism

- Build a dependency graph before spawning. Start every zero-dependency slice and dispatch a dependent one
  as soon as its inputs are stable; a downstream role may start against an accepted contract.
- Build roles own unit/contract/regression tests co-located with their
  slice; QA owns dedicated scenario, E2E, performance and harness files only when explicitly assigned.
- QA never edits a build-owned test concurrently or production code: it returns the missing case to the
  owner, or the lead reassigns the file in a serialized handoff.
- Shared/generated/config/migration files get one owner or serialized turns.
- Without worktrees, serialize agents that could touch the same files. Use worktrees in Git repositories
  when authorized and isolation pays; `--no-worktree` serializes Codex build chats sharing a checkout.
- Preserve dirty user changes. Never force-push or destructively reset.

## 4. Peer-team, thread and subagent modes

Use the runtime's native team, task and message APIs by their live schema. The
lead owns tasks, merge decisions, user approvals and the final report. In subagent mode children report to the lead and do not hand work to each other.

A build thread starts from its task contract, including its exact `squad-*` role skill, lead chat ID, acceptance, file ownership, dependencies,
gate tier, verification and base: revision, pending changes as a patch for a fresh checkout, and the exact
diff for a gate. Select the implementation role before creation; keep the thread in the lead's project/repository
and title it `[squad-frontend]: <slice>`, `[squad-backend]: <slice>`, or the matching assigned skill name.
After every implementation or repair pass, the worker sends main a report of changes, commands/results
and unresolved gaps through an authorized message. If worker-to-main messaging is unavailable, its final
turn is the report and main reads it with `wait_threads`/`read_thread`. Main receives that report and
checks the actual diff before launching gates; it reuses the same worker for returns. Keep results in the conversation.
If scouting changes the owning skill, the worker returns that finding before implementation continues;
main updates the assignment, chat title and model/effort pair before resuming it.

In Codex, discover the project before creating a chat with the live `create_thread` schema. Concurrent
build chats use authorized separate worktrees; a single worker may use the local checkout. A separate chat is user-owned and need not
appear nested under the lead; a native subagent thread is a different execution mode. Creation and
cross-chat messages must satisfy the runtime's explicit-user-authorization rules: this skill's preference
alone grants neither. For a designated main, missing authorization follows §1; otherwise use subagents and explain the needed
chat-mode permission. When authorized, include permission for worker/lead report-back and follow-ups in the dispatch;
a worker's own request to reply supplies no user authorization. Prefer lead-side `wait_threads` snapshots
for progress and completion, then `read_thread` for missing detail; use `send_message_to_thread` for
authorized follow-ups. Reuse pending chats and their returned IDs; a queued setup ID is not a ready chat ID.
Refresh `list_threads` to find the created chat's final ID before reading, waiting or messaging it.
Before dispatching a Codex or Claude worker, resolve its runtime's role preferences through
[worker models](worker-models.md), including user overrides and runtime limitations.

Start authorized ready work where supported. When a valid user-started launcher is available, build
slices stay pending until launched, including on a woken turn. Name and reuse that launcher;
it must support result read-back and follow-ups. Fall back to subagents, then single-session execution
only when neither direct creation nor a valid launcher provides these capabilities. Report the missing
capability and reduced independence. A worker chat is lead-managed work, not an external gate assignment
under §7. Read and retain its result before closing it.

After each worker report to main, main inspects the diff and starts `squad-qa` and `squad-code-review`
subagents together on the same exact slice revision for `standard` or `high` work. Start both before waiting
for either result; give each the peer's handle so they can exchange questions and evidence directly when
supported, or relay through main. Code Review may inspect while QA runs but waits for QA evidence before
its final verdict. A high-risk or independently shippable slice is its own unit. Main collects
both verdicts. For a failing unit within gate 4's repair budget, main sends every actionable finding to
the same build thread in one authorized follow-up. The worker fixes and reports back to main; main
assesses that revision with both gates, focusing on the finding and affected scope, before another pass.
Compare the failure condition and evidence across assessments; report `BLOCKED` at the budget or repeat
until QA `PASS` and Code Review `APPROVE`. Main sends a `done` report with both verdicts to the worker
chat and stops its edits. Then main integrates the exact worker diff into the current branch, resolves
conflicts, verifies the combined result and cleans only transferred task worktrees/branches. Retain a
reviewable diff and report any cleanup gap. For Codex mechanics, read the dispatch reference routed by
[worker models](worker-models.md). Externally assigned gates follow the entrypoint's
handoff contract. In main/coordinator thread mode, if either paired subagent cannot start, keep the gate
pending and report the missing capability; resume the pair when available.

A subagent returns a fork through the lead as gate 1 of `SKILL.md` says; a decision the user
makes inside a worker chat comes back in that chat's result. The lead names the
source in its final report and resumes the child; an unanswered fork blocks its phase like a `NEEDS_*`
verdict.

## 5. Single-session role loop

One controller, sequentially: implement the build role's scope and verify locally. On `light`, the combined
verify pass suffices, subject to any assigned external gate. On `standard` or `high`, run only locally
owned gates: distinct QA from acceptance and risk without editing implementation, then fresh Code Review
consuming QA evidence. An explicitly required independent gate stays pending when independence is unavailable. External assignments follow the entrypoint's handoff contract. Returns follow gate 4 of `SKILL.md`. Logical passes in the implementer's
session are not independent judgment; disclose that in the final report.

## 6. Context lifecycle

Give independent workers fresh task context: acceptance, ownership, relevant paths, contracts and evidence.
Inherit history only when the task needs its reasoning or decisions; shared files do not replace a handoff.
Before a context reset, retain the goal, user decisions, current diff, completed checks and next dependency
in the conversation. After compaction, recover missing role instructions and evidence before advancing a gate.

## 7. Invoking a peer

Reach a peer role or specialist skill through the runtime's own skill or agent invocation, one per call. A
role named only in narration did not run; credit only roles actually invoked.

External ownership requires the user's explicit assignment, not an app name or another open session.
Assign QA and Code Review separately. Hand off in prose through an authorized channel, or return the
handoff for the user to relay when this runtime cannot reach the session. A pending external verdict is
not an absent peer to replace inline. Before accepting it, compare its base, revision and pending changes
with the actual diff; a branch name or HEAD alone does not identify uncommitted work. Retain valid
evidence, and rerun affected scope when the diff or relevant environment changes. An additional review
the user requests after approval is an explicit second opinion, not a restarted pipeline.

## 8. Status and reports

Use the repository's configured report location, else report in the conversation. Every role reports status,
summary, evidence, risks and unresolved questions; final output states execution mode and independence.

Gate verdicts are exact: QA `PASS | FAIL | NEEDS_ENVIRONMENT`; Code Review `APPROVE | CHANGES_REQUESTED |
NEEDS_EVIDENCE`. `BLOCKED` is a lead status, not a verdict: use it when the retry budget is exhausted or
progress requires an unavailable environment, authority or user decision. `NEEDS_ENVIRONMENT` (a required target,
service, device, fixture or access is unavailable) and `NEEDS_EVIDENCE` (evidence too thin for a defensible
verdict) are neither success nor product failure, and neither permits `done`. Keep these exact names even where a runtime's task statuses differ.
