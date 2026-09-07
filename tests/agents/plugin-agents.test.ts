import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  readSkillAgentDefinition,
  renderPluginAgentFile,
} from '../../src/agents/skill-agent-definition.ts';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const agentsRoot = path.join(projectRoot, 'agents');
const skillsRoot = path.join(projectRoot, 'skills');

const skillNames = (await readdir(skillsRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const agentFiles = (await readdir(agentsRoot)).filter((file) => file.endsWith('.md')).sort();

async function definitionOf(name: string) {
  const definition = readSkillAgentDefinition(
    await readFile(path.join(skillsRoot, name, 'SKILL.md'), 'utf8')
  );

  expect(definition, `${name} has unreadable frontmatter`).not.toBeNull();
  return definition!;
}

describe('plugin agent definitions', () => {
  it('ships one agent per skill and no orphans', () => {
    expect(agentFiles).toEqual(skillNames.map((name) => `${name}.md`));
  });

  // These files are committed rather than generated at install time, so this is
  // the only thing standing between them and a skill description that moved on
  // without them. On failure, regenerate rather than editing the agent by hand.
  it.each(skillNames)("agents/%s.md still matches that skill's SKILL.md", async (name) => {
    const committed = await readFile(path.join(agentsRoot, `${name}.md`), 'utf8');

    expect(
      committed,
      `agents/${name}.md is stale — regenerate it from skills/${name}/SKILL.md`
    ).toBe(renderPluginAgentFile(await definitionOf(name)));
  });

  it('reaches the skill by name, not by a path that only exists on one machine', async () => {
    for (const name of skillNames) {
      const committed = await readFile(path.join(agentsRoot, `${name}.md`), 'utf8');

      expect(committed, name).toContain(`Load the \`${name}\` skill`);
      expect(committed, name).not.toContain('/Users/');
    }
  });
});

describe('plugin manifests', () => {
  it('declares the plugin Claude Code loads', async () => {
    const manifest = JSON.parse(
      await readFile(path.join(projectRoot, '.claude-plugin/plugin.json'), 'utf8')
    ) as Record<string, unknown>;

    expect(manifest.name).toBe('squad-skills');
  });

  it('offers that plugin from the repository root, which is where the skills are', async () => {
    const marketplace = JSON.parse(
      await readFile(path.join(projectRoot, '.claude-plugin/marketplace.json'), 'utf8')
    ) as { name: string; owner: { name: string }; plugins: { name: string; source: string }[] };

    expect(marketplace.name).toBe('squad-skills');
    expect(marketplace.owner.name).not.toHaveLength(0);
    expect(marketplace.plugins).toEqual([
      expect.objectContaining({ name: 'squad-skills', source: './' }),
    ]);
  });
});
