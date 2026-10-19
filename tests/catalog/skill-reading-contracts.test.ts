import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { skillTaskTypes } from '../../src/catalog/skill-task-types.ts';

const read = (file: string) => readFile(file, 'utf8');

describe('skill reading contracts', () => {
  it.each(['motion-direction', 'accessibility-audit', 'local-pattern-extension'])(
    'designer %s includes platform and handoff evidence',
    (id) => {
      const task = skillTaskTypes['squad-designer']!.find((entry) => entry.id === id)!;
      expect(task.references).toEqual(
        expect.arrayContaining([
          'platform-web-foundations-and-motion.md',
          'design-system-ux-accessibility-and-handoff.md',
        ])
      );
    }
  );

  it.each(Object.keys(skillTaskTypes))(
    '%s reuses current instructions without loading every link',
    async (skill) => {
      const source = await read(`skills/${skill}/SKILL.md`);
      expect(source).toContain('Read only references whose trigger matches the current step');
      expect(source).toContain(
        'reread only after a file change, missing context or a scope change'
      );
    }
  );

  it.each(['squads-team', 'squad-fix'])(
    '%s routes only the selected execution mechanism',
    (skill) => {
      for (const runtime of ['codex', 'claude']) {
        const tasks = skillTaskTypes[skill]!;
        const subagent = tasks.find((task) => task.id.startsWith(`${runtime}-subagent`))!;
        expect(subagent.references).toContain(`${runtime}-worker-dispatch.md`);
        expect(subagent.references).not.toContain('thread-handoff.md');
        expect(subagent.references).not.toContain('codex-worktree-handoff.md');
        expect(subagent.references).not.toContain(`${runtime}-chat-dispatch.md`);
        const shared = tasks.find((task) => task.id.startsWith('codex-shared-checkout'))!;
        expect(shared.references).not.toContain('codex-worktree-handoff.md');
        const chat = tasks.find((task) => task.id.startsWith(`${runtime}-delegated`))!;
        expect(chat.references).toContain(`${runtime}-chat-dispatch.md`);
        expect(chat.references).not.toContain(`${runtime}-worker-dispatch.md`);
      }
    }
  );

  it('preserves the light tier when evidence changes after verification', async () => {
    const pipeline = await read('skills/squads-team/references/delivery-pipeline-and-roster.md');
    expect(pipeline).not.toContain('both gates run again');
    expect(pipeline).toContain('Light work keeps its combined verify pass');
  });
});
