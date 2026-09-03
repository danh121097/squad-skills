import path from 'node:path';

/**
 * Whether `candidate` sits inside `root`.
 *
 * Case is folded on darwin and win32 because their filesystems fold it too, so
 * two spellings that differ only in case name one path and must not read as
 * two. This compares strings and so cannot see a symlink: callers that care
 * about where a path really lands must pass paths they have already resolved.
 */
export function isInside(candidate: string, root: string): boolean {
  const relative = path.relative(fold(root), fold(candidate));

  if (path.isAbsolute(relative)) return false;

  return relative !== '..' && !relative.startsWith(`..${path.sep}`);
}

/** APFS and NTFS are case-insensitive by default, so a case variant is the same path. */
function fold(value: string): string {
  return process.platform === 'darwin' || process.platform === 'win32'
    ? value.toLowerCase()
    : value;
}
