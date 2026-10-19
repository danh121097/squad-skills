# Codex chat dispatch

<!-- Generated from src/agents/worker-models.ts by pnpm agents:generate. -->

Read only for Codex worker chats. Check the live schema and authorization; preferences come from
[worker models](worker-models.md). Subagents use [codex-worker-dispatch.md](codex-worker-dispatch.md).

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

Use the snapshot bootstrap in [thread handoff](thread-handoff.md) even for a shared checkout.
Serialize implementation chats sharing a checkout. For an isolated worker checkout, also read
[codex-worktree-handoff.md](codex-worktree-handoff.md) before creation, transfer or cleanup.
