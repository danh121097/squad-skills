import { readFile } from 'node:fs/promises';
import path from 'node:path';

const commitPattern = /^[0-9a-f]{40}$/;

/**
 * Reads the checked-out commit of a git working tree by parsing `.git`
 * directly. Deliberately avoids spawning git: the evaluation gate must stay
 * deterministic and free of subprocesses, and this only ever reads local files.
 *
 * Returns null when the path is not a readable git working tree, so callers can
 * report "not verified" instead of failing a repository that legitimately has
 * no git metadata.
 */
export async function readGitHeadCommit(worktreeRoot: string): Promise<string | null> {
  const gitDirectory = await resolveGitDirectory(worktreeRoot);

  if (gitDirectory === null) return null;

  const head = (await readOptionalFile(path.join(gitDirectory, 'HEAD')))?.trim();

  if (!head) return null;

  // Detached HEAD stores the commit directly.
  if (commitPattern.test(head)) return head;

  const ref = head.startsWith('ref:') ? head.slice(4).trim() : null;

  if (!ref) return null;

  const looseRef = (await readOptionalFile(path.join(gitDirectory, ref)))?.trim();

  if (looseRef && commitPattern.test(looseRef)) return looseRef;

  return readPackedRef(gitDirectory, ref);
}

/** Handles both a `.git` directory and the `.git` file a worktree or submodule uses. */
async function resolveGitDirectory(worktreeRoot: string): Promise<string | null> {
  const gitPath = path.join(worktreeRoot, '.git');
  const pointer = await readOptionalFile(gitPath);

  if (pointer === null) return gitPath;

  const target = pointer.trim().replace(/^gitdir:\s*/, '');

  if (target.length === 0) return null;

  return path.isAbsolute(target) ? target : path.resolve(worktreeRoot, target);
}

async function readPackedRef(gitDirectory: string, ref: string): Promise<string | null> {
  const packed = await readOptionalFile(path.join(gitDirectory, 'packed-refs'));

  if (packed === null) return null;

  for (const line of packed.split('\n')) {
    if (line.startsWith('#') || line.startsWith('^')) continue;

    const [commit, name] = line.trim().split(/\s+/);

    if (name === ref && commit && commitPattern.test(commit)) return commit;
  }

  return null;
}

/** Returns null for anything unreadable, including a directory. */
async function readOptionalFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}
