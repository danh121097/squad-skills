/**
 * Cut a release: bump the version, publish to npm, tag `main`, and open the
 * GitHub release.
 *
 * Usage:
 *   pnpm release -- patch --otp 123456
 *   pnpm release -- minor --dry-run
 *   pnpm release -- 1.0.0 --otp 123456 --yes
 *
 * The order is deliberate. Everything reversible happens first, the one
 * irreversible step happens alone, and git history is only written after the
 * registry has already accepted the version — so a failed publish costs a
 * restored `package.json` and nothing else. Nothing here rewrites published
 * history or force-pushes; a failure after the publish is reported with the
 * exact state it left behind rather than undone.
 */

import { execFile, spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { nextVersion, releaseTypes } from '../src/release/next-version.ts';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const manifestPath = fileURLToPath(new URL('../package.json', import.meta.url));
const publishBranch = 'main';

const usage = `Usage: pnpm release -- <${releaseTypes.join('|')}|x.y.z> [--otp <code>] [--dry-run] [--yes]`;

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((entry) => entry.startsWith('--')));
const dryRun = flags.has('--dry-run');
const assumeYes = flags.has('--yes');
const otp = readFlagValue('--otp');
const request = argv.find((entry) => !entry.startsWith('--') && !isFlagValue(entry));

/** `--otp 123456` and `--otp=123456` both, so neither shell habit surprises. */
function readFlagValue(name: string): string | undefined {
  const inline = argv.find((entry) => entry.startsWith(`${name}=`));
  if (inline !== undefined) return inline.slice(name.length + 1);

  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}

/** True when this positional is really the value of a preceding `--flag`. */
function isFlagValue(entry: string): boolean {
  const previous = argv[argv.indexOf(entry) - 1];
  return previous === '--otp';
}

function fail(message: string): never {
  console.error(`\nRelease aborted: ${message}\n`);
  process.exit(1);
}

const exec = promisify(execFile);

async function capture(command: string, args: string[]): Promise<string> {
  const { stdout } = await exec(command, args, { cwd: projectRoot });
  return stdout.trim();
}

/**
 * Run a command with its output attached to this terminal. The label replaces
 * the argument list in any error, because one of these carries the one-time
 * password and a thrown message is the one place it would be written down.
 */
