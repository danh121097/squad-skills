# Coordination contract

Read at a phase boundary, before compacting or clearing, when reaching a peer role, and before selecting a
mode, creating tasks, spawning agents, assigning files, using worktrees or falling back to a single-session
role loop.

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

## 7. Context lifecycle at a phase boundary

A phase boundary is the gap between two chunks of this run: framing to implementation, implementation to QA,
QA to Review, one slice to the next. Decide context lifecycle only there. Mid-phase the choice is to continue
or to split the remaining work into child agents, because compacting mid-phase discards the thread the
current work is standing on.

Work the boundary in order and take the first option that fits.

1. **Continue** when the next phase needs this one as a primary source, or when the remaining window holds it
   comfortably. Framing into implementation is the usual yes: the next phase wants the reasoning as it
   happened rather than a summary of it. A gate boundary is the exception — where the mode supports it,
   implementation into QA and QA into Review go to option 4, because carrying the implementer's reasoning
   across a gate is what costs that gate its independence. Continue costs nothing and loses nothing, so rule
   it out before anything else.
2. **Clear** when nothing in this phase is a primary source for any later one — and a return to this owner
   after a `FAIL` counts as a later one. It is the cheapest move available and the one whose mistake is one-way: the
   reasoning behind what was built does not come back from reading the diff, so a boundary that can loop
   back is a boundary that clears nothing.
3. **Hand off a portable brief** when the work moves to another harness, another repository or another
   person. Portability is the whole reason to pay for it; when nothing travels, skip it.
4. **Dispatch a child agent** when the task is scoped tightly enough to run unattended. Independent QA and
   Code Review are the standard case, and the packet contract above is what crosses.
5. **Compact** otherwise, passing an instruction naming what the next phase needs from this one.

Every option but Continue turns a primary source into a secondary one: less noise and more room, at the price
of detail nothing recovers. Compact is where this ladder lands often, not where it starts. Name the option
taken at each boundary in the run's report, because a decision a summary flattened reads exactly like a
decision nobody made.

## 8. Invoking a peer

The lead reaches a peer role or specialist skill through the runtime's own skill or agent invocation, naming
one skill or agent per invocation. Concurrency is unchanged: the limit is on what a single invocation carries,
not on how many run at once. A role named only in narration is a role that did not run, and a report that
credits it is the failure the pairing rules exist to prevent. Where the runtime exposes no such invocation,
the handoff contract at this skill's entrypoint governs what happens instead.

## 9. Processes and cleanup

Track background processes, ports, sessions, worktrees and temporary resources created by the run. Reuse
existing project processes when safe. Stop only owned processes and clean only owned temporary resources.
Never delete a broad or unresolved path.

## 10. Status and reports

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

### A written plan bundle the user asked for

A bundle on disk is output the user requested, so it records what happened for a reader. It is never the
mechanism that opens a stage — the handoff is still the prose contract above — and no check here reads a
file as a gate. What it must not do is read as current when it is not.

- The root holds only `plan.md` and the standard `phases`, `artifacts`, `adr` and `references`
  directories. `phases/` alone states the running order.
- An artifact records its owning phase, owner, revision and status in frontmatter, never in a `phase-XX-`
  filename prefix, which `phases/` alone reserves. A handoff to the next phase is its own artifact, named
  `artifacts/handoff-to-phase-02.md`.
- A recorded gate names its gate, its verdict in that gate's own vocabulary, and every input it graded with
  the exact revision it graded. A Code Review `APPROVE` names the QA `PASS` it followed, because that is the
  only thing in a file showing the review ran second.
- A change to structure or contract after a gate marks the recorded verdict superseded and requires QA then
  Code Review again. Mark the old record superseded rather than editing its verdict, then rerun in pipeline
  order.
- A phase is not marked accepted while a required checkbox or a user approval it declared is still open.
  Put the approval to the user as named options with their consequences, from the session that can ask.
