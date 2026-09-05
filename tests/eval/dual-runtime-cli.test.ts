import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const runner = path.join(projectRoot, 'scripts', 'run-squad-designer-eval.ts');
const temporaryProjects: string[] = [];
const sides = ['codex-subject-model', 'anthropic-judge-model'];

afterEach(async () => {
  await Promise.all(
    temporaryProjects.splice(0).map((directory) => rm(directory, { force: true, recursive: true }))
  );
});

describe('run-squad-designer-eval --dual-runtime', () => {
  it('exits non-zero when both sides are absent', async () => {
    const project = await fixture();

    expect(run(project).status).toBe(1);
  });

  it('exits non-zero when one side is absent', async () => {
    const project = await fixture();
    await candidate(project, sides[0]!);

    expect(run(project).status).toBe(1);
  });

  it('exits non-zero when both sides share a blocking failure', async () => {
    const project = await fixture();
    await Promise.all(sides.map((side) => candidate(project, side, "fetch('/api/data');")));

    expect(run(project).status).toBe(1);
  });

  it('exits zero when both sides are complete and passing', async () => {
    const project = await fixture();
    await Promise.all(sides.map((side) => candidate(project, side)));

    const result = run(project);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('NO DIVERGENCE');
  });

  it('preserves the non-blocking medium-only contract', async () => {
    const project = await fixture();
    await Promise.all(
      sides.map((side) => candidate(project, side, 'export const value = 1;', true))
    );

    expect(run(project).status).toBe(0);
  });
});

async function fixture(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'dual-runtime-cli-'));
  temporaryProjects.push(root);
  await mkdir(path.join(root, 'evals', 'squad-designer'), { recursive: true });
  await mkdir(path.join(root, 'skills', 'squad-designer'), { recursive: true });
  await writeFile(
    path.join(root, 'skills', 'squad-designer', 'SKILL.md'),
    '---\nname: squad-designer\ndescription: Fixture\n---\n\nFixture.\n'
  );
  await writeFile(
    path.join(root, 'evals', 'squad-designer', 'case-manifest.yml'),
    [
      'cycle_id: portability-cycle',
      'approved_dependencies:',
      '  react-native: []',
      'lanes:',
      '  development: {visibility: public, paid_judging: false, frozen: false}',
      'cases:',
      '  - id: portable',
      '    lane: development',
      '    category: native-react-native',
      '    target_platform: react-native',
      '    qualitative_rubric: []',
      '    seed: 1',
      '',
    ].join('\n')
  );
  await writeFile(
    path.join(root, 'evals', 'squad-designer', 'baseline-manifest.yml'),
    [
      'judging:',
      '  subject: {provider: codex, model: subject-model}',
      '  judge: {provider: anthropic, model: judge-model}',
      '',
    ].join('\n')
  );
  return root;
}

async function candidate(
  project: string,
  side: string,
  source = 'export const value = 1;',
  mediumFailure = false
): Promise<void> {
  const root = path.join(project, '.eval-runs', 'portability-cycle', `portable.${side}`);
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, 'component.ts'), source);
  await writeFile(
    path.join(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: { noEmit: true, skipLibCheck: true },
      files: ['component.ts'],
    })
  );
  if (mediumFailure) await writeFile(path.join(root, 'component.css'), '.x { color: #ff0044; }');
}

function run(project: string) {
  return spawnSync(process.execPath, [runner, '--dual-runtime', '--case', 'portable'], {
    cwd: project,
    encoding: 'utf8',
    timeout: 30_000,
  });
}
