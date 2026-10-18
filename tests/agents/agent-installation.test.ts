import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { installAgentDefinitions } from '../../src/agents/agent-installation.ts';
import { workerModelReferences } from '../../src/agents/worker-models.ts';

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
    expect(codex).toMatch(/^developer_instructions = '''$/m);
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

    const config = await readFile(configFile, 'utf8');

    expect(config).toContain('config_file = "agents/squad-qa.toml"');
    // Codex picks a subagent by this text, so it carries the role's trigger, not its name.
    expect(config).toMatch(/description = ".*behavioral QA gate.*Invoke after a build/);
    expect(await readFile(`${configFile}.squad-skills-backup`, 'utf8')).toBe('model = "gpt-5.6"\n');
  });

  it('keeps the first backup when a later run edits the config again', async () => {
    await installSkillInto('.agents', 'squad-qa');
    await installSkillInto('.agents', 'squad-fix');
    const configFile = path.join(home, '.codex/config.toml');
    await mkdir(path.dirname(configFile), { recursive: true });
    await writeFile(configFile, 'model = "gpt-5.6"\n');

    await request({ agents: ['codex'], skills: ['squad-qa'] });
    await request({ agents: ['codex'], skills: ['squad-fix'] });

    expect(await readFile(`${configFile}.squad-skills-backup`, 'utf8')).toBe('model = "gpt-5.6"\n');
    expect(await readFile(configFile, 'utf8')).toContain('[agents.squad-fix]');
  });

  it('prints the entries to add when the config defines agents with dotted keys', async () => {
    await installSkillInto('.agents', 'squad-qa');
    const configFile = path.join(home, '.codex/config.toml');
    await mkdir(path.dirname(configFile), { recursive: true });
    await writeFile(configFile, 'agents.max_threads = 4\n');

    const result = await request({ agents: ['codex'] });

    expect(await readFile(configFile, 'utf8')).toBe('agents.max_threads = 4\n');
    expect(result.messages.join('\n')).toContain('[agents.squad-qa]');
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

  it("writes the caller's model and effort into the selected tool's agent file", async () => {
    await installSkillInto('.claude', 'squad-qa');
    await installSkillInto('.agents', 'squad-qa');

    await request({ agents: ['claude-code'], effort: 'medium', model: 'opus' });
    const result = await request({ agents: ['codex'], effort: 'medium', model: 'gpt-6.1-sol' });
    const claude = await readFile(path.join(home, '.claude/agents/squad-qa.md'), 'utf8');
    const codex = await readFile(path.join(home, '.codex/agents/squad-qa.toml'), 'utf8');

    expect(claude).toContain('model: opus');
    expect(claude).toContain('effort: medium');
    expect(codex).toContain('\nmodel = "gpt-6.1-sol"\n');
    expect(codex).toContain('\nmodel_reasoning_effort = "medium"\n');
    expect(result.messages.join('\n')).not.toContain('Ignored --model');
  });

  it("writes each role's default model and effort, and a named role's override over a bare one", async () => {
    await installSkillInto('.claude', 'squad-qa');
    await installSkillInto('.claude', 'squad-fix');
    await installSkillInto('.claude', 'squads-team');
    const fieldOf = async (name: string, field: string) =>
      (await readFile(path.join(home, `.claude/agents/${name}.md`), 'utf8')).match(
        new RegExp(`^${field}: (.+)$`, 'm')
      )?.[1];

    await request({ agents: ['claude-code'], skills: ['squad-qa', 'squad-fix'] });

    expect(await fieldOf('squad-qa', 'effort')).toBe('medium');
    expect(await fieldOf('squad-fix', 'effort')).toBe('medium');
    expect(await fieldOf('squad-qa', 'model')).toBe('sonnet');
    expect(await fieldOf('squad-fix', 'model')).toBe('opus');

    await request({
      agents: ['claude-code'],
      effort: 'low',
      model: 'haiku',
      roleEfforts: { 'squad-fix': 'xhigh', 'squad-qa': 'inherit' },
      roleModels: { 'squad-fix': 'sonnet', 'squad-qa': 'inherit' },
      skills: ['squad-qa', 'squad-fix', 'squads-team'],
    });

    expect(await fieldOf('squad-qa', 'effort')).toBeUndefined();
    expect(await fieldOf('squad-fix', 'effort')).toBe('xhigh');
    expect(await fieldOf('squads-team', 'effort')).toBe('low');
    expect(await fieldOf('squad-qa', 'model')).toBeUndefined();
    expect(await fieldOf('squad-fix', 'model')).toBe('sonnet');
    expect(await fieldOf('squads-team', 'model')).toBe('haiku');
  });

  it('keeps native agents and worker tables aligned for both tools without changing global defaults', async () => {
    const expected: Record<string, [string, string]> = {
      'squad-backend': ['gpt-6-luna', 'max'],
      'squad-code-review': ['gpt-6.1-sol', 'medium'],
      'squad-designer': ['gpt-6-luna', 'max'],
      'squad-devops': ['gpt-6-luna', 'max'],
      'squad-fix': ['gpt-6.1-sol', 'medium'],
      'squad-frontend': ['gpt-6-luna', 'max'],
      'squad-mobile': ['gpt-6-luna', 'max'],
      'squad-product': ['gpt-6.1-sol', 'medium'],
      'squad-qa': ['gpt-6-luna', 'max'],
      'squads-team': ['gpt-6.1-sol', 'medium'],
    };
    for (const name of Object.keys(expected)) await installSkillInto('.agents', name);
    const configFile = path.join(home, '.codex/config.toml');
    await mkdir(path.dirname(configFile), { recursive: true });
    const defaults =
      '[agents]\ndefault_subagent_model = "gpt-6-luna"\ndefault_subagent_reasoning_effort = "max"\n';
    await writeFile(configFile, defaults);

    const result = await request({ skills: [] });

    expect(result.written).toHaveLength(20);
    const opusRoles = new Set(['squad-code-review', 'squad-fix', 'squad-product', 'squads-team']);
    for (const [name, [model, effort]] of Object.entries(expected)) {
      const file = await readFile(path.join(home, `.codex/agents/${name}.toml`), 'utf8');
      expect(file, name).toContain(`\nmodel = "${model}"\n`);
      expect(file, name).toContain(`\nmodel_reasoning_effort = "${effort}"\n`);
      const claudeModel = opusRoles.has(name) ? 'opus' : 'sonnet';
      const claude = await readFile(path.join(home, `.claude/agents/${name}.md`), 'utf8');
      expect(claude, name).toContain(`\nmodel: ${claudeModel}\n`);
      expect(claude, name).toContain('\neffort: medium\n');
      for (const reference of workerModelReferences) {
        const table = await readFile(path.join(packageRoot, reference), 'utf8');
        expect(table, `${reference}: ${name}`).toContain(
          `| \`${name}\` | \`${model}\` | \`${effort}\` | \`${claudeModel}\` | \`medium\` |`
        );
      }
    }
    expect(await readFile(configFile, 'utf8')).toContain(defaults);
    expect(await readFile(`${configFile}.squad-skills-backup`, 'utf8')).toBe(defaults);
  });

  it('resolves Codex named overrides before bare values and omits inherited fields on reinstall', async () => {
    const skills = ['squad-qa', 'squad-fix', 'squads-team'];
    for (const name of skills) await installSkillInto('.agents', name);
    await request({ agents: ['codex'], skills });

    await request({
      agents: ['codex'],
      skills,
      model: 'gpt-6.1-sol',
      effort: 'max',
      roleModels: { 'squad-qa': 'inherit', 'squad-fix': 'gpt-6-luna' },
      roleEfforts: { 'squad-qa': 'low', 'squad-fix': 'inherit' },
    });

    const qa = await readFile(path.join(home, '.codex/agents/squad-qa.toml'), 'utf8');
    expect(qa).not.toMatch(/^model = /m);
    expect(qa).toContain('\nmodel_reasoning_effort = "low"\n');
    const fix = await readFile(path.join(home, '.codex/agents/squad-fix.toml'), 'utf8');
    expect(fix).toContain('\nmodel = "gpt-6-luna"\n');
    expect(fix).not.toMatch(/^model_reasoning_effort = /m);
    const team = await readFile(path.join(home, '.codex/agents/squads-team.toml'), 'utf8');
    expect(team).toContain('\nmodel = "gpt-6.1-sol"\n');
    expect(team).toContain('\nmodel_reasoning_effort = "max"\n');
  });

  it('declines Codex at project scope rather than guessing its config location', async () => {
    const result = await request({ agents: ['codex'], scope: 'project' });

    expect(result.written).toEqual([]);
    expect(result.messages.join('\n')).toContain('--global');
  });
});
