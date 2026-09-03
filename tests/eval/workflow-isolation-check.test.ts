import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { validateWorkflowIsolation } from '../../src/eval/workflow-isolation-check.ts';

const temporaryDirectories: string[] = [];
const workflowsDirectory = path.posix.join('.github', 'workflows');
const privateStoreEnvVars = new Set(['EVAL_PRIVATE_PATH']);

const cleanWorkflow = [
  'name: Validate skills',
  '',
  'on:',
  '  pull_request:',
  '  push:',
  '    branches:',
  '      - main',
  '',
  'permissions:',
  '  contents: read',
  '',
  'jobs:',
  '  validate:',
  '    runs-on: ubuntu-latest',
  '    steps:',
  '      - run: pnpm test',
  '',
].join('\n');

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true }))
  );
});

describe('validateWorkflowIsolation', () => {
  it('accepts a workflow that resolves no store, no fork trigger, and no secret', async () => {
    const { errors, notes } = await check({ 'validate-skills.yml': cleanWorkflow });

    expect(errors).toEqual([]);
    expect(notes.some((note) => note.includes('1 workflow(s) checked'))).toBe(true);
  });

  it('refuses a workflow that resolves the held-out store', async () => {
    const { errors } = await check({
      'leak.yml': `${cleanWorkflow}\n        env:\n          EVAL_PRIVATE_PATH: ./holdout\n`,
    });

    expect(
      errors.some((error) => error.includes('names EVAL_PRIVATE_PATH; the held-out set'))
    ).toBe(true);
  });

  it('reads the variable name from the manifest rather than assuming one', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'workflows-'));

    temporaryDirectories.push(root);
    await mkdir(path.join(root, workflowsDirectory), { recursive: true });
    await writeFile(
      path.join(root, workflowsDirectory, 'leak.yml'),
      `${cleanWorkflow}\n        env:\n          HOLDOUT_PATH: ./holdout\n`
    );

    const errors: string[] = [];

    await validateWorkflowIsolation({
      errors,
      notes: [],
      privateStoreEnvVars: new Set(['HOLDOUT_PATH']),
      projectRoot: root,
      workflowsDirectory,
    });

    expect(errors.some((error) => error.includes('names HOLDOUT_PATH'))).toBe(true);
  });

  it('refuses pull_request_target, which runs a fork branch against this repository', async () => {
    const { errors } = await check({
      'fork.yml': cleanWorkflow.replace('  pull_request:', '  pull_request_target:'),
    });

    expect(errors.some((error) => error.includes('triggers on pull_request_target'))).toBe(true);
  });

  it('refuses a stored secret, so contributed code has nothing to exfiltrate', async () => {
    const { errors } = await check({
      'secret.yml': `${cleanWorkflow}      - run: publish --token \${{ secrets.NPM_TOKEN }}\n`,
    });

    expect(errors.some((error) => error.includes('reads stored secret(s) NPM_TOKEN'))).toBe(true);
  });

  it('allows the per-run GITHUB_TOKEN, which is scoped rather than stored', async () => {
    const { errors } = await check({
      'token.yml': `${cleanWorkflow}      - run: gh pr view\n        env:\n          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}\n`,
    });

    expect(errors).toEqual([]);
  });

  it('does not fail a workflow for explaining in a comment what it avoids', async () => {
    const { errors } = await check({
      'commented.yml': `# Never set EVAL_PRIVATE_PATH here, and never use pull_request_target.\n${cleanWorkflow}`,
    });

    expect(errors).toEqual([]);
  });

  // Only a quoted scalar hides a `#`. In a plain scalar YAML starts a comment
  // at ` #` exactly as a text scan would, so the two agree and there is nothing
  // to catch; inside quotes the `#` is data and the whole line still runs.
  it('sees a store reference behind a hash in a single-quoted scalar', async () => {
    const { errors } = await check({
      'quoted.yml': `${cleanWorkflow}      - run: 'echo a # && env | grep EVAL_PRIVATE_PATH'\n`,
    });

    expect(errors.some((error) => error.includes('names EVAL_PRIVATE_PATH'))).toBe(true);
  });

  it('sees a secret behind a hash in a double-quoted scalar', async () => {
    const { errors } = await check({
      'quoted-secret.yml': `${cleanWorkflow}      - run: "echo a # \${{ secrets.NPM_TOKEN }}"\n`,
    });

    expect(errors.some((error) => error.includes('reads stored secret(s) NPM_TOKEN'))).toBe(true);
  });

  it('refuses a workflow it cannot parse rather than scanning nothing', async () => {
    const { errors } = await check({ 'broken.yml': 'on: [push\njobs: {{{\n' });

    expect(errors.some((error) => error.includes('could not be parsed as YAML'))).toBe(true);
  });

  it('notes an absent workflow directory rather than failing', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'workflows-'));

    temporaryDirectories.push(root);

    const errors: string[] = [];
    const notes: string[] = [];

    await validateWorkflowIsolation({
      errors,
      notes,
      privateStoreEnvVars,
      projectRoot: root,
      workflowsDirectory,
    });

    expect(errors).toEqual([]);
    expect(notes).toEqual([`${workflowsDirectory}/: no workflows found.`]);
  });
});

async function check(
  workflows: Record<string, string>
): Promise<{ errors: string[]; notes: string[] }> {
  const root = await mkdtemp(path.join(tmpdir(), 'workflows-'));

  temporaryDirectories.push(root);
  await mkdir(path.join(root, workflowsDirectory), { recursive: true });

  for (const [name, contents] of Object.entries(workflows)) {
    await writeFile(path.join(root, workflowsDirectory, name), contents);
  }

  const errors: string[] = [];
  const notes: string[] = [];

  await validateWorkflowIsolation({
    errors,
    notes,
    privateStoreEnvVars,
    projectRoot: root,
    workflowsDirectory,
  });

  return { errors, notes };
}
