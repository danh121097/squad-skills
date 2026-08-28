import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  assertInsideRunDirectory,
  createRunDirectory,
  RunDirectoryError,
} from '../../src/eval/eval-run-directory.ts';

const temporaryDirectories: string[] = [];
const cycleId = 'designer-presentational-code-2026-08-27';

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true }))
  );
});

describe('createRunDirectory', () => {
  it('creates an isolated directory outside the shipped catalog', async () => {
    const projectRoot = await project();
    const runDirectory = await createRunDirectory({
      caseId: 'dev-web-pricing-page-established-brand',
      cycleId,
      projectRoot,
    });

    expect((await stat(runDirectory)).isDirectory()).toBe(true);
    expect(path.relative(projectRoot, runDirectory).startsWith('.eval-runs')).toBe(true);
    expect(runDirectory).not.toContain(`${path.sep}skills${path.sep}`);
  });

  it('clears a previous run so a rerun cannot inherit stale artifacts', async () => {
    const projectRoot = await project();
    const first = await createRunDirectory({ caseId: 'dev-case', cycleId, projectRoot });

    await writeFile(path.join(first, 'stale.tsx'), 'export const Old = () => null;');

    const second = await createRunDirectory({ caseId: 'dev-case', cycleId, projectRoot });

    expect(second).toBe(first);
    await expect(stat(path.join(second, 'stale.tsx'))).rejects.toThrow();
  });

  it.each(['skills', 'evals', 'src', 'scripts', 'tests'])(
    'refuses a run root inside %s/',
    async (guarded) => {
      const projectRoot = await project();

      await expect(
        createRunDirectory({ caseId: 'dev-case', cycleId, projectRoot, runsRoot: guarded })
      ).rejects.toBeInstanceOf(RunDirectoryError);
    }
  );

  it.each(['../escape', 'Dev-Case', 'dev case', ''])(
    'refuses the unsafe case id %s',
    async (caseId) => {
      const projectRoot = await project();

      await expect(createRunDirectory({ caseId, cycleId, projectRoot })).rejects.toBeInstanceOf(
        RunDirectoryError
      );
    }
  );
});

describe('assertInsideRunDirectory', () => {
  it('resolves a path inside the run directory', () => {
    expect(assertInsideRunDirectory('/runs/case', 'src/Panel.tsx')).toBe(
      path.resolve('/runs/case', 'src/Panel.tsx')
    );
  });

  it.each([
    ['traversal into the catalog', '../../skills/squad-designer/SKILL.md'],
    ['an absolute path', '/etc/hosts'],
    ['the run directory itself', '.'],
  ])('refuses %s', (_label, candidate) => {
    expect(() => assertInsideRunDirectory('/runs/case', candidate)).toThrow(RunDirectoryError);
  });

  it('names the offending path so the refusal is actionable', () => {
    expect(() => assertInsideRunDirectory('/runs/case', '../../skills/x')).toThrow(
      /runs may not write to the repository/
    );
  });
});

async function project(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'runs-'));

  temporaryDirectories.push(root);

  return root;
}
