# Claude chat dispatch

<!-- Generated from src/agents/worker-models.ts by pnpm agents:generate. -->

Read only for independent Claude sessions. If neither direct creation nor a valid launcher supports
read-back and follow-ups, use the lead contract’s fallback chain. Otherwise, missing controls to select
or verify required model/effort fields keep implementation pending. Missing authorization also stays pending.
Use the initial-prompt bootstrap in [thread handoff](thread-handoff.md), including the stop on unverifiable settings.
Subagents use [claude-worker-dispatch.md](claude-worker-dispatch.md).

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
