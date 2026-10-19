# Claude worker dispatch

<!-- Generated from src/agents/worker-models.ts by pnpm agents:generate. -->

Read only when dispatching a Claude worker, after resolving preferences in
[worker models](worker-models.md). Check the live tool schema and authorization.

- **Claude subagent:** use the active named definition; pass per-invocation model and effort overrides
  only through fields the live Agent schema supports. If those fields are absent, use a supported
  equivalent path or report the limitation, keeping installed definitions intact. Forced model/effort
  environment settings and managed limits may supersede the selection; report that conflict.
- **Claude session:** named subagent frontmatter does not configure an independent session. Pass selected
  non-inherit fields through creation controls or CLI --model/--effort (--bg for persistent sessions);
  include each value or inherit in the initial prompt. In Desktop, select the resolved model and effort
  before sending the first task or starting a launcher, except inherited fields; titles/skills select
  neither. If a launcher starts without pair controls, its worker stops before editing on
  mismatch or unverifiable settings. The lead must verify selected fields in the session controls before
  its first edit, correcting mismatches before resuming. Otherwise keep implementation pending; report
  inherited values and forced overrides.

Prefer claude/<slug> for new worktree branches. Claude Desktop Branch prefix: claude. Verify generated
names; report deviations. Preserve existing worktrees.
