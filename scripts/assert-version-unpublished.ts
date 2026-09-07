/**
 * Refuses to start a publish when the manifest's version is already on the
 * registry.
 *
 * npm rejects a republish with E403 anyway, but only after `prepublishOnly` has
 * run the whole gate and the one-time password has been entered, and the
 * message ("You cannot publish over the previously published versions") reads
 * like a permissions problem rather than a forgotten version bump. This fails in
 * a second, before anything is built, and says what to do.
 *
 * It picks no version of its own. A script cannot know whether a change is a
 * patch or a break, and one that guessed would eventually ship a major as a
 * minor, so it prints the three candidates and leaves the decision where it
 * belongs.
 *
 * Usage: assert-version-unpublished.ts [path to package.json]
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import { nextVersion } from '../src/release/next-version.ts';

const manifestArg = process.argv[2] ?? 'package.json';
const manifestPath = resolve(process.cwd(), manifestArg);

const { name, version } = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
  name: string;
  version: string;
};

let publishedVersions: string[] = [];

try {
  const output = execFileSync('npm', ['view', name, 'versions', '--json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

  if (output !== '') {
    const parsed = JSON.parse(output) as string | string[];
    publishedVersions = Array.isArray(parsed) ? parsed : [parsed];
  }
} catch (error) {
  // A package that has never been published answers E404, and publishing it is
  // exactly what this script should allow. Anything else is a real failure:
  // treating an unreachable registry as "not published" would wave through the
  // republish this check exists to stop.
  const stderr =
    error !== null && typeof error === 'object' && 'stderr' in error ? String(error.stderr) : '';

  if (!stderr.includes('E404')) {
    console.error(`Could not ask npm which versions of ${name} exist.`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (publishedVersions.includes(version)) {
  console.error(
    [
      `${name}@${version} is already published; npm does not allow republishing a version.`,
      '',
      `Set a new version in ${manifestArg}, commit it, then retry:`,
      `  ${nextVersion(version, 'patch')}  no behaviour change for consumers`,
      `  ${nextVersion(version, 'minor')}  new skill, new role, or added guidance`,
      `  ${nextVersion(version, 'major')}  breaking — a skill removed or renamed, or the CLI's contract changed`,
    ].join('\n')
  );
  process.exit(1);
}

console.log(`${name}@${version} is not on npm yet; safe to publish.`);
