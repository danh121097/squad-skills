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

Required capabilities are direct creation or a valid user-started launcher, plus read-back and follow-ups.
If unavailable, explain the gap and use subagents, then single-session execution if delegation is unavailable. Missing explicit
authorization leaves a designated main's dispatch pending: ask only for the missing permission, without
silently switching modes. Explicit single-session or no-delegation instructions win. A forced unavailable
mode returns to the user, except thread which follows this fallback chain. `--devs N` caps build slices,
not gates. Gate execution follows the effective execution mode, not the main label: single-session
fallback uses §5; explicit independent or external gates remain pending without their required evidence.

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

## 4. Delegated execution

Use the runtime's native tools by their live schema. The lead owns tasks, user decisions and integration.
Before using build chats, read [thread-handoff.md](thread-handoff.md). For subagent or peer-team dispatch,
read [worker models](worker-models.md) for the selected runtime only; give acceptance, ownership, base,
artifact path and required evidence. Children report forks to the lead; peer evidence exchange does not
transfer ownership. An unanswered fork blocks only its dependent work.

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
