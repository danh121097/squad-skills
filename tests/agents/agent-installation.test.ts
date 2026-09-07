import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { installAgentDefinitions } from '../../src/agents/agent-installation.ts';

const packageRoot = path.resolve(import.meta.dirname, '../..');
let home: string;

async function installSkillInto(
  tool: '.claude' | '.agents' | '.codex',
  name: string
): Promise<void> {
  const directory = path.join(home, tool, 'skills', name);
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, 'SKILL.md'),
    await readFile(path.join(packageRoot, 'skills', name, 'SKILL.md'), 'utf8')
  );
}

function request(overrides: Partial<Parameters<typeof installAgentDefinitions>[0]> = {}) {
  return installAgentDefinitions({
    agents: ['claude-code', 'codex'],
    force: false,
    homeDirectory: home,
    packageRoot,
    projectRoot: home,
    scope: 'global',
    skills: ['squad-qa'],
    ...overrides,
  });
}

beforeEach(async () => {
  home = await mkdtemp(path.join(tmpdir(), 'squad-agents-'));
});

afterEach(async () => {
  await rm(home, { recursive: true, force: true });
});

describe('installAgentDefinitions', () => {
  it('writes each tool its own format and points both at the installed skill', async () => {
    await installSkillInto('.claude', 'squad-qa');
    await installSkillInto('.agents', 'squad-qa');

    const result = await request();
    const claude = await readFile(path.join(home, '.claude/agents/squad-qa.md'), 'utf8');
    const codex = await readFile(path.join(home, '.codex/agents/squad-qa.toml'), 'utf8');

    expect(result.written).toHaveLength(2);
    expect(claude).toContain(path.join(home, '.claude/skills/squad-qa/SKILL.md'));
    expect(codex).toContain('[agents.squad-qa]');
    expect(codex).toContain(path.join(home, '.agents/skills/squad-qa/SKILL.md'));
  });

  // Codex ignores an agent file its config does not name, so writing one
  // without registering it would report success and change nothing.
  it('registers the Codex agent and backs the config up before editing it', async () => {
    await installSkillInto('.agents', 'squad-qa');
    const configFile = path.join(home, '.codex/config.toml');
    await mkdir(path.dirname(configFile), { recursive: true });
    await writeFile(configFile, 'model = "gpt-5.6"\n');

    await request({ agents: ['codex'] });

    expect(await readFile(configFile, 'utf8')).toContain('config_file = "agents/squad-qa.toml"');
    expect(await readFile(`${configFile}.squad-skills-backup`, 'utf8')).toBe('model = "gpt-5.6"\n');
  });

  it('does not overwrite an agent file it did not generate', async () => {
    await installSkillInto('.claude', 'squad-qa');
    const agentFile = path.join(home, '.claude/agents/squad-qa.md');
    await mkdir(path.dirname(agentFile), { recursive: true });
    await writeFile(agentFile, 'mine\n');

    const result = await request({ agents: ['claude-code'] });

    expect(await readFile(agentFile, 'utf8')).toBe('mine\n');
    expect(result.written).toEqual([]);
    expect(result.messages.join('\n')).toContain('--force');
  });

  it('replaces that file when forced', async () => {
    await installSkillInto('.claude', 'squad-qa');
    const agentFile = path.join(home, '.claude/agents/squad-qa.md');
    await mkdir(path.dirname(agentFile), { recursive: true });
    await writeFile(agentFile, 'mine\n');

    await request({ agents: ['claude-code'], force: true });

    expect(await readFile(agentFile, 'utf8')).toContain('name: squad-qa');
  });

  it('overwrites the definition it generated on the previous install', async () => {
    await installSkillInto('.claude', 'squad-qa');
    await request({ agents: ['claude-code'] });

    expect((await request({ agents: ['claude-code'] })).written).toHaveLength(1);
  });

  // A definition pointing at a skill that is not there is worse than none.
  it('writes nothing for a tool the skill was not installed into', async () => {
    await installSkillInto('.claude', 'squad-qa');

    const result = await request();

    expect(result.written).toEqual([path.join(home, '.claude/agents/squad-qa.md')]);
    expect(result.messages.join('\n')).toContain('codex/squad-qa');
  });

  it('generates every packaged skill when none is named', async () => {
    await installSkillInto('.claude', 'squad-qa');
    await installSkillInto('.claude', 'squads-team');

    const result = await request({ agents: ['claude-code'], skills: [] });

    expect(result.written).toHaveLength(2);
  });

  // The Skills CLI writes Codex skills to the shared .agents/skills directory,
  // and wrote them to .codex/skills in earlier versions.
  it('finds a Codex skill in the legacy location too', async () => {
    await installSkillInto('.codex', 'squad-qa');

    expect((await request({ agents: ['codex'] })).written).toHaveLength(1);
  });

  it('declines Codex at project scope rather than guessing its config location', async () => {
    const result = await request({ agents: ['codex'], scope: 'project' });

    expect(result.written).toEqual([]);
    expect(result.messages.join('\n')).toContain('--global');
  });
});
