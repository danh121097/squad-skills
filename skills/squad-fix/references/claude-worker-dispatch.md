# Claude worker dispatch

<!-- Generated from src/agents/worker-models.ts by pnpm agents:generate. -->

Read only when dispatching a Claude worker, after resolving preferences in
[worker models](worker-models.md). Check the live tool schema and authorization.

- **Claude subagent:** use the active named definition; pass per-invocation model and effort overrides
  only through fields the live Agent schema supports. If those fields are absent, use a supported
  equivalent path or report the limitation, keeping installed definitions intact. Forced model/effort
  environment settings and managed limits may supersede the selection; report that conflict.
- **Claude session:** use the creation tool's supported model/effort controls. With verified Claude Code
  CLI support, independent sessions accept --model and --effort; --bg starts a persistent background
  session. Include its role skill, task and name. Claude Desktop controls can differ: inspect their live
  schema, and report missing controls instead of treating Codex's thinking field as portable.
