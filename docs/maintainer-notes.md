# Maintainer notes

Why the rules in [AGENTS.md](../AGENTS.md) are shaped the way they are. Agents
working on the repository do not need this file to follow the rules; it exists
so a maintainer changing one knows what it was protecting against.

## Payload ceilings

Every skill has a ceiling, because a skill without one grows with nothing
objecting — skills once grew by 12% to 42% of their reference words in a single
upgrade that believed something else was bounding them.

The declared median loaded set is bounded rather than the total to preserve
progressive disclosure. It is a static word estimate, not an observed token bill.
The total regime exists for a skill added without a routing table.

Task types that name a missing reference, a reference no task type loads, or
fewer than three task types all fail validation: the first is a broken route,
the second is payload the median never counts, and the third is too few for a
median to mean anything.

## Symlinks and packaging

Archive semantics let a pack store a link's target and drop the link, so a
reference that resolves in the source tree can be missing from an installed
skill. A valid source tree is not evidence that the package preserved it, which
is why `pnpm pack:check` compares packaged bytes and resolves links again inside
the tarball.

## Generated agents

Copying a role's prose into its subagent definition would create a second
product surface bound by no ceiling and no clause, and the two would drift. The
upstream Skills CLI exposes no install hook and has no agent concept, which is
why `squad-skills agents` exists for the GitHub path.

Model/effort defaults for both runtimes are authored in `src/agents/role-defaults.ts`.
The installer derives native-agent fields from them; `pnpm agents:generate` also
renders each orchestrator's `worker-models.md` with Codex and Claude columns. Two generated copies keep
each skill installable alone, without a cross-skill link or an npm runtime.
Tests compare both copies to the renderer and the native-agent expectations.
They carry the same per-field selection rules, with runtime-specific override
controls: a generic-agent path for fixed Codex roles, and supported model/effort
controls plus forced-setting caveats for Claude. Edit the source and
regenerate rather than maintaining a second mapping by hand.

## Handoffs are prose, not files

A file records a claim rather than the pass behind it, and a hook binds to one
runtime while the GitHub distribution path ships no `dist/`. So gates and their
sequence are bound as cross-skill clauses instead. Reopening this needs evidence
that a gate failed in a way a file-existence check would have caught.

A stage boundary is stated by both the sending and the receiving role: an edge
only its sender describes leaves the receiver no contract to refuse an
incomplete handoff, which is how every return edge stood before
`HANDOFF-REPRO-001`. `HANDOFF-*` members bind only entrypoints because both ends
of a boundary have to be readable without loading a reference. `PLAN-DOCUMENT-*`
is its own family because the written plan's shape is progressively disclosed.

## Gate tiers and repair loop

Until 2026-09, every slice — including a one-line change — ran QA and then Code
Review, a role invoked alone ran both itself, and nothing capped how many times
a gate could send work back. Only `squad-fix` stopped after three failed
attempts. Tiers make ceremony proportional to risk. Verify evidence stays
mandatory in every tier: the change removed procedure, not proof.

An earlier cap was counted per gate, then per unit. Removing it allowed
unbounded automatic retries even when a worker and gate repeated the same
failure. The current loop keeps the same implementation owner and returns all
findings from both gates on one revision together. It assesses every completed
repair, including the second. If the same failure persists across two gate
assessments without new evidence, or the second repair still fails, it gives the
user the attempt history and options. A user can authorize another bounded batch.

Review used to start only after QA `PASS`. A blocker Review found by reading
code QA's tests never reached voided QA's evidence, so one fix cost a second QA
pass and a second Review: the loop users saw. The gates now run on one revision
and a return carries both gates' findings, so one fix pass answers both; Review
consumes QA's evidence before its verdict rather than before it starts. The
price is Review work spent on a revision QA then fails, accepted because those
findings still reach the same fix pass. The paired subagents now start concurrently
and exchange evidence while working; Review waits for QA's matching evidence
before its verdict. A fix that changes no observable
behavior reruns the existing suite instead of a new QA pass.

QA and Review also split the dimensions they had both claimed. QA executes
security, performance and rollback checks; Review judges them statically. Test
adequacy is QA's, and Review reports a test only when it mirrors the
implementation.

