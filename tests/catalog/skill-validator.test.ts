import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { validateSkills } from '../../src/catalog/skill-validator.ts';

const temporaryProjects: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryProjects
      .splice(0)
      .map((projectRoot) => rm(projectRoot, { force: true, recursive: true }))
  );
});

describe('validateSkills', () => {
  it('accepts a valid skill and its bundled reference', async () => {
    const projectRoot = await createProject();
    await createSkill(projectRoot, 'valid-skill', {
      body: '[Reference](references/guide.md)',
      references: { 'guide.md': '# Guide\n' },
    });

    await expect(validateSkills(projectRoot)).resolves.toEqual({
      errors: [],
      skillNames: ['valid-skill'],
    });
  });

  it('reports malformed or incomplete YAML frontmatter', async () => {
    const projectRoot = await createProject();
    const skillRoot = path.join(projectRoot, 'skills', 'broken-yaml');
    await mkdir(skillRoot, { recursive: true });
    await writeFile(path.join(skillRoot, 'SKILL.md'), '---\nname: [broken\n---\n', 'utf8');

    const result = await validateSkills(projectRoot);

    expect(result.errors.some((error) => error.includes('invalid YAML'))).toBe(true);
  });

  it('reports a skill directory without SKILL.md', async () => {
    const projectRoot = await createProject();
    await mkdir(path.join(projectRoot, 'skills', 'missing-skill-file'), { recursive: true });

    const result = await validateSkills(projectRoot);

    expect(result.errors).toContain('skills/missing-skill-file/SKILL.md: SKILL.md is missing.');
  });

  it('reports folder mismatches and duplicate skill names', async () => {
    const projectRoot = await createProject();
    await createSkill(projectRoot, 'first-folder', { name: 'shared-name' });
    await createSkill(projectRoot, 'second-folder', { name: 'shared-name' });

    const result = await validateSkills(projectRoot);

    expect(result.errors.filter((error) => error.includes('must match folder'))).toHaveLength(2);
    expect(result.errors.some((error) => error.includes('duplicate skill name'))).toBe(true);
  });

  it('reports broken and escaping local links', async () => {
    const projectRoot = await createProject();
    await createSkill(projectRoot, 'linked-skill', {
      body: '[Missing](references/missing.md)\n[Escape](../../outside.md)',
    });

    const result = await validateSkills(projectRoot);

    expect(result.errors.some((error) => error.includes('broken local link'))).toBe(true);
    expect(result.errors.some((error) => error.includes('escapes its skill directory'))).toBe(true);
  });
});

async function createProject(): Promise<string> {
  const projectRoot = await mkdtemp(path.join(tmpdir(), 'squad-skills-validator-'));
  temporaryProjects.push(projectRoot);
  await mkdir(path.join(projectRoot, 'skills'), { recursive: true });
  return projectRoot;
}

async function createSkill(
  projectRoot: string,
  directory: string,
  options: {
    body?: string;
    name?: string;
    references?: Record<string, string>;
  } = {}
): Promise<void> {
  const skillRoot = path.join(projectRoot, 'skills', directory);
  await mkdir(skillRoot, { recursive: true });

  const name = options.name ?? directory;
  const body = options.body ?? '# Instructions';
  const source = `---\nname: ${name}\ndescription: Test skill\n---\n\n${body}\n`;
  await writeFile(path.join(skillRoot, 'SKILL.md'), source, 'utf8');

  for (const [filename, content] of Object.entries(options.references ?? {})) {
    const referencePath = path.join(skillRoot, 'references', filename);
    await mkdir(path.dirname(referencePath), { recursive: true });
    await writeFile(referencePath, content, 'utf8');
  }
}
