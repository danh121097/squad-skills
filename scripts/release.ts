/**
 * Publish the package after selecting a safe version from npm's registry.
 *
 * `pnpm release` defaults to a patch bump. Pass `--release-type minor` or
 * `--release-type major` when the reviewed change warrants it. `--dry-run`
 * only reports the selected version and never writes or publishes.
 */

import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';

import { releaseTypes, type ReleaseType } from '../src/release/next-version.ts';

/**
 * pnpm checks Git state during publish. The release flow intentionally changes
 * the two manifests immediately before publishing, so the clean-tree check
 * must be performed before the bump and disabled for that one publish command.
 * Keep the flag after caller arguments so it cannot be overridden accidentally.
 */
export function publishCommandArgs(publishArgs: string[]): string[] {
  return ['publish', '--access', 'public', ...publishArgs, '--no-git-checks'];
}

/** Reject an accidental publish that starts with unrelated local changes. */
export function assertCleanReleaseWorktree(status: string): void {
  if (status.trim() !== '') {
    throw new Error(
      'Release requires a clean working tree before the version bump. Commit or stash changes first.'
    );
  }
}

function parseArgs(argv: string[]): {
  releaseType: ReleaseType;
  dryRun: boolean;
  publishArgs: string[];
} {
  let releaseType: ReleaseType = 'patch';
  let dryRun = false;
  const publishArgs: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (argument === '--release-type') {
      const value = argv[index + 1];
      if (!value || !releaseTypes.includes(value as ReleaseType)) {
        throw new Error('Use --release-type major, minor, or patch.');
      }
      releaseType = value as ReleaseType;
      index += 1;
      continue;
    }
    if (!argument) throw new Error('Unexpected empty release argument.');
    publishArgs.push(argument);
  }

  if (dryRun && publishArgs.length > 0) {
    throw new Error('--dry-run cannot be combined with publish arguments.');
  }

  return { releaseType, dryRun, publishArgs };
}

function run(script: string, args: string[]): void {
  execFileSync(process.execPath, [resolve(script), ...args], { stdio: 'inherit' });
}

function main(): void {
  const { releaseType, dryRun, publishArgs } = parseArgs(process.argv.slice(2));
  const bumpArgs = ['--release-type', releaseType];
  if (dryRun) bumpArgs.push('--dry-run');

  if (!dryRun) {
    const status = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    assertCleanReleaseWorktree(status);
  }

  run('scripts/bump-release-version.ts', bumpArgs);
  if (dryRun) return;

  run('scripts/assert-version-unpublished.ts', []);
  execFileSync('pnpm', publishCommandArgs(publishArgs), { stdio: 'inherit' });
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  main();
}
