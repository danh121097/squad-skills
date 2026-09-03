import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * The published file list is stated in four places that cannot see each other:
 * `package.json`, the two release scripts, and the contribution contract.
 *
 * They drifted once. Adding `LICENSE` to `package.json` without touching
 * `expectedFiles` turned `pnpm release:check` red, and because the only CI job
 * runs that script first, `pnpm test`, `pnpm build` and `pnpm pack:check`
 * stopped running at all for six days. The failure was a metadata disagreement,
 * so it belongs to the offline suite rather than to a release gate nobody
 * reaches until publish time.
 */
const projectRoot = path.resolve(import.meta.dirname, '..', '..');

const read = (relativePath: string): Promise<string> =>
  readFile(path.join(projectRoot, relativePath), 'utf8');

/** Reads a `const <name> = [...]` string-array literal out of a script. */
function readArrayLiteral(source: string, name: string): string[] {
  const match = new RegExp(`const ${name} = \\[([^\\]]*)\\]`).exec(source);

  if (match?.[1] === undefined) throw new Error(`No ${name} array literal found.`);

  return [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1] as string);
}

describe('published file list', () => {
  it('is the same list in package.json and the release-readiness check', async () => {
    const packageMetadata = JSON.parse(await read('package.json')) as { files: string[] };
    const expectedFiles = readArrayLiteral(
      await read('scripts/check-release-readiness.ts'),
      'expectedFiles'
    );

    expect(packageMetadata.files).toEqual(expectedFiles);
  });

  it('ships LICENSE, and the tarball check demands it', async () => {
    const packageMetadata = JSON.parse(await read('package.json')) as { files: string[] };
    const requiredPaths = readArrayLiteral(
      await read('scripts/check-package-contents.ts'),
      'requiredPaths'
    );

    // The two checks read different things — a declared list and a packed
    // tarball — so agreeing that LICENSE ships is what keeps them from failing
    // each other.
    expect(packageMetadata.files).toContain('LICENSE');
    expect(requiredPaths).toContain('LICENSE');
  });

  it('is described the same way in the contribution contract', async () => {
    const agents = await read('AGENTS.md');
    const packaging = agents.split('\n').find((line) => line.includes('Package only'));

    if (packaging === undefined) throw new Error('AGENTS.md states no packaging rule.');

    const packageMetadata = JSON.parse(await read('package.json')) as { files: string[] };

    for (const entry of packageMetadata.files) {
      expect(packaging).toContain(entry);
    }
  });
});
