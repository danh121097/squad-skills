import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const entrypoint = path.join(packageRoot, 'src', 'cli', 'cli.ts');
const manifest = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8')) as {
  version: string;
};

let home: string;
let project: string;

/**
 * Runs the real CLI in a temp project with a temp home, so a project install is
 * judged by what lands on disk and a global one cannot touch the caller's own
 * `~/.claude` or `~/.codex`.
 */
function runCli(arguments_: string[]): Promise<{ code: number; output: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [entrypoint, ...arguments_], {
      cwd: project,
      env: {
        ...process.env,
        CLAUDE_CONFIG_DIR: path.join(home, '.claude'),
        CODEX_HOME: path.join(home, '.codex'),
        DISABLE_TELEMETRY: '1',
        DO_NOT_TRACK: '1',
        HOME: home,
        XDG_CONFIG_HOME: path.join(home, '.config'),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';

    child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.once('error', reject);
    child.once('close', (code) => resolve({ code: code ?? -1, output }));
  });
}

async function listFiles(directory: string): Promise<string[]> {
  const files: string[] = [];

  for (const entry of await readdir(directory, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) files.push(path.join(entry.parentPath, entry.name));
  }

  return files;
}

/** The skill path an agent body tells the agent to read. */
function skillPathIn(agentFile: string): string | undefined {
  return agentFile.match(/^Read `([^`]+)`/m)?.[1];
}

beforeEach(async () => {
  home = await realpath(await mkdtemp(path.join(tmpdir(), 'squad-home-')));
  project = await realpath(await mkdtemp(path.join(tmpdir(), 'squad-project-')));
});

afterEach(async () => {
  await rm(home, { recursive: true, force: true });
  await rm(project, { recursive: true, force: true });
});

describe('project-scope install', () => {
  it('writes no machine path anywhere in the project', async () => {
    const result = await runCli([
      'add',
      '--skill',
      'squad-qa',
      '--agent',
      'claude-code',
      '--agent',
      'codex',
      '-y',
    ]);

    expect(result.code, result.output).toBe(0);

    const machinePaths = [project, home, homedir(), packageRoot, '/Users/', '/home/', '/private/'];
    const files = await listFiles(project);

    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const content = await readFile(file, 'utf8');
      for (const machinePath of machinePaths) {
        expect(content, `${path.relative(project, file)} names ${machinePath}`).not.toContain(
          machinePath
        );
      }
    }
  });

  // The entry `npx skills add danh121097/squad-skills#v<version>` writes for the
  // same skill, so the Skills CLI can restore it on any machine. The lock is a
  // shared file, so an entry from another source keeps every byte.
  it('records the GitHub source at the release tag in skills-lock.json, with or without agents', async () => {
    const foreign = {
      source: 'someone/else',
      ref: 'v1.0.0',
      sourceType: 'github',
      skillPath: 'skills/other/SKILL.md',
      computedHash: 'f'.repeat(64),
    };
    await writeFile(
      path.join(project, 'skills-lock.json'),
      `${JSON.stringify({ version: 1, skills: { other: foreign } }, null, 2)}\n`
    );

    for (const extra of [[], ['--no-agents']]) {
      const result = await runCli([
        'add',
        '--skill',
        'squad-qa',
        '--agent',
        'claude-code',
        '-y',
        ...extra,
      ]);

      expect(result.code, result.output).toBe(0);

      const lock = JSON.parse(await readFile(path.join(project, 'skills-lock.json'), 'utf8'));

      expect(lock.skills['squad-qa']).toEqual({
        source: 'danh121097/squad-skills',
        ref: `v${manifest.version}`,
        sourceType: 'github',
        skillPath: 'skills/squad-qa/SKILL.md',
        computedHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect(lock.skills.other).toEqual(foreign);
    }
  });

  it('points each agent at a skill path that resolves from the project root', async () => {
    const result = await runCli([
      'add',
      '--skill',
      'squad-qa',
      '--agent',
      'claude-code',
      '--agent',
      'codex',
      '-y',
    ]);

    expect(result.code, result.output).toBe(0);

    const claude = await readFile(path.join(project, '.claude/agents/squad-qa.md'), 'utf8');
    const codex = await readFile(path.join(project, '.codex/agents/squad-qa.toml'), 'utf8');

    expect(skillPathIn(claude)).toBe('.claude/skills/squad-qa/SKILL.md');
    expect(skillPathIn(codex)).toBe('.agents/skills/squad-qa/SKILL.md');
    for (const agent of [claude, codex]) {
      expect(existsSync(path.join(project, skillPathIn(agent) as string))).toBe(true);
    }
    // Codex discovers project agents from `.codex/agents`; nothing registers them.
    expect(existsSync(path.join(project, '.codex/config.toml'))).toBe(false);
  });

  // A team layout: one shared skills folder, with `.claude/skills` linking to it.
  it('names the shared folder when .claude/skills links to .agents/skills', async () => {
    await mkdir(path.join(project, '.agents/skills'), { recursive: true });
    await mkdir(path.join(project, '.claude'));
    await symlink(path.join('..', '.agents', 'skills'), path.join(project, '.claude/skills'));

    const result = await runCli(['add', '--skill', 'squad-qa', '--agent', 'claude-code', '-y']);

    expect(result.code, result.output).toBe(0);

    const claude = await readFile(path.join(project, '.claude/agents/squad-qa.md'), 'utf8');

    expect(skillPathIn(claude)).toBe('.agents/skills/squad-qa/SKILL.md');
  });

  it('writes no model or effort unless the caller names one', async () => {
    const fieldsOf = async () => {
      const claude = await readFile(path.join(project, '.claude/agents/squad-qa.md'), 'utf8');
      const codex = await readFile(path.join(project, '.codex/agents/squad-qa.toml'), 'utf8');

      return {
        claude: claude.match(/^(model|effort): .+$/gm) ?? [],
        codex: codex.match(/^(model|model_reasoning_effort) = .+$/gm) ?? [],
      };
    };
    const add = (...extra: string[]) =>
      runCli([
        'add',
        '--skill',
        'squad-qa',
        '--agent',
        'claude-code',
        '--agent',
        'codex',
        '-y',
        ...extra,
      ]);

    for (const extra of [[], ['--model', 'inherit', '--effort', 'inherit']]) {
      expect((await add(...extra)).code).toBe(0);
      expect(await fieldsOf()).toEqual({ claude: [], codex: [] });
    }

    expect((await add('--agent', 'claude-code', '--model', 'opus', '--effort', 'high')).code).toBe(
      0
    );
    expect((await fieldsOf()).claude).toEqual(['model: opus', 'effort: high']);
  });
});

describe('global-scope install', () => {
  it('keeps absolute home paths, catalog defaults and Codex registration', async () => {
    const result = await runCli([
      'add',
      '--global',
      '--skill',
      'squad-qa',
      '--agent',
      'claude-code',
      '--agent',
      'codex',
      '-y',
    ]);

    expect(result.code, result.output).toBe(0);

    const claude = await readFile(path.join(home, '.claude/agents/squad-qa.md'), 'utf8');
    const codex = await readFile(path.join(home, '.codex/agents/squad-qa.toml'), 'utf8');

    expect(skillPathIn(claude)).toBe(path.join(home, '.claude/skills/squad-qa/SKILL.md'));
    expect(skillPathIn(codex)).toBe(path.join(home, '.agents/skills/squad-qa/SKILL.md'));
    expect(claude).toContain('\nmodel: opus\neffort: medium\n');
    expect(codex).toContain('\nmodel = "gpt-6.1-sol"\nmodel_reasoning_effort = "medium"\n');
    expect(await readFile(path.join(home, '.codex/config.toml'), 'utf8')).toContain(
      'config_file = "agents/squad-qa.toml"'
    );
    expect(existsSync(path.join(project, 'skills-lock.json'))).toBe(false);
  });
});
