/**
 * Gives a project install a lock entry that resolves on every machine.
 *
 * The npm CLI hands the Skills CLI its own package directory, so the Skills CLI
 * records each skill in `skills-lock.json` as a `local` source: a relative path
 * from the project to wherever `npx` unpacked this package. That path names the
 * user's home and npx cache, and it stops resolving once the cache is cleaned.
 *
 * The packaged skills are the ones the GitHub source carries at this version's
 * release tag, so each such entry is replaced with the entry the Skills CLI
 * writes for `npx skills add <repository>#v<version>`. The folder hash is the
 * Skills CLI's own and already matches, so only the source fields change.
 *
 * The entry shape and the file's formatting follow the pinned `skills`
 * package's project lock (version 1, two-space JSON, trailing newline). A
 * `skills` bump that changes either must change this file with it.
 */
import { access, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface ProjectLockRequest {
  packageRoot: string;
  projectRoot: string;
  /** The package's `repository.url`, naming its GitHub source. */
  repositoryUrl: string;
  version: string;
}

const lockFileName = 'skills-lock.json';
const gitHubRepository = /github\.com[/:]([\w.-]+\/[\w.-]+?)(?:\.git)?\/?$/;

/**
 * Rewrites this package's entries and returns a line for the caller to print.
 * The install has already succeeded by now, so a lock this cannot read or
 * write is reported and left as it was rather than stopping the agent step.
 */
export async function recordPackageSourceInProjectLock(
  request: ProjectLockRequest
): Promise<string[]> {
  try {
    return await rewriteProjectLock(request);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    return [`Left ${lockFileName} unchanged: ${reason}.`];
  }
}

async function rewriteProjectLock(request: ProjectLockRequest): Promise<string[]> {
  const lockFile = path.join(request.projectRoot, lockFileName);
  const repository = request.repositoryUrl.match(gitHubRepository)?.[1];
  let source: string;

  try {
    source = await readFile(lockFile, 'utf8');
  } catch {
    return [];
  }

  if (repository === undefined) {
    return [`Left ${lockFileName} unchanged: ${request.repositoryUrl} is not a GitHub repository.`];
  }

  const lock: unknown = JSON.parse(source);
  const skills = isRecord(lock) && isRecord(lock.skills) ? lock.skills : {};
  const packageRoot = await realpath(request.packageRoot);
  const ref = `v${request.version}`;
  const rewritten: string[] = [];

  for (const [name, entry] of Object.entries(skills)) {
    if (!isRecord(entry)) continue;
    if (!(await isPackagedSkill(entry, name, request.projectRoot, packageRoot))) continue;

    // Same fields, same order as the Skills CLI's own GitHub project entry.
    skills[name] = {
      source: repository,
      ref,
      sourceType: 'github',
      skillPath: `skills/${name}/SKILL.md`,
      computedHash: entry.computedHash,
    };
    rewritten.push(name);
  }

  if (rewritten.length === 0) return [];

  await writeFile(lockFile, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');

  return [
    `Recorded ${repository}#${ref} as the source of ${rewritten.join(', ')} in ${lockFileName}.`,
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A `local` entry whose source is this package and which this package ships. */
async function isPackagedSkill(
  entry: Record<string, unknown>,
  name: string,
  projectRoot: string,
  packageRoot: string
): Promise<boolean> {
  if (entry.sourceType !== 'local' || typeof entry.source !== 'string') return false;

  try {
    const source = await realpath(path.resolve(projectRoot, entry.source));
    await access(path.join(packageRoot, 'skills', name, 'SKILL.md'));

    return source === packageRoot;
  } catch {
    return false;
  }
}
