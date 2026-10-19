import type { AgentTool } from './role-defaults.ts';
import {
  defaultCodexPreferencesByRole,
  resolveRoleEffort,
  resolveRoleModel,
} from './role-defaults.ts';

/** Each orchestrator must remain installable without the other skill or the npm CLI. */
export const workerModelReferences = [
  'skills/squad-fix/references/worker-models.md',
  'skills/squads-team/references/worker-models.md',
] as const;

export function renderWorkerModels(): string {
  const rows = Object.entries(defaultCodexPreferencesByRole).map(
    ([role, { model, effort }]) =>
      `| \`${role}\` | \`${model}\` | \`${effort}\` | \`${resolveRoleModel(role)}\` | \`${resolveRoleEffort(role)}\` |`
  );

  return `# Worker models

<!-- Generated from src/agents/role-defaults.ts by pnpm agents:generate. Edit the source, not this table. -->

Read before dispatching; select the worker's runtime columns. Skill-only installations need no CLI.

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

Read only the worker runtime's dispatch reference:
- Codex: [codex-worker-dispatch.md](codex-worker-dispatch.md).
- Claude: [claude-worker-dispatch.md](claude-worker-dispatch.md).

Keep this chat as lead. Authorized follow-ups retain the pair unless the user changes it. Explicit
inherit uses the runtime's inheritance control or an unpinned role-skill worker; omitting an override must
not reactivate a fixed role field. Preserve runtime inheritance semantics. Leave unrelated chats alone.

Report the selected pair. Confirm actual model and effort from runtime turn metadata when exposed;
otherwise mark them unverified. A requested setting, prompt text or config default is not runtime proof.
`;
}

/** Generated alongside each model table so either orchestrator installs alone. */
export function renderWorkerDispatch(tool: AgentTool): string {
  if (tool === 'codex')
    return `# Codex worker dispatch

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
`;
  return `# Claude worker dispatch

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
`;
}
