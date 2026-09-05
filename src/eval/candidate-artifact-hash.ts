import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { hashContent } from './skill-payload-measurement.ts';

/** Tool-generated directories are not candidate-authored evidence. */
export const generatedArtifactDirectories = new Set([
  '.build',
  '.dart_tool',
  '.git',
  '.gradle',
  'build',
  'dist',
  'node_modules',
]);

/**
 * Hashes candidate-authored files plus generated screenshots in stable path
 * order. Returns null when the claimed artifact directory does not exist.
 */
export async function hashCandidateArtifact(runDirectory: string): Promise<string | null> {
  const entries: Array<{ content: string; path: string }> = [];

  const walk = async (directory: string, root = false): Promise<boolean> => {
    let children;

    try {
      children = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (root && (error as NodeJS.ErrnoException).code === 'ENOENT') return false;
      throw error;
    }

    for (const child of children) {
      const childPath = path.join(directory, child.name);

      if (child.isDirectory()) {
        if (!generatedArtifactDirectories.has(child.name)) await walk(childPath);
        continue;
      }

      if (!child.isFile()) continue;

      entries.push({
        content: (await readFile(childPath)).toString('base64'),
        path: path.relative(runDirectory, childPath).split(path.sep).join('/'),
      });
    }

    return true;
  };

  if (!(await walk(runDirectory, true))) return null;

  entries.sort((left, right) => compare(left.path, right.path));

  return hashContent(JSON.stringify(entries));
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
