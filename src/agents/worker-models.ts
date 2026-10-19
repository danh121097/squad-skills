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
model_reasoning_effort in TOML; Claude named subagents use model and effort in the active agent's
YAML frontmatter. Independent sessions need their own selection.
Omitted installed fields and explicit inherit leave that field to the runtime, not the table. Keep
global defaults and settings unchanged.

Record the pair and override source in the dispatch. A user request to apply this mapping selects its
runtime's pair; the skill grants no authority required for creation, messaging or model selection.
Report an unavailable choice or forced policy override rather than silently claiming a match.

## Dispatch

Select the mode first; read only its runtime reference:
- Subagents: [Codex](codex-worker-dispatch.md) or [Claude](claude-worker-dispatch.md).
- Independent sessions: [Codex](codex-chat-dispatch.md) or [Claude](claude-chat-dispatch.md).

Keep this chat as lead. Authorized follow-ups retain the pair unless the user changes it. Explicit
inherit uses the runtime's inheritance control or an unpinned role-skill worker; omitting an override must
not reactivate a fixed role field. Preserve runtime inheritance semantics. Leave unrelated chats alone.

Report the selected pair. Confirm actual model and effort from runtime turn metadata when exposed;
otherwise mark them unverified. A requested setting, prompt text or config default is not runtime proof.
`;
}

/** Resolve the mechanism first; subagents do not need chat lifecycle instructions. */
export function renderWorkerDispatch(tool: AgentTool): string {
  if (tool === 'codex')
    return `# Codex worker dispatch

<!-- Generated from src/agents/worker-models.ts by pnpm agents:generate. -->

Use only after selecting the execution mode and resolving [worker models](worker-models.md).
For worker chats, read [codex-chat-dispatch.md](codex-chat-dispatch.md) instead of the subagent branch below.

- **Codex subagent:** use the named role when its fixed settings match. When they conflict with a user
  override, use a generic subagent with the role's SKILL.md, model and reasoning_effort. Default bounded independent work to fork_turns none with an explicit task handoff;
  inherit history only when its decisions are needed. Omit inherited fields; report an unsupported choice.
`;
  return `# Claude worker dispatch

<!-- Generated from src/agents/worker-models.ts by pnpm agents:generate. -->

Use only after selecting the execution mode and resolving [worker models](worker-models.md).
For independent sessions, read [claude-chat-dispatch.md](claude-chat-dispatch.md) instead of the subagent branch below.

- **Claude subagent:** use the active named definition; pass per-invocation model and effort overrides
  only through fields the live Agent schema supports. If those fields are absent, use a supported
  equivalent path or report the limitation, keeping installed definitions intact. Forced model/effort
  environment settings and managed limits may supersede the selection; report that conflict.
`;
}

/** Chat-only controls and lifecycle, bundled with each independently installed lead. */
export function renderWorkerChatDispatch(tool: AgentTool): string {
  if (tool === 'codex')
    return `# Codex chat dispatch

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
`;
  return `# Claude chat dispatch

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
`;
}

/** Worktree-only transfer instructions, omitted for shared-checkout chats and subagents. */
export function renderCodexWorktreeHandoff(): string {
  return `# Codex worktree handoff

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
`;
}
