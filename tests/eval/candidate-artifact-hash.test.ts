import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { hashCandidateArtifact } from '../../src/eval/candidate-artifact-hash.ts';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true }))
  );
});

describe('hashCandidateArtifact', () => {
  it('returns null when the claimed artifact directory is absent', async () => {
    expect(await hashCandidateArtifact('/path/that/does/not/exist')).toBeNull();
  });

  it('changes with authored files and generated screenshots, but not build output', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'candidate-artifact-'));
    temporaryDirectories.push(root);
    await mkdir(path.join(root, 'screenshots'), { recursive: true });
    await mkdir(path.join(root, 'dist'), { recursive: true });
    await writeFile(path.join(root, 'component.ts'), 'export const value = 1;\n');
    await writeFile(path.join(root, 'screenshots', 'desktop.png'), Buffer.from([1, 2, 3]));
    await writeFile(path.join(root, 'dist', 'bundle.js'), 'generated-1');
    const original = await hashCandidateArtifact(root);

    await writeFile(path.join(root, 'dist', 'bundle.js'), 'generated-2');
    expect(await hashCandidateArtifact(root)).toBe(original);

    await writeFile(path.join(root, 'component.ts'), 'export const value = 2;\n');
    const sourceChanged = await hashCandidateArtifact(root);
    expect(sourceChanged).not.toBe(original);

    await writeFile(path.join(root, 'screenshots', 'desktop.png'), Buffer.from([3, 2, 1]));
    expect(await hashCandidateArtifact(root)).not.toBe(sourceChanged);
  });
});
