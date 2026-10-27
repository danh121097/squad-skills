import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { domainEvaluationCases } from '../../src/catalog/skill-domain-evaluation-cases.ts';
import { prepareSkillEvaluation } from '../../src/catalog/skill-evaluation.ts';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function packet(id: string) {
  const root = await mkdtemp(path.join(tmpdir(), 'squad-domain-eval-'));
  roots.push(root);
  const destination = path.join(root, 'packet');
  await prepareSkillEvaluation(process.cwd(), id, destination);
  return destination;
}

describe('domain evaluation fixtures', () => {
  it('prepares a partly framed product request with evaluator criteria separate from input', async () => {
    const destination = await packet('product-partial-frame');
    const scenario = domainEvaluationCases.find((item) => item.id === 'product-partial-frame')!;
    expect(await readFile(path.join(destination, 'workspace/brief.md'), 'utf8')).toBe(
      scenario.files['brief.md']
    );
    expect(await readFile(path.join(destination, 'prompt.txt'), 'utf8')).toBe(
      scenario.prompt + '\n'
    );
    expect(JSON.parse(await readFile(path.join(destination, 'rubric.json'), 'utf8'))).toEqual(
      scenario.criteria
    );
    await expect(readFile(path.join(destination, 'workspace/rubric.json'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('proves offline loss before repair and recovery, acknowledgement and concurrent enqueue after repair', async () => {
    const destination = await packet('mobile-offline-retry');
    const cwd = path.join(destination, 'workspace');
    const run = () =>
      promisify(execFile)(process.execPath, ['--test', '--test-reporter=tap'], { cwd });
    await expect(run()).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('fail 3'),
    });
    // Restoring on rejection still loses edits if the app restarts before send settles.
    await writeFile(
      path.join(cwd, 'outbox.mjs'),
      `export async function syncEdits(store, send) {
  for (const operation of await store.read()) {
    await store.write((await store.read()).filter(row => row.id !== operation.id));
    try {
      const acknowledgement = await send(operation);
      if (acknowledgement.id !== operation.id) throw new Error('Unrelated acknowledgement');
    } catch (error) {
      await store.write([operation, ...(await store.read())]);
      throw error;
    }
  }
}
`
    );
    await expect(run()).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringMatching(
        /not ok \d+ - restart while send is pending preserves persisted edits/
      ),
    });
    // An evaluator-owned reference repair establishes that the supplied contract is achievable.
    await writeFile(
      path.join(cwd, 'outbox.mjs'),
      `export async function syncEdits(store, send) {
  for (const operation of await store.read()) {
    const acknowledgement = await send(operation);
    if (acknowledgement.id !== operation.id) throw new Error('Unrelated acknowledgement');
    await store.write((await store.read()).filter(row => row.id !== operation.id));
  }
}
`
    );
    expect((await run()).stdout).toContain('pass 4');
  });

  it('exposes the unsafe CI boundary while the local test command remains runnable', async () => {
    const destination = await packet('devops-untrusted-pr');
    const cwd = path.join(destination, 'workspace');
    const text = await readFile(path.join(cwd, '.github/workflows/validate.yml'), 'utf8');
    const workflow = parse(text);
    expect(workflow.on).toBe('pull_request_target');
    expect(workflow.permissions.contents).toBe('write');
    expect(workflow.jobs.test.steps[1].env.DEPLOY_TOKEN).toContain('secrets.DEPLOY_TOKEN');
    expect((await promisify(execFile)(process.execPath, ['--test'], { cwd })).stdout).toContain(
      'pass 1'
    );
  });
});
