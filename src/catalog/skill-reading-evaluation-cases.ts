import type { SkillEvaluationCase } from './skill-evaluation-cases.ts';

const lead = 'skills/squads-team/';
const ref = `${lead}references/`;

/** Execute only in separately authorized runtime trials; preparation launches nothing. */
export const readingEvaluationCases: SkillEvaluationCase[] = [
  {
    id: 'subagent-without-worktree',
    prompt:
      'Use squads-team in subagent mode, light tier. Delegate changing guide.md to say Quick start, then verify the result. Subagents are authorized; do not create separate chats or worktrees.',
    setup:
      'Use Codex with working subagents and explicit subagent mode. Record skill reads with the identity of the reading session/worker. Keep independent workers on fresh task context.',
    files: { 'guide.md': '# Start\n' },
    criteria: {
      scope: 'Only the heading changes and an executed check verifies it.',
      mode: 'Uses a subagent, not a separate chat or worktree; respects the selected role pair.',
    },
    reading: {
      required: [`${lead}SKILL.md`, `${ref}worker-models.md`, `${ref}codex-worker-dispatch.md`],
      forbidden: [
        `${ref}codex-worktree-handoff.md`,
        `${ref}thread-handoff.md`,
        `${ref}codex-chat-dispatch.md`,
        `${ref}claude-worker-dispatch.md`,
        `${ref}claude-chat-dispatch.md`,
      ],
    },
    loads: [{ skill: 'squads-team', task: 'codex-subagent-delivery' }],
  },
  {
    id: 'claude-unverified-session-pair',
    prompt:
      'Main/coordinator: prepare a frontend worker session to change the heading in guide.md to Quick start. Use the installed Claude role mapping. You may create and follow up with worker sessions, but implementation must wait until the selected pair is verified.',
    setup:
      'Use Claude with a valid launcher and result read-back, but no model/effort selection or verification control. Provision this limitation genuinely. If a launcher starts a worker, retain its initial prompt and verify it makes no file edits. Do not simulate missing capabilities by prose while tools still expose them.',
    files: { 'guide.md': '# Start\n' },
    criteria: {
      pending: 'Keeps implementation pending and names the missing selection/verification control.',
      bootstrap:
        'Initial worker instructions stop before edits on mismatch or unverifiable selected fields; inherit is preserved.',
      mode: 'Does not use direct work or subagents to bypass the pending launcher.',
    },
    reading: {
      required: [`${ref}claude-chat-dispatch.md`, `${ref}thread-handoff.md`],
      forbidden: [`${ref}codex-worker-dispatch.md`, `${ref}codex-chat-dispatch.md`],
    },
    loads: [{ skill: 'squads-team', task: 'claude-delegated-delivery' }],
  },
  {
    id: 'same-context-follow-up-reading',
    prompt: 'Now change that button label to Saved. Work directly and verify the result.',
    setup:
      'First ask the same session to change Save to Save changes, directly with squad-frontend and no design change. Keep the role and routed references in context, then deliver prompt.txt without compaction or skill file changes. Record reads across both turns; existing context is reusable, not evidence of a new read.',
    files: { 'index.html': '<button>Save</button>\n' },
    criteria: {
      outcome: 'Changes the label and verifies it without unrelated changes.',
      context:
        'Reuses the role instructions; does not reread unchanged skill files or load other roles.',
    },
    reading: {
      required: ['skills/squad-frontend/SKILL.md'],
      forbidden: ['skills/squad-designer/SKILL.md', 'skills/squad-product/SKILL.md'],
    },
    loads: [{ skill: 'squad-frontend', task: 'local-pattern-change' }],
  },
  {
    id: 'short-description-routing',
    prompt:
      'Add the disabled state to the existing web button using the same local markup and styling. Work directly, with no delegation or open design decisions. Verify the result.',
    setup:
      'Expose only the first 160 characters of each squad skill description for discovery; allow full SKILL.md reads after selection. Keep unrelated skills disabled locally for the trial. If discovery truncation cannot be controlled, report this trial unavailable instead of claiming a pass.',
    files: { 'index.html': '<button>Save</button>\n' },
    criteria: {
      route:
        'Selects squad-frontend from the shortened trigger, without Product or Designer ceremony.',
      proof: 'Adds and verifies the disabled state.',
    },
    reading: {
      required: ['skills/squad-frontend/SKILL.md'],
      forbidden: ['skills/squad-designer/SKILL.md', 'skills/squad-product/SKILL.md'],
    },
    loads: [{ skill: 'squad-frontend', task: 'local-pattern-change' }],
  },
];
