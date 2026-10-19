# Worker models

<!-- Generated from src/agents/role-defaults.ts by pnpm agents:generate. Edit the source, not this table. -->

Read before dispatching; select the worker's runtime columns. Skill-only installations need no CLI.

| Role | Codex model | Codex effort | Claude model | Claude effort |
| --- | --- | --- | --- | --- |
| `squad-backend` | `gpt-6.1-sol` | `medium` | `sonnet` | `medium` |
| `squad-code-review` | `gpt-6.1-sol` | `high` | `opus` | `medium` |
| `squad-designer` | `gpt-6.1-sol` | `medium` | `sonnet` | `medium` |
| `squad-devops` | `gpt-6.1-sol` | `medium` | `sonnet` | `medium` |
| `squad-fix` | `gpt-6.1-sol` | `high` | `opus` | `medium` |
| `squad-frontend` | `gpt-6.1-sol` | `medium` | `sonnet` | `medium` |
| `squad-mobile` | `gpt-6.1-sol` | `medium` | `sonnet` | `medium` |
| `squad-product` | `gpt-6.1-sol` | `high` | `opus` | `medium` |
| `squad-qa` | `gpt-6.1-sol` | `medium` | `sonnet` | `medium` |
| `squads-team` | `gpt-6.1-sol` | `high` | `opus` | `medium` |

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

Read only the worker runtime's dispatch reference:
- Codex: [codex-worker-dispatch.md](codex-worker-dispatch.md).
- Claude: [claude-worker-dispatch.md](claude-worker-dispatch.md).

Keep this chat as lead. Authorized follow-ups retain the pair unless the user changes it. Explicit
inherit uses the runtime's inheritance control or an unpinned role-skill worker; omitting an override must
not reactivate a fixed role field. Preserve runtime inheritance semantics. Leave unrelated chats alone.

Report the selected pair. Confirm actual model and effort from runtime turn metadata when exposed;
otherwise mark them unverified. A requested setting, prompt text or config default is not runtime proof.
