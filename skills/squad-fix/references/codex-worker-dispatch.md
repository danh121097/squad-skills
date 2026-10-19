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

## Worktree handoff

For concurrent implementation chats in one Git repository, use create_thread's worktree environment for
each worker when the user authorizes worktrees. Record the target branch and start from the agreed base.
A commit-based worktree omits
pending changes; include them through a supported working-tree start or a patch. Without authorization or worktree support, or with
--no-worktree, serialize worker chats sharing a checkout.

After both gates pass, main tells the worker done and obtains its exact diff, including uncommitted files.
Confirm main is on the target branch. Integrate by reviewed patch or copy; use Git merge only for committed work when
commit authority exists. Resolve conflicts against accepted contracts, verify the combined result, and
rerun affected gates if conflict resolution changes behavior or a contract. Keep the current branch diff
reviewable. After verified transfer, use the runtime's cleanup path for the task worktree and delete only
its disposable task branch. Preserve unintegrated work and report any cleanup the runtime cannot perform.
