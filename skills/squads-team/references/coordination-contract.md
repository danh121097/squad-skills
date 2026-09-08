# Coordination contract

Read before selecting a mode, creating tasks, spawning agents, assigning files, using worktrees, or
falling back to a single-session role loop.

## 1. Runtime discovery

Inspect live capabilities; do not assume Claude Agent Teams, Codex collaboration, subagents,
worktrees, shared task boards or named squad skills exist. Detect available specialist skills once per
run by inspecting the live skill catalog for the capabilities the roles need, and record the result in
the task contract so every role pairs or falls back consistently.

Count a runtime capability only after its read-only inventory or probe confirms it in this run. Installed
files, remembered availability or an ambiguous probe do not establish a mode; choose the next lower safe
mode and report the missing evidence.

Select the strongest safe mode:

1. **Peer-team mode:** use when native peer agents, messaging and task coordination are available and the
   task has independent slices worth the overhead.
2. **Subagent mode:** use when bounded child agents/delegation exist but peer messaging/shared boards do not.
3. **Single-session mode:** use when no multi-agent engine exists or the task is too small to delegate.

No mode flag means `auto`. `--coordinate-only` (legacy alias `--delegate`) is a forced execution shape,
not the switch that enables delegation: without it, `auto` may still delegate safe slices while the lead
implements work it retains. If coordinate-only delegation is unavailable, return the mismatch to the user.

A new top-level user thread is not a fourth execution mode. It owns a separate outcome and lifecycle and
is eligible only when the user requests that task or grants per-run authority with `--allow-new-threads`
or equivalent wording. Under that authority, create the minimum set without asking again only when each
thread has its own user-visible outcome, acceptance and ownership, remains independently followable, and
is not merely a role slice, quality gate, worktree or concurrency shortcut. Keep everything else under the
current lead using child agents or peer tasks.

Before creation, assign the outcome a stable key within this run and keep a one-key-to-one-thread registry.
Reuse the recorded thread for that key; never infer identity from a similar title. If creation returns an
uncertain result or the registry conflicts with runtime discovery, inspect read-only and ask the user rather
than create a possible duplicate. Seed each new thread with its own `CONTEXT` packet and report its identity;
no history or later `DELTA` crosses automatically. Per-run thread authority does not authorize commit, push,
PR, deploy, data mutation or any other action outside the accepted goal, and expires when the run ends.

If the user forces an unavailable mode, report the missing capability and request direction rather than
silently changing the execution contract. In `auto`, fall back transparently.

When a specialist skill is installed, each role reads its task-relevant references first, then pairs the
phase-matched specialist skill; role boundaries, gates and evidence rules stay authoritative wherever the
two disagree. When it is absent, roles run the native fallback at the same standard. Role skills are
preferred when installed; otherwise use the inline role contracts in `delivery-pipeline-and-roster.md`.

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

### Context packets and message handoffs

Treat task or thread IDs, inherited history and shared files as transport, not shared understanding. The
lead is the source of truth and uses five message shapes:

- `CONTEXT` starts work with a task ID, context revision, outcome, acceptance, role, owned files,
  dependencies, accepted contract identifiers and authority/status, allowed mutations, expected evidence
  and handoff condition. A dependent role may consume a contract only when its owner or the lead marks it
  accepted for that revision; a draft permits contract-independent work only.
- `ACK` accepts that revision and ownership, or names the missing input before edits begin.
- `DELTA` changes acceptance, ownership or an upstream contract, increments the revision and names which
  assumptions, results and QA/Review evidence are invalidated. Every affected role acknowledges it before
  continuing, and every invalidated gate reruns in pipeline order.
- `BLOCKED` names the exact dependency or user decision, work still runnable without it, and the smallest
  action that unblocks the task. The role continues any safe unblocked work instead of waiting silently.
- `RESULT` returns status, changed files, commands and evidence, risks, unresolved questions, the accepted
  revision, and the next owner or gate.

Send the smallest sufficient packet; do not replay full conversation history. A direct peer message may
clarify an existing contract when the runtime supports it, but any change to acceptance, ownership or a
dependency returns through the lead as `DELTA`. The lead forwards the relevant packet to downstream roles
and never treats an unacknowledged or superseded result as current.

## 3. Ownership and parallelism

- Build a dependency graph before spawning. Start every zero-dependency slice, then dispatch a dependent
  slice as soon as all inputs it consumes are stable; do not wait for unrelated siblings or for a whole
  phase batch. A downstream role may start against an accepted contract while its producer implements it.
- One owner edits each file at a time. Build roles own unit/contract/regression tests co-located with their
  assigned implementation slice when those files are included in ownership. QA owns dedicated scenario,
  E2E, exploratory automation, performance and QA-harness files only when explicitly assigned.
- QA never edits a build-owned test concurrently. It returns the missing case to that owner, or the lead
  explicitly reassigns the file in a serialized handoff. Production implementation remains read-only to QA.
- Parallelize only independent slices with known integration points.
- Shared/generated/config/migration files get one owner or serialized turns.
- When an upstream contract changes, send `DELTA`, pause only affected work, refresh its context and rerun
  the impacted checks. Unaffected slices continue.
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

Use the context and result packets above even when the runtime exposes inherited history or shared files;
those are convenience channels, not proof that the next role received the acceptance criteria, ownership,
or evidence. Dispatch each newly ready task when its dependencies clear rather than waiting for every child
to finish. If a child asks a question, return the named fork to the lead rather than answering it from an
assumption.

After each build result, the lead launches QA; after PASS, launches Code Review. Fixes return to the same
owner when possible.

A child agent has no channel to the user. A question it writes into its report is read by the lead and by
nobody else, so a role that needs a user decision must return the fork rather than answer it, and the lead
puts it to the user before the phase that depends on it starts. Two to four named options with their
consequences is the shape that crosses this boundary; a fork that arrives as prose goes back for options.
The lead never converts one into a decision on the user's behalf — an unanswered fork blocks its phase the
way a `NEEDS_*` verdict does.

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
of creating a squad-specific tree. Every role reports status, summary, evidence, risks and unresolved
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
