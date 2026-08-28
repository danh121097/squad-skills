# Coordination contract

Read before selecting a mode, creating tasks, spawning agents, assigning files, using worktrees, or
falling back to a single-session role loop.

## 1. Runtime discovery

Inspect live capabilities; do not assume AgentKit, Claude Agent Teams, Codex collaboration, subagents,
worktrees, shared task boards or named squad skills exist. Detect AgentKit once per run by inspecting the
live skill catalog for `ak:*` entries or an available `ak` CLI, and record the result in the task contract
so every role pairs or falls back consistently.

Select the strongest safe mode:

1. **Peer-team mode:** use when native peer agents, messaging and task coordination are available and the
   task has independent slices worth the overhead.
2. **Subagent mode:** use when bounded child agents/delegation exist but peer messaging/shared boards do not.
3. **Single-session mode:** use when no multi-agent engine exists or the task is too small to delegate.

If the user forces an unavailable mode, report the missing capability and request direction rather than
silently changing the execution contract. In `auto`, fall back transparently.

When AgentKit is installed, each role reads its task-relevant references first, then pairs the
phase-matched `ak:*` skill; role boundaries, gates and evidence rules stay authoritative wherever the two
disagree. When it is absent, roles run the native fallback at the same standard. Role skills are preferred
when installed; otherwise use the inline role contracts in `delivery-pipeline-and-roster.md`.

`--devs N` is an upper bound on concurrent build slices, not a requirement to invent `N` tasks and not a
count of Designer/QA/Review gates. Map at most one developer to each genuinely independent implementation
slice, cap by live concurrency and file ownership, and reduce `N` transparently when safe isolation is not
possible.

## 2. Universal task contract

Every delegated or logical role task receives:

- outcome, acceptance criteria and relevant constraints/non-goals;
- repository/work context and project instructions;
- exact role, task, allowed files and non-overlapping ownership globs;
- dependencies and upstream contracts/artifacts;
- tests/evidence expected and report destination if configured;
- scope-affecting flags and explicit mutation authority;
- instruction to preserve others' edits and never revert unrelated work.

Do not pass secrets, credential files, private keys, dotenv values or unnecessary conversation history.

## 3. Ownership and parallelism

- One owner edits each file at a time. Build roles own unit/contract/regression tests co-located with their
  assigned implementation slice when those files are included in ownership. QA owns dedicated scenario,
  E2E, exploratory automation, performance and QA-harness files only when explicitly assigned.
- QA never edits a build-owned test concurrently. It returns the missing case to that owner, or the lead
  explicitly reassigns the file in a serialized handoff. Production implementation remains read-only to QA.
- Parallelize only independent slices with known integration points.
- Shared/generated/config/migration files get one owner or serialized turns.
- Without worktrees, serialize agents that could touch the same working tree files.
- Use worktrees only in a Git repository, when supported, and when isolation benefit exceeds merge cost.
- Preserve dirty user changes. Never force-push or destructively reset.

## 4. Peer-team mode

Use the runtime's native team/task/message APIs according to their live schema. The lead creates tasks and
dependencies, roles claim or receive work, and messages contain actionable evidence. Build roles may work
in isolated worktrees. The lead owns merge decisions, user approvals and final reporting.

Do not hard-code model names or tool syntax. Respect current concurrency limits and project instructions.

## 5. Subagent mode

The lead is the hub. Spawn bounded role tasks with exact ownership and context. Independent build slices
may run concurrently; shared-file work is serialized. Child agents report to the lead and do not hand work
directly to another agent unless the runtime explicitly supports it.

After each build result, the lead launches QA; after PASS, launches Code Review. Fixes return to the same
owner when possible.

## 6. Single-session role loop

Use one controller sequentially:

1. Enter the build role and implement only that role's scope.
2. End implementation and perform a distinct QA pass from acceptance/risk, without editing implementation.
3. If QA returns `FAIL`, return to the build role, fix, then restart QA. If it returns
   `NEEDS_ENVIRONMENT`, return to the lead to resolve the missing target/artifact, then resume QA.
4. After PASS, perform a fresh Code Review pass over the diff and evidence.
5. `CHANGES_REQUESTED` returns to owner → QA → Review. `NEEDS_EVIDENCE` returns to the lead, then resumes
   Review after the missing evidence is available.

This preserves logical gates but not independent-agent judgment. State that limitation in the final report.
Do not call a self-check an independent QA or Review.

## 7. Processes and cleanup

Track background processes, ports, sessions, worktrees and temporary resources created by the run. Reuse
existing project processes when safe. Stop only owned processes and clean only owned temporary resources.
Never delete a broad or unresolved path.

## 8. Status and reports

Use the repository's configured report/plan location. If none exists, report in the conversation instead
of creating an AgentKit-specific tree. Every role reports status, summary, evidence, risks and unresolved
questions. Final output identifies execution mode and independence level.

Gate verdict vocabulary is exact:

- QA: `PASS | FAIL | NEEDS_ENVIRONMENT`.
- Code Review: `APPROVE | CHANGES_REQUESTED | NEEDS_EVIDENCE`.
- `NEEDS_ENVIRONMENT` means a required executable target, service, device, browser, data fixture or access
  is unavailable. It returns to the lead for the smallest safe resolution, then QA reruns.
- `NEEDS_EVIDENCE` means the review target, QA result, contract, documentation or runtime evidence is
  insufficient for a defensible verdict. It returns to the lead, then Review resumes with supplied evidence.
- Neither `NEEDS_*` verdict is success or product failure, and neither permits `done`. If the gap cannot be
  resolved within authority, time or access, report the work as blocked with the exact next action.

These gate verdicts are distinct from a runtime's general task statuses; do not translate them silently.
