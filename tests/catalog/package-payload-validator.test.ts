import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { validatePackagedSkillPayload } from '../../src/catalog/package-payload-validator.ts';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true }))
  );
});

describe('validatePackagedSkillPayload', () => {
  it('accepts an extracted package containing every authored skill file', async () => {
    const sourceProjectRoot = await project('source');
    const packagedProjectRoot = await project('package');
    await skill(sourceProjectRoot);
    await skill(packagedProjectRoot);

    await expect(
      validatePackagedSkillPayload({ packagedProjectRoot, sourceProjectRoot })
    ).resolves.toEqual([]);
  });

  it('reports a regular reference omitted from the extracted package', async () => {
    const sourceProjectRoot = await project('source');
    const packagedProjectRoot = await project('package');
    await skill(sourceProjectRoot);
    await skill(packagedProjectRoot, false);

    const errors = await validatePackagedSkillPayload({ packagedProjectRoot, sourceProjectRoot });

    expect(errors.join(' ')).toContain('missing authored skill payload file');
    expect(errors.join(' ')).toContain('skills/example/references/guide.md');
    expect(errors.join(' ')).toContain('broken local link');
  });

  it('reports a packaged reference whose bytes differ from the authored file', async () => {
    const sourceProjectRoot = await project('source');
    const packagedProjectRoot = await project('package');
    await skill(sourceProjectRoot);
    await skill(packagedProjectRoot);
    await writeFile(
      path.join(packagedProjectRoot, 'skills', 'example', 'references', 'guide.md'),
      '# Different but valid guide\n'
    );

    const errors = await validatePackagedSkillPayload({ packagedProjectRoot, sourceProjectRoot });

    expect(errors.join(' ')).toContain('differs from the authored file');
    expect(errors.join(' ')).toContain('skills/example/references/guide.md');
  });
});

async function project(name: string): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), `package-payload-${name}-`));
  temporaryDirectories.push(root);
  await mkdir(path.join(root, 'skills'), { recursive: true });
  return root;
}

async function skill(projectRoot: string, includeReference = true): Promise<void> {
  const root = path.join(projectRoot, 'skills', 'example');
  await mkdir(path.join(root, 'references'), { recursive: true });
  await writeFile(
    path.join(root, 'SKILL.md'),
    '---\nname: example\ndescription: Example skill\n---\n\n[Guide](references/guide.md)\n'
  );
  if (includeReference) await writeFile(path.join(root, 'references', 'guide.md'), '# Guide\n');
}
