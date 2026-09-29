import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const skillsRoot = path.join(process.cwd(), 'skills');

/**
 * The description is read on every turn for every installed skill, so its
 * length is paid whether or not the skill runs. Every agent reads it — Codex,
 * Cursor and OpenCode read nothing else — so it carries both halves of a
 * trigger: what the skill does, then when to invoke it and where the nearest
 * neighbour takes over instead.
 */
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

    expect(description).toMatch(/\bInvoke\b/);
    expect(words(description)).toBeLessThanOrEqual(maxDescriptionWords);
  });
});
