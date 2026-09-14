import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  pluginManifestPaths,
  replaceManifestVersion,
  writeManifestPair,
  writeManifestSet,
} from '../../scripts/bump-release-version.ts';

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

describe('replaceManifestVersion', () => {
  it('targets both platform manifests during a release', () => {
    expect(
      pluginManifestPaths.map((manifestPath) => path.relative(process.cwd(), manifestPath))
    ).toEqual(['.claude-plugin/plugin.json', '.codex-plugin/plugin.json']);
  });

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

  it('updates the package, Claude plugin and Codex plugin as one manifest set', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'release-version-'));
    temporaryRoots.push(root);
    const paths = ['package.json', 'claude-plugin.json', 'codex-plugin.json'].map((name) =>
      path.join(root, name)
    );
    const original = '{"version":"1.0.0"}\n';
    const updated = '{"version":"1.0.1"}\n';
    await Promise.all(paths.map((manifestPath) => writeFile(manifestPath, original, 'utf8')));

    writeManifestSet(paths.map((manifestPath) => ({ path: manifestPath, original, updated })));

    await Promise.all(
      paths.map((manifestPath) => expect(readFile(manifestPath, 'utf8')).resolves.toBe(updated))
    );
  });

  it('restores earlier manifests when the Codex plugin write fails', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'release-version-'));
    temporaryRoots.push(root);
    const packagePath = path.join(root, 'package.json');
    const claudePluginPath = path.join(root, 'claude-plugin.json');
    const codexPluginPath = path.join(root, 'codex-plugin.json');
    const original = '{"version":"1.0.0"}\n';
    const updated = '{"version":"1.0.1"}\n';
    await writeFile(packagePath, original, 'utf8');
    await writeFile(claudePluginPath, original, 'utf8');
    await mkdir(codexPluginPath);

    expect(() =>
      writeManifestSet([
        { path: packagePath, original, updated },
        { path: claudePluginPath, original, updated },
        { path: codexPluginPath, original, updated },
      ])
    ).toThrow('rollback');

    await expect(readFile(packagePath, 'utf8')).resolves.toBe(original);
    await expect(readFile(claudePluginPath, 'utf8')).resolves.toBe(original);
  });
});
