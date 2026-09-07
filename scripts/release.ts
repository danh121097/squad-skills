/**
 * Cut a release: publish to npm, tag `main`, and open the GitHub release.
 *
 * Usage:
 *   pnpm release                      # publish the version package.json already has
 *   pnpm release patch --otp 123456   # bump first, then publish
 *   pnpm release 1.0.0 --dry-run
 *
 * With no argument this picks no version. A script cannot know whether a change
 * is a patch or a break, and one that guessed would eventually ship a major as a
 * minor — so the bare command publishes what the manifest already says, and
 * naming a bump stays an explicit act.
 *
 * The order is deliberate. Everything reversible happens first, the one
 * irreversible step happens alone, and git history is only written after the
 * registry has accepted the version — so a failed publish costs a restored
 * `package.json` and nothing else. Nothing here rewrites published history or
 * force-pushes; a failure after the publish is reported with the exact state it
 * left behind rather than undone.
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

const usage =
  `Usage: pnpm release [<${releaseTypes.join('|')}|x.y.z>] [--otp <code>] [--dry-run] [--yes]\n` +
  `       with no version argument, publishes the version package.json already carries`;

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

/**
 * The one useful line out of a failed command. A child process reports its
 * reason on stderr while its own `message` only restates the command line, so
 * preferring stderr is the difference between "couldn't connect to github.com"
 * and "Command failed".
 */
function describeFailure(error: unknown): string {
  const detail = error as { stderr?: string; message?: string };
  const stderr = detail.stderr?.trim();
  const text = stderr !== undefined && stderr !== '' ? stderr : (detail.message ?? String(error));

  return text.split('\n')[0] ?? '';
}

async function capture(command: string, args: string[]): Promise<string> {
  const { stdout } = await exec(command, args, { cwd: projectRoot });
  return stdout.trim();
}

/**
 * Git, for the calls that are expected to succeed. Without this a network blip
 * during preflight surfaced as an unhandled rejection and a Node stack trace,
 * which reads like the script broke rather than like the fetch did.
 */
async function git(...args: string[]): Promise<string> {
  try {
    return await capture('git', args);
  } catch (error) {
    fail(`\`git ${args.join(' ')}\` failed: ${describeFailure(error)}`);
  }
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

const originalManifest = await readFile(manifestPath, 'utf8');
const { name: packageName, version: currentVersion } = JSON.parse(originalManifest) as {
  name: string;
  version: string;
};

let targetVersion = currentVersion;

if (request !== undefined) {
  try {
    targetVersion = nextVersion(currentVersion, request);
  } catch (error) {
    fail(`${(error as Error).message}\n\n${usage}`);
  }
}

const bumping = targetVersion !== currentVersion;
const tag = `v${targetVersion}`;

const branch = await git('rev-parse', '--abbrev-ref', 'HEAD');
if (branch !== publishBranch) fail(`releases are cut from ${publishBranch}, not ${branch}.`);

if ((await git('status', '--porcelain')) !== '') {
  fail('the working tree has uncommitted changes. Commit or stash them first.');
}

await git('fetch', '--quiet', 'origin', publishBranch);
const divergence = await git(
  'rev-list',
  '--left-right',
  '--count',
  `origin/${publishBranch}...HEAD`
);

if (divergence !== '0\t0') {
  const [behind, ahead] = divergence.split('\t');
  fail(
    `local ${publishBranch} is ${ahead} ahead and ${behind} behind origin. Push or pull before releasing.`
  );
}

if ((await git('tag', '--list', tag)) !== '') fail(`tag ${tag} already exists locally.`);

if ((await git('ls-remote', '--tags', 'origin', tag)) !== '') {
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

// A published version can never be replaced. npm rejects a duplicate anyway,
// but only after the full gate has run, and its E403 reads like a permissions
// problem rather than a forgotten bump. This answers in a second, and says what
// to do instead.
try {
  const published = await capture('npm', ['view', `${packageName}@${targetVersion}`, 'version']);

  if (published !== '') {
    fail(
      `${packageName}@${targetVersion} is already published.\n` +
        `Name the bump to cut a new one: pnpm release <${releaseTypes.join('|')}|x.y.z>`
    );
  }
} catch {
  // A 404 is the answer this wants: the version is free.
}

if (otp === undefined && !dryRun) {
  console.warn(
    '\nNo --otp given. If the npm account has two-factor auth on writes, the publish will\n' +
      'stop before anything is published and package.json will be left as it is.\n'
  );
}

// ---------------------------------------------------------------------------
// Confirm, then act.
// ---------------------------------------------------------------------------

console.log(
  `\n${dryRun ? 'Rehearsing' : 'Releasing'} ${packageName} ` +
    `${bumping ? `${currentVersion} → ${targetVersion}` : `${targetVersion} (the version package.json already carries)`}\n` +
    `  npm      publish ${targetVersion} to registry.npmjs.org${dryRun ? ' (dry run)' : ''}\n` +
    `  git      ${bumping ? 'commit package.json, ' : ''}tag ${tag}, push to origin/${publishBranch}\n` +
    `  github   create release ${tag} with generated notes\n`
);

if (!dryRun && !assumeYes && !(await confirm('Publishing cannot be undone. Continue? [y/N] '))) {
  fail('cancelled.');
}

// The version is written before the publish because `prepublishOnly` rebuilds
// and re-checks the package against it. Restoring one file is the whole undo.
if (bumping) {
  await writeFile(
    manifestPath,
    originalManifest.replace(`"version": "${currentVersion}"`, `"version": "${targetVersion}"`)
  );
}

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
  if (bumping) await writeFile(manifestPath, originalManifest);

  fail(
    `${(error as Error).message}\nNothing was published${bumping ? `; package.json is back at ${currentVersion}` : ''}.`
  );
}

if (dryRun) {
  if (bumping) await writeFile(manifestPath, originalManifest);

  console.log(
    `\nRehearsal finished. Nothing was published, tagged or pushed` +
      `${bumping ? `, and package.json is back at ${currentVersion}` : ''}.\n`
  );
  process.exit(0);
}

// Past this line the registry has the version and cannot give it back, so a
// failure below is reported with the state it left rather than undone.
try {
  if (bumping) {
    await capture('git', ['add', 'package.json']);
    await capture('git', ['commit', '-m', `♻️chore(release): publish ${tag}`]);
  }

  await capture('git', ['tag', '-a', tag, '-m', tag]);
  await runVisible('git push', 'git', ['push', '--follow-tags', 'origin', publishBranch]);
} catch (error) {
  fail(
    `${packageName}@${targetVersion} IS published, but git did not finish: ${describeFailure(error)}\n` +
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
    `${packageName}@${targetVersion} is published and ${tag} is pushed, but the GitHub release was not created: ` +
      `${describeFailure(error)}\nRun: gh release create ${tag} --title ${tag} --generate-notes`
  );
}

console.log(
  `\nReleased ${packageName}@${targetVersion}.\n` +
    `  npm      https://www.npmjs.com/package/${packageName}/v/${targetVersion}\n` +
    `  github   https://github.com/danh121097/squad-skills/releases/tag/${tag}\n\n` +
    `Verify: npx ${packageName}@${targetVersion} --version\n`
);
