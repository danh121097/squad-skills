import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { resolveHeldOutCaseFile } from '../../src/eval/held-out-store-access.ts';

/**
 * The holdout boundary, checked where it is acted on.
 *
 * A manifest is repository-owned, so none of this is about an attacker. It is
 * about a path that reads as contained and is not: every case below passes a
 * containment check written against the path as spelled.
 */
const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true }))
  );
});

describe('resolveHeldOutCaseFile', () => {
  it('returns the resolved file for a case inside the store', async () => {
    const { privatePath, store } = await createStore();
    await writeFile(path.join(store, 'cases', 'acc-001.yml'), 'id: acc-001\n', 'utf8');

    const located = await resolveHeldOutCaseFile({
      id: 'acc-001',
      laneSource: 'cases',
      privatePath,
    });

    expect(located.error).toBeUndefined();
    expect(located.file).toMatch(/acc-001\.yml$/);
  });

  it('refuses a case id that climbs out of the store', async () => {
    const { outside, privatePath } = await createStore();
    await writeFile(path.join(outside, 'secret.yml'), 'id: secret\n', 'utf8');

    const located = await resolveHeldOutCaseFile({
      id: '../../outside/secret',
      laneSource: 'cases',
      privatePath,
    });

    expect(located.file).toBeUndefined();
    expect(located.error).toContain('outside the held-out store');
  });

  it('refuses a lane source that is a symlink out of the store', async () => {
    const { outside, privatePath, store } = await createStore();
    await mkdir(path.join(outside, 'elsewhere'), { recursive: true });
    await writeFile(path.join(outside, 'elsewhere', 'acc-001.yml'), 'id: acc-001\n', 'utf8');
    // Spelled as a plain child of the store, so the written path is contained.
    await symlink(path.join(outside, 'elsewhere'), path.join(store, 'linked'));

    const located = await resolveHeldOutCaseFile({
      id: 'acc-001',
      laneSource: 'linked',
      privatePath,
    });

    expect(located.file).toBeUndefined();
    expect(located.error).toContain('outside the held-out store');
  });

  it('reports a missing case separately from an escaping one', async () => {
    const { privatePath } = await createStore();

    const located = await resolveHeldOutCaseFile({
      id: 'acc-404',
      laneSource: 'cases',
      privatePath,
    });

    expect(located.error).toContain('missing from the store');
  });
});

async function createStore(): Promise<{ outside: string; privatePath: string; store: string }> {
  const root = await mkdtemp(path.join(tmpdir(), 'squad-skills-holdout-'));
  temporaryRoots.push(root);

  const store = path.join(root, 'store');
  const outside = path.join(root, 'outside');
  await mkdir(path.join(store, 'cases'), { recursive: true });
  await mkdir(outside, { recursive: true });

  return { outside, privatePath: store, store };
}
