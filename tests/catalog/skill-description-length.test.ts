import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const skillsRoot = path.join(process.cwd(), 'skills');

/** Discovery may truncate descriptions; keep the invocation condition first and compact. */
const maxDescriptionWords = 60;

async function readFrontmatter(skill: string): Promise<Record<string, unknown>> {
  const source = await readFile(path.join(skillsRoot, skill, 'SKILL.md'), 'utf8');
  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(source)?.[1];
  if (frontmatter === undefined) throw new Error(`${skill}: no frontmatter.`);

  return parse(frontmatter) as Record<string, unknown>;
}

function words(value: unknown): number {
  return typeof value === 'string' ? value.trim().split(/\s+/).length : 0;
}

describe('skill trigger length', async () => {
  const skills = (await readdir(skillsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  it.each(skills)('%s states when to invoke it within the word budget', async (skill) => {
    const { description } = await readFrontmatter(skill);

    expect(description).toMatch(/^Invoke /);
    expect((description as string).length).toBeLessThanOrEqual(260);
    expect(words(description)).toBeLessThanOrEqual(maxDescriptionWords);
  });
});
