import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  runNativeCompileGate,
  type CommandOutcome,
  type CommandRunner,
} from '../../src/eval/native-compile-gate.ts';

const temporaryDirectories: string[] = [];

const succeeds: CommandRunner = async () => ({ missing: false, output: '', status: 0 });
const timesOut: CommandRunner = async () => ({
  missing: false,
  output: 'Timed out.',
  status: null,
});
const missing: CommandRunner = async () => ({ missing: true, output: 'ENOENT', status: 127 });
const fails =
  (output: string): CommandRunner =>
  async (): Promise<CommandOutcome> => ({ missing: false, output, status: 1 });

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true }))
  );
});

describe('runNativeCompileGate', () => {
  it.each(['flutter', 'react-native'])(
    'passes %s when the toolchain compiles',
    async (platform) => {
      const results = await runNativeCompileGate({
        run: succeeds,
        runDirectory: await directory(),
        targetPlatform: platform,
      });

      expect(results).toHaveLength(1);
      expect(results[0]?.status).toBe('pass');
      expect(results[0]?.tier).toBe('compile-tier');
    }
  );

  it('reports an absent toolchain as unverified, never as passing', async () => {
    const results = await runNativeCompileGate({
      run: missing,
      runDirectory: await directory(),
      targetPlatform: 'flutter',
    });

    expect(results[0]?.status).toBe('unverified');
    expect(results[0]?.detail).toContain('is not installed');
    expect(results[0]?.evidence[0]).toContain('attempted: flutter analyze');
  });

  it('reports a toolchain that never completed as unverified, not as a failure', async () => {
    const results = await runNativeCompileGate({
      run: timesOut,
      runDirectory: await directory(),
      targetPlatform: 'flutter',
    });

    expect(results[0]?.status).toBe('unverified');
    expect(results[0]?.detail).toContain('did not complete');
  });

  it('fails with the tail of the compiler output', async () => {
    const results = await runNativeCompileGate({
      run: fails('banner\nerror: cannot find type Foo in scope'),
      runDirectory: await directory(),
      targetPlatform: 'flutter',
    });

    expect(results[0]?.status).toBe('fail');
    expect(results[0]?.evidence).toContain('error: cannot find type Foo in scope');
  });

  it('marks a render-gated platform as having no compile tier', async () => {
    const results = await runNativeCompileGate({
      run: succeeds,
      runDirectory: await directory(),
      targetPlatform: 'web',
    });

    expect(results[0]?.status).toBe('unverified');
    expect(results[0]?.detail).toContain('render-gated instead');
  });

  it.each(['swiftui', 'compose'])(
    '%s reports compile plus an explicit human-review result',
    async (platform) => {
      const results = await runNativeCompileGate({
        run: succeeds,
        runDirectory: await directory(),
        targetPlatform: platform,
      });

      expect(results).toHaveLength(2);
      expect(results[1]?.tier).toBe('human-review');
      expect(results[1]?.status).toBe('unverified');
      expect(results[1]?.detail).toContain('no human has signed off');
    }
  );

  it('accepts a complete manual-review record', async () => {
    const runDirectory = await directory({
      'manual-review.yml': [
        'reviewer: A Reviewer',
        'reviewed_on: 2026-08-28',
        'verdict: accept',
        'notes: layout and typography match the established system',
      ].join('\n'),
    });

    const results = await runNativeCompileGate({
      run: succeeds,
      runDirectory,
      targetPlatform: 'swiftui',
    });

    expect(results[1]?.status).toBe('pass');
  });

  it('fails when a human reviewed and rejected the output', async () => {
    const runDirectory = await directory({
      'manual-review.yml': [
        'reviewer: A Reviewer',
        'reviewed_on: 2026-08-28',
        'verdict: reject',
        'notes: introduces a parallel type scale',
      ].join('\n'),
    });

    const results = await runNativeCompileGate({
      run: succeeds,
      runDirectory,
      targetPlatform: 'compose',
    });

    expect(results[1]?.status).toBe('fail');
    expect(results[1]?.severity).toBe('critical');
  });

  it('treats an incomplete review record as unverified and names the gaps', async () => {
    const runDirectory = await directory({ 'manual-review.yml': 'reviewer: A Reviewer\n' });

    const results = await runNativeCompileGate({
      run: succeeds,
      runDirectory,
      targetPlatform: 'swiftui',
    });

    expect(results[1]?.status).toBe('unverified');
    expect(results[1]?.detail).toContain('missing reviewed_on, verdict, notes');
  });
});

async function directory(files: Record<string, string> = {}): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'native-'));

  temporaryDirectories.push(root);

  for (const [name, contents] of Object.entries(files)) {
    await writeFile(path.join(root, name), contents);
  }

  return root;
}
