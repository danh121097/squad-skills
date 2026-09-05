import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

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
const stubSdkPath = '/SDKs/iPhoneSimulator.sdk';
/** Answers the SwiftUI SDK lookup so a case can exercise the compile step itself. */
const withSdk =
  (runner: CommandRunner): CommandRunner =>
  async (command, args, cwd) =>
    command === 'xcrun'
      ? { missing: false, output: '', status: 0, stdout: `${stubSdkPath}\n` }
      : runner(command, args, cwd);
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

  it.each([
    ['accept', 'pass'],
    ['"accept"', 'pass'],
    ['pass', 'pass'],
    ["'pass'", 'pass'],
    ['reject', 'fail'],
    ['"reject"', 'fail'],
    ['fail', 'fail'],
    ["'fail'", 'fail'],
  ] as const)('reads YAML-equivalent verdict %s as %s', async (verdict, status) => {
    const runDirectory = await directory({
      'manual-review.yml': [
        'reviewer: A Reviewer',
        'reviewed_on: 2026-08-28',
        `verdict: ${verdict}`,
        'notes: reviewed against the native design checklist',
      ].join('\n'),
    });

    const results = await runNativeCompileGate({
      run: succeeds,
      runDirectory,
      targetPlatform: 'compose',
    });

    expect(results[1]?.status).toBe(status);
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

  it.each([
    ['malformed YAML', 'reviewer: [broken'],
    [
      'unknown verdict',
      'reviewer: A Reviewer\nreviewed_on: 2026-08-28\nverdict: pending\nnotes: waiting',
    ],
    [
      'wrong field type',
      'reviewer: [A Reviewer]\nreviewed_on: 2026-08-28\nverdict: accept\nnotes: reviewed',
    ],
    [
      'invalid review date',
      'reviewer: A Reviewer\nreviewed_on: yesterday\nverdict: accept\nnotes: reviewed',
    ],
    [
      'impossible review date',
      'reviewer: A Reviewer\nreviewed_on: 2026-99-99\nverdict: accept\nnotes: reviewed',
    ],
    [
      'unknown field',
      'reviewer: A Reviewer\nreviewed_on: 2026-08-28\nverdict: accept\nnotes: reviewed\nunexpected: true',
    ],
  ])('leaves a %s record unverified', async (_label, source) => {
    const results = await runNativeCompileGate({
      run: succeeds,
      runDirectory: await directory({ 'manual-review.yml': source }),
      targetPlatform: 'compose',
    });

    expect(results[1]?.status).toBe('unverified');
  });

  it('passes every Swift source to swiftc in stable relative-path order', async () => {
    const runDirectory = await directory({
      'ZView.swift': 'struct ZView {}',
      'AView.swift': 'struct AView {}',
      'manual-review.yml':
        'reviewer: A Reviewer\nreviewed_on: 2026-08-28\nverdict: accept\nnotes: reviewed',
    });
    const run = vi.fn(withSdk(succeeds));

    await runNativeCompileGate({ run, runDirectory, targetPlatform: 'swiftui' });

    expect(run).toHaveBeenCalledWith(
      'swiftc',
      [
        '-typecheck',
        '-parse-as-library',
        '-sdk',
        stubSdkPath,
        '-target',
        'arm64-apple-ios17.0-simulator',
        './AView.swift',
        './ZView.swift',
      ],
      runDirectory
    );
  });

  it('includes nested authored Swift sources and skips generated dependency trees', async () => {
    const runDirectory = await directory({
      '.build/checkouts/dependency/Generated.swift': 'struct Generated {}',
      'Sources/App.swift': 'struct App {}',
      'manual-review.yml':
        'reviewer: A Reviewer\nreviewed_on: 2026-08-28\nverdict: accept\nnotes: reviewed',
    });
    const run = vi.fn(withSdk(succeeds));

    await runNativeCompileGate({ run, runDirectory, targetPlatform: 'swiftui' });

    expect(run).toHaveBeenCalledWith(
      'swiftc',
      [
        '-typecheck',
        '-parse-as-library',
        '-sdk',
        stubSdkPath,
        '-target',
        'arm64-apple-ios17.0-simulator',
        './Sources/App.swift',
      ],
      runDirectory
    );
  });

  // The one case that runs a real compiler. It uses an iOS-only modifier on
  // purpose: against the host macOS SDK this exact file reports
  // "'navigationBarTitleDisplayMode' is unavailable in macOS", so a pass here
  // is evidence the gate type-checked the platform the case targets rather
  // than whichever one the machine happened to offer.
  it('type-checks an @main iOS SwiftUI application against the simulator SDK', async () => {
    const runDirectory = await directory({
      'App.swift': [
        'import SwiftUI',
        '@main',
        'struct DemoApp: App {',
        '  var body: some Scene {',
        '    WindowGroup {',
        '      NavigationStack {',
        '        Text("Hello").navigationBarTitleDisplayMode(.inline)',
        '      }',
        '    }',
        '  }',
        '}',
      ].join('\n'),
      'manual-review.yml':
        'reviewer: A Reviewer\nreviewed_on: 2026-08-28\nverdict: accept\nnotes: reviewed',
    });
    const outcome = await runNativeCompileGate({
      run: realRunner,
      runDirectory,
      targetPlatform: 'swiftui',
    });

    // No Swift toolchain or no iOS SDK is an environment limit, not a result.
    if (outcome[0]?.status === 'unverified') return;

    expect(outcome[0]?.status).toBe('pass');
    expect(outcome[0]?.evidence[0]).toContain('-target arm64-apple-ios17.0-simulator');
  });

  it('reports Swift as unverified without invoking swiftc when no source exists', async () => {
    const run = vi.fn(succeeds);
    const results = await runNativeCompileGate({
      run,
      runDirectory: await directory(),
      targetPlatform: 'swiftui',
    });

    expect(run).not.toHaveBeenCalled();
    expect(results[0]?.status).toBe('unverified');
    expect(results[0]?.detail).toContain('no .swift source files');
  });

  it('reports a missing Swift toolchain after resolving real source inputs', async () => {
    const results = await runNativeCompileGate({
      run: withSdk(missing),
      runDirectory: await directory({ 'Valid.swift': 'struct Valid {}' }),
      targetPlatform: 'swiftui',
    });

    expect(results[0]?.status).toBe('unverified');
    expect(results[0]?.evidence[0]).toContain('./Valid.swift');
  });

  it.each([
    ['no xcrun', missing],
    ['an xcrun that fails', fails('xcrun: error: unable to find sdk')],
    [
      'an empty SDK path',
      (async () => ({ missing: false, output: '\n', status: 0 })) as CommandRunner,
    ],
  ])(
    'reports SwiftUI as unverified rather than compiling against the host SDK with %s',
    async (_label, run) => {
      const results = await runNativeCompileGate({
        run,
        runDirectory: await directory({ 'Valid.swift': 'struct Valid {}' }),
        targetPlatform: 'swiftui',
      });

      expect(results[0]?.status).toBe('unverified');
      expect(results[0]?.detail).toContain('iphonesimulator');
      expect(results[0]?.evidence[0]).toContain('xcrun --sdk iphonesimulator --show-sdk-path');
    }
  );

  it('keeps a candidate-named source an input rather than a compiler argument', async () => {
    const run = vi.fn(withSdk(succeeds));

    await runNativeCompileGate({
      run,
      runDirectory: await directory({ '-Xlinker.swift': 'struct Sneaky {}' }),
      targetPlatform: 'swiftui',
    });

    expect(run.mock.calls.at(-1)?.[1]).toContain('./-Xlinker.swift');
  });
});

const realRunner: CommandRunner = async (command, args, cwd) => {
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(command, [...args], { cwd, encoding: 'utf8', timeout: 10_000 });

  return {
    missing: (result.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT',
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
    status: result.status,
  };
};

async function directory(files: Record<string, string> = {}): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'native-'));

  temporaryDirectories.push(root);

  for (const [name, contents] of Object.entries(files)) {
    const file = path.join(root, name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, contents);
  }

  return root;
}
