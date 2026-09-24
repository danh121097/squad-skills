# Coordination contract

Read at a phase boundary, before compacting or clearing, when reaching a peer role, and before selecting a
mode, creating tasks, spawning agents, assigning files, using worktrees or falling back to a single-session
role loop.

## 1. Runtime discovery

Count a capability — agent teams, subagents, worktrees, task boards, named squad skills — only after a
read-only probe confirms it in this run; otherwise choose the next lower safe mode and say what was missing.
Detect specialist skills once per run by inspecting the live skill catalog for the capabilities the roles
need, and record the result in the task contract. Role boundaries, gates and evidence rules stay
authoritative over a paired skill; role sections in `domain-coverage-contracts.md` stand in for an absent
role skill.

Select the lowest-overhead safe mode that preserves ownership and risk-appropriate independence:

1. **Single-session:** a small, coherent or low-risk change where distinct logical passes suffice.
2. **Subagent:** bounded slices or an independent gate materially improve concurrency or risk coverage.
3. **Peer-team:** several independent slices and gate handoffs justify native messaging and task boards.

`--coordinate-only` forces the lead to delegate every slice; without it, `auto` may still delegate safe
slices. A forced mode that is unavailable returns to the user; in `auto`, fall back and report it. `--devs N`
caps concurrent build slices — never a quota of tasks and never a count of gates.

## 2. Universal task contract

Every delegated or logical role task receives:

- outcome, acceptance criteria and relevant constraints/non-goals;
- repository/work context and project instructions;
- exact role, task, allowed files and non-overlapping ownership globs;
- dependencies and upstream contracts/artifacts;
- tests/evidence expected and scope-affecting flags with explicit mutation authority;
- instruction to preserve others' edits and never revert unrelated work.

Do not pass secrets, credential files, private keys, dotenv values or unnecessary conversation history.

### Context packets

Task IDs, inherited history and shared files are transport, not shared understanding. The lead is the
source of truth and uses three packets; receiving one is acceptance unless the role names a missing input
before editing.

- `CONTEXT` starts work: task ID, context revision, outcome, acceptance, role, owned files, dependencies,
  accepted contract identifiers, allowed mutations, expected evidence and handoff condition. A dependent
  role consumes a contract only once its owner or the lead marks it accepted for that revision.
- `DELTA` changes acceptance, ownership or an upstream contract, increments the revision and names which
  results are invalidated. It invalidates only the gates of units that consume what changed; every other
  unit keeps its verdict, and each invalidated gate reruns in pipeline order.
- `RESULT` returns status, changed files, commands and evidence, risks, open questions, the accepted
  revision and the next owner or gate. A `BLOCKED` status names the exact dependency or decision, the work
  still runnable without it, and the smallest action that unblocks it.

Send the smallest sufficient packet. A peer message may clarify a contract, but any change to acceptance,
ownership or a dependency returns through the lead as `DELTA`.

## 3. Ownership and parallelism

- Build a dependency graph before spawning. Start every zero-dependency slice and dispatch a dependent one
  as soon as its inputs are stable; a downstream role may start against an accepted contract.
- One owner edits each file at a time. Build roles own unit/contract/regression tests co-located with their
  assigned implementation slice when those files are included in ownership. QA owns dedicated scenario,
  E2E, exploratory automation, performance and QA-harness files only when explicitly assigned.
- QA never edits a build-owned test concurrently. It returns the missing case to that owner, or the lead
  explicitly reassigns the file in a serialized handoff. Production implementation remains read-only to QA.
- Shared/generated/config/migration files get one owner or serialized turns.
- When an upstream contract changes, send `DELTA`, pause only affected work, refresh its context and rerun
  the impacted checks. Unaffected slices continue.
- Without worktrees, serialize agents that could touch the same working tree files.
- Use worktrees only in a Git repository, when supported, and when isolation benefit exceeds merge cost.
- Preserve dirty user changes. Never force-push or destructively reset.

## 4. Peer-team and subagent modes

Use the runtime's native team, task and message APIs by their live schema; do not hard-code model names or
tool syntax, and respect current concurrency limits. The lead creates tasks and dependencies, owns merge
decisions, user approvals and the final report, and dispatches each task as its dependencies clear rather
than waiting for every child. In subagent mode the lead is the hub: children report to it and do not hand
work to each other unless the runtime supports it.

Once a coherent gate unit is ready, the lead launches one QA pass over its exact slice revisions, then one
Code Review after `PASS`. A high-risk or independently shippable slice remains its own unit. Fixes return
to the same owner when possible.

A child agent has no channel to the user: a question it writes is read only by the lead. It returns the fork
as two to four named options with their consequences, and the lead puts it to the user before the phase
that depends on it starts — never deciding it on the user's behalf. An unanswered fork blocks its phase the
way a `NEEDS_*` verdict does.

## 5. Single-session role loop

Use one controller sequentially:

1. Enter the build role and implement only that role's scope.
2. On `light`, close with the combined verify pass and stop here. Otherwise perform a distinct QA pass from
   acceptance/risk, without editing implementation.
3. `FAIL` returns to the build role, then QA restarts on the affected scope; `NEEDS_ENVIRONMENT` returns to
   the lead for one resolution, then QA resumes.
4. After PASS, perform a fresh Code Review pass over implementation quality, consuming QA evidence.
5. `CHANGES_REQUESTED` returns to owner → affected QA → focused Review. `NEEDS_EVIDENCE` returns to the lead,
   then Review resumes. A third return from either gate stops the loop as `BLOCKED`.

This preserves logical gates but not independent-agent judgment. State that limitation in the final report.
Do not call a self-check an independent QA or Review.

## 6. Context lifecycle at a phase boundary

Decide only at a phase boundary; mid-phase, continue or split the remaining work into child agents.

1. **Continue** when the next phase needs this one as a primary source — framing into implementation is the
   usual case.
2. **Dispatch a child agent** for a tightly scoped task, and for QA and Code Review where the mode allows:
   carrying the implementer's reasoning across a gate costs the gate its independence.
3. **Compact** otherwise, with an instruction naming what the next phase needs from this one.

## 7. Invoking a peer

Reach a peer role or specialist skill through the runtime's own skill or agent invocation, one per call. A
role named only in narration did not run, and a report must not credit it.

## 8. Processes and cleanup

Track background processes, ports, sessions, worktrees and temporary resources created by the run. Reuse
existing project processes when safe. Stop only owned processes and clean only owned temporary resources.
Never delete a broad or unresolved path.

## 9. Status and reports

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

### A gate recorded in a written plan

A plan on disk records what happened for a reader; it never opens a stage. When the lead records a gate
there:

- the record names its verdict in the gate's own vocabulary and every input it graded with the exact
  revision; a Code Review `APPROVE` names the QA `PASS` it followed;
- a change to structure or contract after a gate marks the recorded verdict superseded and requires QA then
  Code Review again — mark the old record superseded rather than editing its verdict;
- a phase is not marked accepted while a required checkbox or a user approval it declared is still open.
