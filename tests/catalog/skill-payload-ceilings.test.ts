import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { skillPayloadCeilings } from '../../src/catalog/skill-payload-ceilings.ts';
import { validateSkillPayloads } from '../../src/catalog/skill-payload-validator.ts';
import { measureSkillPayload } from '../../src/eval/skill-payload-measurement.ts';

/**
 * The manifest budget reaches three skills and binds a loaded-set figure for
 * one. These cases cover the gap that left: every shipped skill has a size
 * bound, the bound is derived from what the catalog ships rather than from a
 * list that can go stale, and it actually fails when a payload passes it.
 *
 * The fixtures matter more than the shipped-tree case. A green tree proves the
 * numbers are current; it cannot prove the check would fail on anything, and a
 * ceiling that never fires is the failure mode this was written against.
 */
const projectRoot = path.resolve(import.meta.dirname, '..', '..');
const temporaryRoots: string[] = [];

/** A scratch project root holding only the skills named, each one file. */
async function scratchCatalog(skills: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'payload-ceiling-'));

  temporaryRoots.push(root);
  // Always present, so "no skill ships this name" stays distinguishable from
  // "the catalog could not be read at all".
  await mkdir(path.join(root, 'skills'), { recursive: true });

  for (const [name, body] of Object.entries(skills)) {
    await mkdir(path.join(root, 'skills', name), { recursive: true });
    await writeFile(path.join(root, 'skills', name, 'SKILL.md'), body, 'utf8');
  }

  return root;
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

describe('skill payload ceilings', () => {
  it('checks every shipped skill and passes on the current tree', async () => {
    const result = await validateSkillPayloads(projectRoot);

    expect(result.errors).toEqual([]);
    // Bound against the recorded table rather than a literal, so adding a skill
    // cannot leave this asserting a count that no longer means "all of them".
    expect(result.checkedSkills).toEqual(Object.keys(skillPayloadCeilings).sort());
    expect(result.checkedSkills.length).toBeGreaterThan(0);
  });

  it('records a ceiling that is at or above what each skill measures today', async () => {
    for (const [skillName, ceiling] of Object.entries(skillPayloadCeilings)) {
      const measured = await measureSkillPayload({
        skillRoot: path.join(projectRoot, 'skills', skillName),
      });

      expect(
        measured.totalPayloadWords,
        `${skillName} measures over its ceiling`
      ).toBeLessThanOrEqual(ceiling);
    }
  });

  it('fails when a payload grows past its ceiling', async () => {
    const [skillName, ceiling] = Object.entries(skillPayloadCeilings)[0] as [string, number];
    const root = await scratchCatalog({ [skillName]: 'word '.repeat(ceiling + 1) });

    const result = await validateSkillPayloads(root);
    // The scratch catalog ships one skill, so every other recorded name is also
    // reported stale. Isolate the breach so those cannot satisfy this case.
    const breaches = result.errors.filter((error) => error.includes('total payload is'));

    expect(breaches).toHaveLength(1);
    expect(breaches[0]).toContain(`skills/${skillName}: total payload is ${ceiling + 1} words`);
    expect(breaches[0]).toContain(`over the recorded ceiling ${ceiling}`);
  });

  it('fails on a shipped skill that no ceiling covers', async () => {
    const root = await scratchCatalog({ 'squad-unrecorded': '# New role\n' });

    const result = await validateSkillPayloads(root);

    expect(
      result.errors.some((error) => error.includes('skills/squad-unrecorded: no payload ceiling'))
    ).toBe(true);
  });

  it('fails on a ceiling whose skill the catalog no longer ships', async () => {
    const root = await scratchCatalog({});

    const result = await validateSkillPayloads(root);

    // Every recorded name is now stale, which is what a rename would produce
    // one entry at a time.
    for (const skillName of Object.keys(skillPayloadCeilings)) {
      expect(
        result.errors.some((error) => error.includes(`records a ceiling for "${skillName}"`))
      ).toBe(true);
    }
  });

  it('reports an unreadable catalog instead of passing with nothing checked', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'payload-ceiling-empty-'));

    temporaryRoots.push(root);

    const result = await validateSkillPayloads(root);

    expect(result.checkedSkills).toEqual([]);
    expect(result.errors[0]).toContain('skills/ could not be read');
  });
});
