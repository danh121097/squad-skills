import {
  defaultCodexPreferencesByRole,
  resolveRoleEffort,
  resolveRoleModel,
} from './role-defaults.ts';

/** Each orchestrator must remain installable without the other skill or the npm CLI. */
// Preserve the already-shipped reference paths for existing skill links.
export const workerModelReferences = [
  'skills/squad-fix/references/codex-worker-models.md',
  'skills/squads-team/references/codex-worker-models.md',
] as const;

export function renderWorkerModels(): string {
  const rows = Object.entries(defaultCodexPreferencesByRole).map(
    ([role, { model, effort }]) =>
      `| \`${role}\` | \`${model}\` | \`${effort}\` | \`${resolveRoleModel(role)}\` | \`${resolveRoleEffort(role)}\` |`
  );

  return `# Worker models

<!-- Generated from src/agents/role-defaults.ts by pnpm agents:generate. Edit the source, not this table. -->

Read before dispatching a Codex or Claude worker. The agent installer and this table use the same
role defaults; a skill-only installation needs no CLI. Select the worker's runtime columns.

| Role | Codex model | Codex effort | Claude model | Claude effort |
| --- | --- | --- | --- | --- |
${rows.join('\n')}

## Resolve preferences

Resolve each field independently: user role-specific choice, then overall choice, then installed role
preferences, else the table when no role definition is available. Codex fields are model and
model_reasoning_effort in TOML; Claude fields are model and effort in the active agent's YAML frontmatter.
Omitted installed fields and explicit inherit leave that field to the runtime, not the table. Keep
global defaults and settings unchanged.

Record the pair and override source in the dispatch. A user request to apply this mapping selects its
runtime's pair; the skill grants no authority required for creation, messaging or model selection.
Report an unavailable choice or forced policy override rather than silently claiming a match.

## Dispatch

- **Codex subagent:** use the named role when its fixed settings match. When they conflict with a user
  override, use a generic subagent with the role's SKILL.md, model and reasoning_effort. Use fork_turns
  none when fresh context is required. Omit inherited fields; report an unsupported choice.
- **Codex chat:** pass model and thinking to create_thread. Omit inherited fields. A role name in the
  prompt alone selects no model.
- **Claude subagent:** use the active named definition; pass per-invocation model and effort overrides
  only through fields the live Agent schema supports. If those fields are absent, use a supported
  equivalent path or report the limitation, keeping installed definitions intact. Forced model/effort
  environment settings and managed limits may supersede the selection; report that conflict.
- **Claude session:** use the creation tool's supported model/effort controls. With verified Claude Code
  CLI support, independent sessions accept --model and --effort; --bg starts a persistent background
  session. Include its role skill, task and name. Claude Desktop controls can differ: inspect their live
  schema, and report missing controls instead of treating Codex's thinking field as portable.

Keep this chat as lead. Authorized follow-ups retain the pair unless the user changes it. Explicit
inherit uses the runtime's inheritance control or an unpinned role-skill worker; omitting an override must
not reactivate a fixed role field. Preserve runtime inheritance semantics. Leave unrelated chats alone.

Report the selected pair. Confirm actual model and effort from runtime turn metadata when exposed;
otherwise mark them unverified. A requested setting, prompt text or config default is not runtime proof.
`;
}
