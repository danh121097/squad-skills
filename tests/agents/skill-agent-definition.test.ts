import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

import {
  generatedMarker,
  readSkillAgentDefinition,
  renderClaudeAgentFile,
  renderCodexAgentFile,
} from '../../src/agents/skill-agent-definition.ts';

const skillsRoot = path.resolve(import.meta.dirname, '../../skills');
const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

const skillNames = (await readdir(skillsRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

describe('readSkillAgentDefinition', () => {
  it('finds every packaged skill', () => {
    expect(skillNames.length).toBeGreaterThan(0);
  });

  // The published CLI cannot import `yaml`, which is a development dependency,
  // so it carries its own reader. This is what stops the two from drifting: a
  // frontmatter form the shortcut reads differently fails here first.
  it.each(skillNames)('reads %s exactly as a real YAML parse does', async (name) => {
    const source = await readFile(path.join(skillsRoot, name, 'SKILL.md'), 'utf8');
    const parsed = parse(source.match(frontmatterPattern)?.[1] ?? '') as Record<string, unknown>;

    expect(readSkillAgentDefinition(source)).toEqual({
      description: parsed.description,
      name: parsed.name,
    });
  });

  it('refuses a file with no frontmatter', () => {
    expect(readSkillAgentDefinition('# squad-qa\n')).toBeNull();
  });

  it('refuses frontmatter with no description', () => {
    expect(readSkillAgentDefinition('---\nname: squad-qa\n---\n')).toBeNull();
  });
});

describe('rendering', () => {
  const definition = {
    description: 'Runs the QA gate. Use after a build.',
    name: 'squad-qa',
  };
  const skillPath = '/home/u/.claude/skills/squad-qa/SKILL.md';

  it('names the skill file the agent must read', () => {
    expect(renderClaudeAgentFile(definition, skillPath)).toContain(skillPath);
  });

  it('carries the whole skill description so the agent is picked the same way', () => {
    expect(renderClaudeAgentFile(definition, skillPath)).toContain(
      'description: "Runs the QA gate. Use after a build."'
    );
  });

  it('marks what it generated, which is what keeps a hand-authored file safe', () => {
    expect(renderClaudeAgentFile(definition, skillPath)).toContain(generatedMarker);
    expect(renderCodexAgentFile(definition, skillPath)).toContain(generatedMarker);
  });

  it('writes a model and an effort into the Claude Code file when asked for them', () => {
    const file = renderClaudeAgentFile(definition, '/skills/squad-qa/SKILL.md', {
      effort: 'medium',
      model: 'opus',
    });

    expect(file).toContain('\nmodel: opus\neffort: medium\n---\n');
  });

  // Model and effort arrive already resolved for the role, by the installer or
  // the plugin renderer, so the renderer adds neither on its own.
  it('writes neither when given neither', () => {
    const file = renderClaudeAgentFile(definition, '/skills/squad-qa/SKILL.md');

    expect(file).not.toContain('model:');
    expect(file).not.toContain('effort:');
  });

  // Codex reads this file as a config layer: under a table header the key is not
  // top level and the spawned role silently gets no instructions.
  it('puts the same body in a top-level developer_instructions key', () => {
    const rendered = renderCodexAgentFile(definition, skillPath);

    expect(rendered).not.toMatch(/^\[/m);
    expect(rendered).toMatch(/^developer_instructions = '''$/m);
    expect(rendered).toContain(renderClaudeAgentFile(definition, skillPath));
  });

  // A TOML literal string cannot escape its own delimiter, so the alternative
  // to refusing is a file that parses as something other than what was meant.
  it('refuses a body that would break out of the TOML literal string', () => {
    expect(() =>
      renderCodexAgentFile({ ...definition, description: "a ''' b" }, skillPath)
    ).toThrow(/cannot be written as a TOML literal string/);
  });

  it('never produces that delimiter from a shipped skill', async () => {
    for (const name of skillNames) {
      const source = await readFile(path.join(skillsRoot, name, 'SKILL.md'), 'utf8');
      const definition = readSkillAgentDefinition(source);

      expect(definition, name).not.toBeNull();
      expect(() => renderCodexAgentFile(definition!, skillPath), name).not.toThrow();
    }
  });
});
