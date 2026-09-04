import { chmod, mkdtemp, mkdir, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  describeRegistryDiscoveryFailure,
  extractRegistryUrls,
  findSourceRegistries,
  sourceRegistryFileName,
} from '../../src/eval/source-registry-links.ts';

/**
 * The liveness check named one skill's registry while seven others shipped one,
 * so those seven were cited to agents and verified by nothing. Nothing failed,
 * because a hard-coded list inside a top-level-await script is unreachable from
 * a test. These cases exist so the same blindness cannot return quietly.
 */
const projectRoot = path.resolve(import.meta.dirname, '..', '..');

async function makeSkillTree(registries: Record<string, string | null>): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'source-registry-'));

  for (const [skill, body] of Object.entries(registries)) {
    const references = path.join(root, 'skills', skill, 'references');

    await mkdir(references, { recursive: true });

    if (body !== null) {
      await writeFile(path.join(references, sourceRegistryFileName), body, 'utf8');
    }
  }

  return root;
}

describe('extractRegistryUrls', () => {
  it('reads a registry written as Markdown links', () => {
    expect(extractRegistryUrls('- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) is binding.')).toEqual([
      'https://www.w3.org/TR/WCAG22/',
    ]);
  });

  it('reads a registry written as bare URLs', () => {
    // Seven of eight registries are written this way. Matching only Markdown
    // links would have collected nothing from them while still exiting green.
    expect(
      extractRegistryUrls('- Docker: https://docs.docker.com/\n- Helm: https://helm.sh/docs/')
    ).toEqual(['https://docs.docker.com/', 'https://helm.sh/docs/']);
  });

  it('drops punctuation and delimiters that follow a URL rather than belong to it', () => {
    expect(
      extractRegistryUrls(
        [
          '- A: https://example.com/a, and B: https://example.com/b.',
          '- C: `https://example.com/c` and D: **https://example.com/d**',
          '- E: "https://example.com/e"',
        ].join('\n')
      )
    ).toEqual([
      'https://example.com/a',
      'https://example.com/b',
      'https://example.com/c',
      'https://example.com/d',
      'https://example.com/e',
    ]);
  });

  it('reads an http entry, which no registry should carry but nothing rejects', () => {
    // A scheme the pattern skips is a source cited to agents and checked by
    // nothing — the same silence as an undiscovered registry, one line down.
    expect(extractRegistryUrls('- Legacy: http://example.com/spec')).toEqual([
      'http://example.com/spec',
    ]);
  });

  it('returns each URL once per file, in the order it appears', () => {
    expect(
      extractRegistryUrls('https://b.example/ then https://a.example/ then https://b.example/')
    ).toEqual(['https://b.example/', 'https://a.example/']);
  });
});

describe('findSourceRegistries', () => {
  it('finds every skill that ships a registry and counts the ones that do not', async () => {
    const root = await makeSkillTree({
      'squad-b': '- https://b.example/',
      'squad-a': '- https://a.example/',
      'squad-c': null,
    });

    await expect(findSourceRegistries(root)).resolves.toEqual({
      registries: [
        `skills/squad-a/references/${sourceRegistryFileName}`,
        `skills/squad-b/references/${sourceRegistryFileName}`,
      ],
      skillCount: 3,
    });
  });

  it('reports the skill count when no skill ships a registry, so the caller can refuse', async () => {
    // The silent failure: with registries missing, the run would otherwise check
    // only knowledge cards and exit green having verified no registry at all.
    const discovery = await findSourceRegistries(await makeSkillTree({ 'squad-a': null }));

    expect(discovery.registries).toEqual([]);
    expect(discovery.skillCount).toBe(1);
  });

  it('reports nothing at all when there is no skills directory', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'source-registry-empty-'));

    await expect(findSourceRegistries(root)).resolves.toEqual({ registries: [], skillCount: 0 });
  });

  it('ignores a directory that merely carries the registry name', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'source-registry-dir-'));

    await mkdir(path.join(root, 'skills', 'squad-a', 'references', sourceRegistryFileName), {
      recursive: true,
    });

    await expect(findSourceRegistries(root)).resolves.toEqual({ registries: [], skillCount: 1 });
  });

  it('raises a permission error rather than reporting the registry absent', async () => {
    // An unreadable registry and a missing one are different facts. Swallowing
    // both would restore exactly the silence these cases exist to prevent.
    if (process.getuid?.() === 0) return;

    const root = await makeSkillTree({ 'squad-a': '- https://a.example/' });
    const references = path.join(root, 'skills', 'squad-a', 'references');

    await chmod(references, 0o000);

    try {
      await expect(findSourceRegistries(root)).rejects.toMatchObject({ code: 'EACCES' });
    } finally {
      await chmod(references, 0o755);
    }
  });

  it('covers every registry this repository ships', async () => {
    // Enumerated by a different traversal than discovery uses — one recursive
    // listing, not a probe per skill — so a discovery that silently narrowed to
    // one skill fails here instead of passing on the bug it was written against.
    const skillEntries = await readdir(path.join(projectRoot, 'skills'), { recursive: true });
    const suffix = path.posix.join('references', sourceRegistryFileName);
    const expected = skillEntries
      .map((entry) => entry.split(path.sep).join('/'))
      .filter((entry) => entry.endsWith(`/${suffix}`))
      .map((entry) => `skills/${entry}`)
      .sort();

    expect(expected.length).toBeGreaterThan(1);

    await expect(findSourceRegistries(projectRoot)).resolves.toMatchObject({
      registries: expected,
    });
  });
});

describe('describeRegistryDiscoveryFailure', () => {
  it('refuses a run where skills exist and no registry was found', () => {
    const failure = describeRegistryDiscoveryFailure({ registries: [], skillCount: 9 });

    expect(failure).toContain('9 skill(s)');
    expect(failure).toContain(sourceRegistryFileName);
  });

  it('accepts a discovery that found at least one registry', () => {
    expect(
      describeRegistryDiscoveryFailure({
        registries: [`skills/squad-a/references/${sourceRegistryFileName}`],
        skillCount: 9,
      })
    ).toBeUndefined();
  });

  it('accepts a project with no skills at all, which is not this repository failing', () => {
    expect(describeRegistryDiscoveryFailure({ registries: [], skillCount: 0 })).toBeUndefined();
  });
});
