import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { replaceManifestVersion, writeManifestPair } from '../../scripts/bump-release-version.ts';

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

describe('replaceManifestVersion', () => {
  it('updates only the manifest version while preserving the surrounding JSON', () => {
    const source = '{\n  "name": "example",\n  "version": "1.2.3",\n  "scripts": {}\n}\n';

    expect(replaceManifestVersion(source, '1.2.4')).toBe(
      '{\n  "name": "example",\n  "version": "1.2.4",\n  "scripts": {}\n}\n'
    );
  });

  it('refuses a document without a version field', () => {
    expect(() => replaceManifestVersion('{"name":"example"}', '1.0.0')).toThrow(
      'top-level version field'
    );
  });

  it('restores the package manifest if the plugin write fails', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'release-version-'));
    temporaryRoots.push(root);
    const packagePath = path.join(root, 'package.json');
    const pluginPath = path.join(root, 'plugin.json');
    const original = '{"version":"1.0.0"}\n';
    await writeFile(packagePath, original, 'utf8');
    await mkdir(pluginPath);

    expect(() =>
      writeManifestPair(packagePath, { original, updated: '{"version":"1.0.1"}\n' }, pluginPath, {
        original,
        updated: '{"version":"1.0.1"}\n',
      })
    ).toThrow('rollback');

    await expect(readFile(packagePath, 'utf8')).resolves.toBe(original);
  });
});
