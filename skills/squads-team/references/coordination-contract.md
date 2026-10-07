# Coordination contract

Read at a phase boundary, before compacting or clearing, when reaching a peer role, and before selecting a
mode, spawning agents, assigning files, using worktrees or falling back to a single-session role loop.

## 1. Runtime discovery

Count a capability — agent teams, subagents, worktrees, task boards, named squad skills — only after a
read-only probe confirms it in this run; otherwise choose the next lower safe mode and say what was missing.
Detect specialist skills once per run from the live skill catalog. Role boundaries, gates and evidence rules
stay authoritative over a paired skill; `domain-coverage-contracts.md` stands in for an absent role skill.

Select the lowest-overhead safe mode that preserves ownership and risk-appropriate independence:

1. **Single-session:** a small, coherent or low-risk change where distinct logical passes suffice.
2. **Subagent:** bounded slices or an independent gate materially improve concurrency or risk coverage.
3. **Peer-team:** several independent slices and gate handoffs justify native messaging and task boards.

A forced mode that is unavailable returns to the user; in `auto`, fall back and report it. `--devs N` caps
concurrent build slices — never a quota of tasks and never a count of gates.

## 2. Task contract

Hand each role its outcome, acceptance criteria, owned files, the contracts it may not move, and the
evidence expected; never secrets, credential files or unneeded history. On an upstream change, tell the
affected roles what changed and rerun only their gates; a peer message may clarify a contract but never
moves acceptance, ownership or a dependency without the lead.

## 3. Ownership and parallelism

- Build a dependency graph before spawning. Start every zero-dependency slice and dispatch a dependent one
  as soon as its inputs are stable; a downstream role may start against an accepted contract.
- One owner edits each file at a time. Build roles own unit/contract/regression tests co-located with their
  slice; QA owns dedicated scenario, E2E, performance and harness files only when explicitly assigned.
- QA never edits a build-owned test concurrently or production code: it returns the missing case to the
  owner, or the lead reassigns the file in a serialized handoff.
- Shared/generated/config/migration files get one owner or serialized turns.
- Without worktrees, serialize agents that could touch the same files. Use worktrees only in a Git
  repository, when supported, and when isolation benefit exceeds merge cost.
- Preserve dirty user changes. Never force-push or destructively reset.

## 4. Peer-team and subagent modes

Use the runtime's native team, task and message APIs by their live schema; respect concurrency limits. The
lead owns tasks, merge decisions, user approvals and the final report, and dispatches each task as its
dependencies clear. In subagent mode children report to the lead and do not hand work to each other.

Once a coherent gate unit is ready, launch its locally owned QA and Code Review passes together over the
same exact slice revisions; externally assigned gates follow the entrypoint's handoff contract. A
high-risk or independently shippable slice is its own unit. Fixes return to the same owner.

A child has no channel to the user, so it returns a fork as gate 1 of `SKILL.md` says. The lead names the
source in its final report and resumes the child; an unanswered fork blocks its phase like a `NEEDS_*`
verdict.

## 5. Single-session role loop

One controller, sequentially: implement the build role's scope and verify locally. On `light`, the combined
verify pass suffices, subject to any assigned external gate. On `standard` or `high`, run only locally
owned gates: distinct QA from acceptance and risk without editing implementation, then fresh Code Review
consuming QA evidence. External assignments follow the entrypoint's handoff contract; collect both gates'
findings before any return. Returns follow gate 4 of `SKILL.md`. Logical passes in the implementer's
session are not independent judgment; disclose that in the final report.

## 6. Context lifecycle

At a phase boundary, continue when the next phase needs this one as a primary source; otherwise compact, and
give QA and Code Review a child agent where the mode allows, since the implementer's reasoning costs a gate
its independence.

## 7. Invoking a peer

Reach a peer role or specialist skill through the runtime's own skill or agent invocation, one per call. A
role named only in narration did not run, and a report must not credit it.

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
NEEDS_EVIDENCE`. `BLOCKED` is a lead status, not a verdict: a third return for one unit, counted across
both gates, or a `NEEDS_*` still missing after its one resolution. `NEEDS_ENVIRONMENT` (a required target,
service, device, fixture or access is unavailable) and `NEEDS_EVIDENCE` (evidence too thin for a defensible
verdict) are neither success nor product failure, and neither permits `done`. Do not translate these silently into a runtime's task statuses.
