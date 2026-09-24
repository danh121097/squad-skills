import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const skillsRoot = path.join(process.cwd(), 'skills');

/**
 * The description and trigger are read on every turn for every installed
 * skill, so their length is paid whether or not the skill runs. The limits
 * keep a trigger to what routing needs: what the skill does, and where the
 * nearest neighbour takes over instead.
 */
const maxDescriptionWords = 35;
const maxWhenToUseWords = 25;

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

  it.each(skills)('%s keeps description and when_to_use within budget', async (skill) => {
    const frontmatter = await readFrontmatter(skill);

    expect(words(frontmatter.description)).toBeGreaterThan(0);
    expect(words(frontmatter.description)).toBeLessThanOrEqual(maxDescriptionWords);
    expect(words(frontmatter.when_to_use)).toBeGreaterThan(0);
    expect(words(frontmatter.when_to_use)).toBeLessThanOrEqual(maxWhenToUseWords);
  });
});
