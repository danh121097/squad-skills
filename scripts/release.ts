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

  run('scripts/bump-release-version.ts', bumpArgs);
  if (dryRun) return;

  run('scripts/assert-version-unpublished.ts', []);
  execFileSync('pnpm', ['publish', '--access', 'public', ...publishArgs], { stdio: 'inherit' });
}

main();
