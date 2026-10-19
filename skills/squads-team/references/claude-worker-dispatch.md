# Claude worker dispatch

<!-- Generated from src/agents/worker-models.ts by pnpm agents:generate. -->

Use only after selecting the execution mode and resolving [worker models](worker-models.md).
For independent sessions, read [claude-chat-dispatch.md](claude-chat-dispatch.md) instead of the subagent branch below.

- **Claude subagent:** use the active named definition; pass per-invocation model and effort overrides
  only through fields the live Agent schema supports. If those fields are absent, use a supported
  equivalent path or report the limitation, keeping installed definitions intact. Forced model/effort
  environment settings and managed limits may supersede the selection; report that conflict.
