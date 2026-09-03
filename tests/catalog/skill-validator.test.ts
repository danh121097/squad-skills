import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
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

  it('holds a reference-style link to the same checks as an inline one', async () => {
    const projectRoot = await createProject();
    await createSkill(projectRoot, 'reference-skill', {
      body: '[Guide][guide] and [Away][away]\n\n[guide]: references/missing.md\n[away]: ../../outside.md',
    });

    const result = await validateSkills(projectRoot);

    expect(result.errors.some((error) => error.includes('broken local link'))).toBe(true);
    expect(result.errors.some((error) => error.includes('escapes its skill directory'))).toBe(true);
  });

  it('checks an angle-bracket destination rather than calling it broken', async () => {
    const projectRoot = await createProject();
    await createSkill(projectRoot, 'angle-skill', {
      body: '[Guide](<references/guide.md>) and [Away][away]\n\n[away]: <../../outside.md>',
      references: { 'guide.md': '# Guide\n' },
    });

    const result = await validateSkills(projectRoot);

    expect(result.errors.some((error) => error.includes('broken local link'))).toBe(false);
    expect(result.errors.some((error) => error.includes('escapes its skill directory'))).toBe(true);
  });

  it('sees a link after a closing fence written with indent', async () => {
    const projectRoot = await createProject();
    // The indented fence closes the block. Pairing the opener with the later
    // fence instead erased the real link between them.
    await createSkill(projectRoot, 'fence-skill', {
      body: '```\nexample\n  ```\n[Escape](../../outside.md)\n```\nmore\n```',
    });

    const result = await validateSkills(projectRoot);

    expect(result.errors.some((error) => error.includes('escapes its skill directory'))).toBe(true);
  });

  it('reads a destination past a balanced parenthesis', async () => {
    const projectRoot = await createProject();
    await createSkill(projectRoot, 'paren-skill', {
      body: '[Escape](references/(ok)/../../../outside.md)',
    });
    await mkdir(path.join(projectRoot, 'skills', 'paren-skill', 'references', '(ok'), {
      recursive: true,
    });

    const result = await validateSkills(projectRoot);

    expect(result.errors.some((error) => error.includes('escapes its skill directory'))).toBe(true);
  });

  it('keeps a parenthesised link title out of the path', async () => {
    const projectRoot = await createProject();
    await createSkill(projectRoot, 'title-skill', {
      body: '[Guide](references/guide.md (Guide title))',
      references: { 'guide.md': '# Guide\n' },
    });

    await expect(validateSkills(projectRoot)).resolves.toEqual({
      errors: [],
      skillNames: ['title-skill'],
    });
  });

  it('refuses a symlinked SKILL.md that leaves the skill directory', async () => {
    const projectRoot = await createProject();
    const skillRoot = path.join(projectRoot, 'skills', 'linked-entry');
    await mkdir(skillRoot, { recursive: true });
    const real = path.join(projectRoot, 'real-skill.md');
    await writeFile(
      real,
      '---\nname: linked-entry\ndescription: Test skill\n---\n\n[Escape](../../outside.md)\n',
      'utf8'
    );
    // Frontmatter is read through the symlink, so the links inside it have to
    // be reached too rather than skipped as neither file nor directory.
    await symlink(real, path.join(skillRoot, 'SKILL.md'));

    const result = await validateSkills(projectRoot);

    expect(
      result.errors.some((error) => error.includes('symlink resolves outside its skill directory'))
    ).toBe(true);
  });

  it('leaves bracket pairs in prose alone', async () => {
    const projectRoot = await createProject();
    await createSkill(projectRoot, 'prose-skill', {
      body: 'Read rows[0][1] and matrix[i][j] from the grid.',
    });

    await expect(validateSkills(projectRoot)).resolves.toEqual({
      errors: [],
      skillNames: ['prose-skill'],
    });
  });

  it('reads paths written as code as prose, not as links', async () => {
    const projectRoot = await createProject();
    await createSkill(projectRoot, 'code-skill', {
      body: 'Write `[Missing](references/missing.md)` to link a reference.\n\n```md\n[Sample](references/sample.md)\n```\n',
    });

    await expect(validateSkills(projectRoot)).resolves.toEqual({
      errors: [],
      skillNames: ['code-skill'],
    });
  });

  it('reports a link whose symlink lands outside the skill directory', async () => {
    const projectRoot = await createProject();
    await createSkill(projectRoot, 'symlink-skill', { body: '[Outside](references/guide.md)' });
    await writeFile(path.join(projectRoot, 'outside.md'), '# Outside\n', 'utf8');
    await mkdir(path.join(projectRoot, 'skills', 'symlink-skill', 'references'), {
      recursive: true,
    });
    // Lexically the link stays inside the skill; only the resolved path leaves.
    await symlink(
      path.join(projectRoot, 'outside.md'),
      path.join(projectRoot, 'skills', 'symlink-skill', 'references', 'guide.md')
    );

    const result = await validateSkills(projectRoot);

    expect(
      result.errors.some((error) => error.includes('resolves outside its skill directory'))
    ).toBe(true);
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
