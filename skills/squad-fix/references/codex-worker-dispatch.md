# Codex worker dispatch

<!-- Generated from src/agents/worker-models.ts by pnpm agents:generate. -->

Read only when dispatching a Codex worker, after resolving preferences in
[worker models](worker-models.md). Check the live tool schema and authorization.

- **Codex subagent:** use the named role when its fixed settings match. When they conflict with a user
  override, use a generic subagent with the role's SKILL.md, model and reasoning_effort. Default bounded independent work to fork_turns none with an explicit task handoff;
  inherit history only when its decisions are needed. Omit inherited fields; report an unsupported choice.
- **Codex chat:** resolve the assigned implementation skill before creation, then pass its selected model
  and thinking explicitly to create_thread and every authorized send_message_to_thread follow-up. Omit a
  field only when its preference is inherit. A role name in the title or prompt, or loading its SKILL.md
  inside the chat, selects no model. Verify each worker turn's actual pair from runtime metadata when
  exposed; the composer selection is not evidence of a completed turn's effort. Report an unsupported or
  unverified pair.

## Chat lifecycle

Discover the project before create_thread. Separate chats are user-owned; native subagent threads are
another mode. Include the user's creation and report-back/follow-up authorization; the skill and a
worker's request to reply grant none. Prefer wait_threads for progress, read_thread for missing detail,
and send_message_to_thread for authorized follow-ups. Reuse pending IDs; resolve a queued setup ID via
list_threads to its ready chat ID before reading, waiting or messaging. Keep the lead's model unchanged.

## Worktree handoff

For concurrent implementation chats in one Git repository, use create_thread's worktree environment for
each worker when the user authorizes worktrees. Record the target branch and agreed base; respect the
live schema's starting-state authorization. A commit-based checkout omits pending changes; include them
through a supported working-tree start or a patch. Without authorization or worktree support, or with
--no-worktree, serialize worker chats sharing a checkout.

Prefer codex/<slug> for new worktree branches. Verify generated names; report deviations. Preserve
existing worktrees.

Use the initial-prompt bootstrap in [thread handoff](thread-handoff.md); the worker owns snapshot capture
before editing, even when create_thread starts immediately. Gate identity includes file content hashes,
including uncommitted files. Verify dependencies/environment in the worker checkout;
missing setup is a named gap, never permission to install tools or copy credentials.

The integration owner follows the --coordinate-only rule in thread handoff. Confirm the target checkout
is on the target branch.
Integrate by reviewed patch or copy of the delta from that initial snapshot, including added, deleted,
renamed and binary files. Compare baseline, worker result and current target before applying; preserve
inherited and concurrent user changes. A file copy is safe only after this comparison. Use Git merge only
for committed work when commit authority exists. Resolve conflicts against accepted contracts, verify the
combined result, and rerun affected gates if conflict resolution changes behavior or a contract. Keep the
current branch diff reviewable. After verified transfer, use the runtime's cleanup path for the task
worktree and delete only its disposable task branch. Preserve unintegrated work and report cleanup gaps.
