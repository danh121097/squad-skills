import { access, readFile } from 'node:fs/promises';
import { basename, isAbsolute, normalize, relative, resolve } from 'node:path';
import process from 'node:process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { sanitizeFeedbackText } from './create-daily-summary.ts';

const execFileAsync = promisify(execFile);
const INBOX_ROOT = 'plans/feedback/inbox';
const README_FILE = 'README.md';

export type PublishObservationOptions = {
  repoRoot: string;
  file: string;
  branch?: string;
  title?: string;
  body?: string;
  publish: boolean;
};

function parseArgs(argv: string[]): PublishObservationOptions {
  const values = new Map<string, string>();
  let publish = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--publish') {
      publish = true;
      continue;
    }
    if (!argument || !argument.startsWith('--')) {
      throw new Error(`Unexpected argument: ${argument ?? ''}`);
    }
    const key = argument.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
    values.set(key, value);
    index += 1;
  }

  const file = values.get('file');
  if (!file) throw new Error('Usage: --file plans/feedback/inbox/<observation>.md [--publish]');

  const repoRoot = resolve(values.get('repo-root') ?? process.cwd());
  const absoluteFile = resolve(repoRoot, file);
  const relativeFile = normalize(relative(repoRoot, absoluteFile)).replaceAll('\\', '/');
  const inboxPrefix = `${INBOX_ROOT}/`;
  if (
    isAbsolute(file) ||
    !relativeFile.startsWith(inboxPrefix) ||
    !relativeFile.endsWith('.md') ||
    basename(relativeFile) === README_FILE
  ) {
    throw new Error(`Observation must be a Markdown file below ${INBOX_ROOT}/.`);
  }

  return {
    repoRoot,
    file: relativeFile,
    ...(values.get('branch') ? { branch: values.get('branch') } : {}),
    ...(values.get('title') ? { title: values.get('title') } : {}),
    ...(values.get('body') ? { body: values.get('body') } : {}),
    publish,
  };
}

async function git(repoRoot: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd: repoRoot, encoding: 'utf8' });
  return String(stdout).trim();
}

async function assertOnlyObservationChanged(options: PublishObservationOptions): Promise<void> {
  const status = await git(options.repoRoot, ['status', '--porcelain', '--untracked-files=all']);
  const changed = status
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    .filter((path) => path && !path.includes(' -> '));

  const unexpected = changed.filter((path) => path !== options.file);
  if (unexpected.length > 0) {
    throw new Error(`Refusing to publish with unrelated changes: ${unexpected.join(', ')}`);
  }
}

async function assertBranchDoesNotExist(
  options: PublishObservationOptions,
  branch: string
): Promise<void> {
  const local = await git(options.repoRoot, ['branch', '--list', branch]);
  if (local) throw new Error(`Branch already exists locally: ${branch}`);

  try {
    await git(options.repoRoot, ['ls-remote', '--exit-code', '--heads', 'origin', branch]);
    throw new Error(`Branch already exists on origin: ${branch}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Branch already exists')) throw error;
    const exitCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: number }).code
        : undefined;
    if (exitCode === 2) return;
    throw new Error(`Could not verify whether origin has branch ${branch}.`);
  }
}

function defaultBranch(file: string): string {
  const slug = basename(file, '.md')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `automation/feedback-${slug || 'observation'}`;
}

function validateBranchName(branch: string): void {
  if (!/^[a-zA-Z0-9._/-]+$/.test(branch) || branch.includes('..') || branch.startsWith('-')) {
    throw new Error('Branch must contain only letters, numbers, dots, underscores and slashes.');
  }
}

export async function publishObservation(options: PublishObservationOptions): Promise<string> {
  const absoluteFile = resolve(options.repoRoot, options.file);
  await access(absoluteFile);
  const content = await readFile(absoluteFile, 'utf8');
  if (!content.trim()) throw new Error('Observation file is empty.');
  const normalizedContent = content.replace(/\r\n?/g, '\n').trimEnd();
  if (sanitizeFeedbackText(content) !== normalizedContent) {
    throw new Error(
      'Observation contains sensitive or machine-local content; redact it before publishing.'
    );
  }
  await assertOnlyObservationChanged(options);

  const currentBranch = await git(options.repoRoot, ['branch', '--show-current']);
  if (currentBranch !== 'main') {
    throw new Error(
      `Refusing to publish from ${currentBranch || 'detached HEAD'}; switch to main first.`
    );
  }

  const branch = options.branch ?? defaultBranch(options.file);
  validateBranchName(branch);
  const title = sanitizeFeedbackText(
    options.title ?? `chore(feedback): publish ${basename(options.file, '.md')}`
  ).replace(/[\r\n]+/g, ' ');
  const body = sanitizeFeedbackText(
    options.body ?? 'Publication-safe Squad observation. Review the evidence before merging.'
  );

  if (!options.publish) {
    return [
      `Would create branch: ${branch}`,
      `Would commit: ${options.file}`,
      `Would open a draft PR: ${title}`,
    ].join('\n');
  }

  // Configure credentials before checking or pushing the remote branch.
  await execFileAsync('gh', ['auth', 'setup-git'], { cwd: options.repoRoot, encoding: 'utf8' });
  await assertBranchDoesNotExist(options, branch);
  await git(options.repoRoot, ['diff', '--check']);
  await git(options.repoRoot, ['switch', '-c', branch]);
  await git(options.repoRoot, ['add', '--', options.file]);
  await git(options.repoRoot, ['commit', '-m', title]);
  await git(options.repoRoot, ['push', '--set-upstream', 'origin', branch]);
  await execFileAsync(
    'gh',
    [
      'pr',
      'create',
      '--repo',
      process.env.GITHUB_REPOSITORY ?? 'danh121097/squad-skills',
      '--base',
      'main',
      '--head',
      branch,
      '--draft',
      '--title',
      title,
      '--body',
      body,
    ],
    { cwd: options.repoRoot, encoding: 'utf8' }
  );

  return `Draft PR created from ${branch}.`;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  console.log(await publishObservation(options));
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  await main();
}