function runVisible(label: string, command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: projectRoot, stdio: 'inherit' });

    child.on('error', (error) => reject(new Error(`${label} could not start: ${error.message}`)));
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${label} exited with code ${code}.`))
    );
  });
}

async function confirm(question: string): Promise<boolean> {
  if (!process.stdin.isTTY) {
    fail('stdin is not a terminal, so the confirmation cannot be asked. Pass --yes to skip it.');
  }

  const readline = createInterface({ input: process.stdin, output: process.stdout });

  try {
    return (await readline.question(question)).trim().toLowerCase() === 'y';
  } finally {
    readline.close();
  }
}

// ---------------------------------------------------------------------------
// Preflight. Every check runs before a single byte is written or published.
// ---------------------------------------------------------------------------

if (request === undefined) fail(usage);

const originalManifest = await readFile(manifestPath, 'utf8');
const currentVersion = (JSON.parse(originalManifest) as { version: string }).version;

let targetVersion: string;

try {
  targetVersion = nextVersion(currentVersion, request);
} catch (error) {
  fail(`${(error as Error).message}\n\n${usage}`);
}

const tag = `v${targetVersion}`;

const branch = await capture('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
if (branch !== publishBranch) fail(`releases are cut from ${publishBranch}, not ${branch}.`);

if ((await capture('git', ['status', '--porcelain'])) !== '') {
  fail('the working tree has uncommitted changes. Commit or stash them first.');
}

await capture('git', ['fetch', '--quiet', 'origin', publishBranch]);
const divergence = await capture('git', [
  'rev-list',
  '--left-right',
  '--count',
  `origin/${publishBranch}...HEAD`,
]);

if (divergence !== '0\t0') {
  const [behind, ahead] = divergence.split('\t');
  fail(
    `local ${publishBranch} is ${ahead} ahead and ${behind} behind origin. Push or pull before releasing.`
  );
}

if ((await capture('git', ['tag', '--list', tag])) !== '')
  fail(`tag ${tag} already exists locally.`);

if ((await capture('git', ['ls-remote', '--tags', 'origin', tag])) !== '') {
  fail(`tag ${tag} already exists on origin.`);
}

try {
  await capture('npm', ['whoami']);
} catch {
  fail('npm is not authenticated. Run `npm login` first.');
}

try {
  await capture('gh', ['auth', 'status']);
} catch {
  fail('the GitHub CLI is not authenticated. Run `gh auth login` first.');
}

// A published version can never be replaced, so the registry is asked before
// the gate runs rather than after it has spent two minutes.
try {
  const published = await capture('npm', ['view', `squad-skills@${targetVersion}`, 'version']);
  if (published !== '') fail(`squad-skills@${targetVersion} is already published.`);
} catch {
  // A 404 is the answer this wants: the version is free.
}

if (otp === undefined && !dryRun) {
  console.warn(
    '\nNo --otp given. If the npm account has two-factor auth on writes, the publish will\n' +
      'stop before anything is published and package.json will be restored.\n'
  );
}

// ---------------------------------------------------------------------------
// Confirm, then act.
// ---------------------------------------------------------------------------

console.log(
  `\n${dryRun ? 'Rehearsing' : 'Releasing'} squad-skills ${currentVersion} → ${targetVersion}\n` +
    `  npm      publish ${targetVersion} to registry.npmjs.org${dryRun ? ' (dry run)' : ''}\n` +
    `  git      commit package.json, tag ${tag}, push to origin/${publishBranch}\n` +
    `  github   create release ${tag} with generated notes\n`
);

if (!dryRun && !assumeYes && !(await confirm('Publishing cannot be undone. Continue? [y/N] '))) {
  fail('cancelled.');
}

// The version is written first because `prepublishOnly` rebuilds and re-checks
// the package against it. Restoring one file is the whole undo.
await writeFile(
  manifestPath,
  originalManifest.replace(`"version": "${currentVersion}"`, `"version": "${targetVersion}"`)
);

const publishArgs = ['publish', '--access', 'public', '--no-git-checks'];
if (otp !== undefined) publishArgs.push('--otp', otp);
if (dryRun) publishArgs.push('--dry-run');

try {
  // `--no-git-checks` is safe precisely here: this script already required a
  // clean tree on an in-sync `main`, and pnpm's own check would now trip over
  // the version bump it just made — and defaults to a `master` branch this
  // repository does not have.
  await runVisible('pnpm publish', 'pnpm', publishArgs);
} catch (error) {
  await writeFile(manifestPath, originalManifest);
  fail(
    `${(error as Error).message}\nNothing was published; package.json is back at ${currentVersion}.`
  );
}

if (dryRun) {
  await writeFile(manifestPath, originalManifest);
  console.log(
    `\nRehearsal finished. Nothing was published, tagged or pushed, and package.json is back at ${currentVersion}.\n`
  );
  process.exit(0);
}

// Past this line the registry has the version and cannot give it back, so a
// failure below is reported with the state it left rather than undone.
try {
  await capture('git', ['add', 'package.json']);
  await capture('git', ['commit', '-m', `♻️chore(release): publish ${tag}`]);
  await capture('git', ['tag', '-a', tag, '-m', tag]);
  await runVisible('git push', 'git', ['push', '--follow-tags', 'origin', publishBranch]);
} catch (error) {
  fail(
    `squad-skills@${targetVersion} IS published, but git did not finish: ${(error as Error).message}\n` +
      `Check \`git log\` and \`git tag\`, then push ${publishBranch} and ${tag} by hand.`
  );
}

try {
  await runVisible('gh release create', 'gh', [
    'release',
    'create',
    tag,
    '--title',
    tag,
    '--generate-notes',
  ]);
} catch (error) {
  fail(
    `squad-skills@${targetVersion} is published and ${tag} is pushed, but the GitHub release was not created: ` +
      `${(error as Error).message}\nRun: gh release create ${tag} --title ${tag} --generate-notes`
  );
}

console.log(
  `\nReleased squad-skills@${targetVersion}.\n` +
    `  npm      https://www.npmjs.com/package/squad-skills/v/${targetVersion}\n` +
    `  github   https://github.com/danh121097/squad-skills/releases/tag/${tag}\n\n` +
    `Verify: npx squad-skills@${targetVersion} --version\n`
);
