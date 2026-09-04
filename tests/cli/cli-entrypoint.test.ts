import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const entrypoint = path.join(projectRoot, 'src', 'cli', 'cli.ts');

/**
 * `squad-skills-command.test.ts` covers the argv mapping in isolation. This file
 * covers the part that only exists once the process actually starts: resolving
 * the package root and its version from two directory levels up, locating the
 * Skills CLI through the module resolver, and turning a child process's exit
 * into this one's. Those had no test at all, in the file every user runs first.
 */
function runCli(arguments_: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [entrypoint, ...arguments_], {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
    child.once('error', reject);
    child.once('close', (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

describe('squad-skills entrypoint', () => {
  it('reports the version recorded in package.json', async () => {
    const manifest = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8')) as {
      version: string;
    };
    const result = await runCli(['--version']);

    expect(result.code).toBe(0);
    expect(result.stdout.trim()).toBe(manifest.version);
  });

  it('prints usage and exits zero when invoked with no command', async () => {
    const result = await runCli([]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('squad-skills add');
    expect(result.stdout).toContain('squad-skills list');
  });

  it('exits non-zero on an unknown command and still shows usage', async () => {
    const result = await runCli(['deploy']);

    expect(result.code).toBe(1);
    expect(result.stdout).toContain('Unknown command: deploy');
    expect(result.stdout).toContain('squad-skills add');
  });

  // The delegating branch, which is the only one that resolves the Skills CLI
  // and forwards a child exit code. `list` is used rather than `add` because it
  // writes nothing outside the repository.
  it('delegates list to the Skills CLI and returns its exit code', async () => {
    const result = await runCli(['list']);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('squads-team');
  });
});