## Quality bar and checklist

The quality bar is the copy a role runs in one piece before it hands over; a
pre-flight assembled from two files is one a run skips. The completion
checklist was cut to eight items so it points at the quality bar instead of
restating it.

## The greenfield fork

Product, frontend, backend, mobile and devops each name the existing-versus-
greenfield fork in their own words. A clause would force shared wording and cost
each the noun that makes the line actionable. It drifted once — frontend and
mobile carried the fork while backend and devops did not.

## Coverage

Coverage records what the test process executed, not what the tests verified.
`src/cli/cli.ts` is exercised end to end by subprocess tests and still measures
zero because coverage is collected in the child, so a floor would score the
faithful test below a shallow in-process one.

## Release job

The `release` job holds `contents: write`, so it runs only on a push to `main`
and never on a pull request a fork could open. It uses the runner's own `gh`
rather than a third-party action.

## Retired coordination features

The thread registry, `--allow-new-threads`, the `--delegate` alias, the
five-rung context ladder and the `ACK` / `BLOCKED` packets were removed in
2026-09. They were rarely used and cost every squad run payload; `BLOCKED` is now
a status of `RESULT`, and an acknowledgement is implicit.
The `thread` mode runs build workers as sessions the user can open. A user-designated main/coordinator
prefers it on both runtimes, delegates implementation and receives worker reports; task size alone does
not trigger fallback. Missing creation, read-back or follow-up capability falls back to subagents, then
single-session execution. Missing required authorization leaves dispatch pending rather than overriding
the requested mode. Explicit single-session/no-delegation instructions win. Other runs select the
lowest-overhead suitable mode. Main uses QA and Code Review subagents for the gates and returns findings
to the same build chat. Both orchestrator entrypoints bind the thread preference through
`HANDOFF-SESSION-001`.

Parallel Codex build chats in one Git repository now use separate worktrees when the user authorizes
them. The coordinator reports the worker slice done after its gates pass, integrates its exact diff into
the current branch, resolves conflicts and verifies the combined result before cleaning the task
worktree and branch. An uncommitted worker diff crosses by reviewed patch or copy so the current branch
keeps a reviewable diff without creating an unauthorized commit. `HANDOFF-WORKTREE-001` binds this stage
on both orchestrator entrypoints.

## Effective modes and worktree evidence

Gate execution follows the effective mode after explicit overrides and runtime fallback. A main label
alone does not require unavailable subagents after choosing single-session execution. Thread-mode
standard/high gates keep their paired-subagent requirement; light closes on combined verification.
External ownership and explicitly required independence still prevent an inline replacement.

Thread handoff text is generated into both orchestrators from `src/agents/thread-handoff.ts`, preserving
standalone installations without making single-session repairs read chat lifecycle details. Codex-specific
creation, messaging and worktree mechanics remain in its generated dispatch reference.

Every initial worker prompt assigns snapshot capture to that worker after seeding and before its first
edit on either runtime; capture failure stops implementation. With `--coordinate-only`, an integration
owner applies changes, resolves conflicts and runs combined checks while main reviews the evidence.
Worktree gates receive an absolute checkout path and a frozen content identity. The initial snapshot
separates inherited dirty state from worker output; integration compares that baseline, the result and the
current target. Gate verdicts remain prose; temporary baseline material is not a new report-file contract.

## Payload ceiling history

Until 2026-09 each ceiling in `src/catalog/skill-payload-ceilings.ts` carried
the story of every raise: which clause or reference added how many words and
why that was median-path on purpose. Those notes were dropped when the catalog
was cut down and every ceiling was re-recorded; `git log -p` on that file still
holds them. What they taught stays true: a raise is stated as a reviewed number
in the same diff, and new content that only some tasks need is routed to those
tasks so the median does not move.

On 2026-10-15 every ceiling was lowered again, by 1 to 157 words, after a pass
that applied `docs/authoring-doctrine.md` across all ten skills. A removal
counted as a duplicate only when every task type that needs the rule still
loads a file that states it. Review restored the rules that failed that test,
and the rewrites that had changed a guardrail's meaning, before the figures were
recorded.
