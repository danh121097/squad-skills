import path from 'node:path';

/**
 * Whether `candidate` sits inside `root`.
 *
 * Both must already be resolved: this compares strings and cannot see a
 * symlink. Case is compared exactly, because `realpath` returns the name the
 * filesystem actually holds — so a case-insensitive volume has already folded
 * for us, and folding here as well would call `/Volumes/CS/store/secret.yml`
 * contained in `/Volumes/CS/Store`, which on a case-sensitive volume it is not.
 */
export function isInside(candidate: string, root: string): boolean {
  const relative = path.relative(root, candidate);

  if (path.isAbsolute(relative)) return false;

  return relative !== '..' && !relative.startsWith(`..${path.sep}`);
}
