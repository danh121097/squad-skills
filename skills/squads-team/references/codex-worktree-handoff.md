# Codex worktree handoff

<!-- Generated from src/agents/worker-models.ts by pnpm agents:generate. -->

Read only when using an isolated Codex worker checkout. Main still follows its selected mode and authorization.

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
