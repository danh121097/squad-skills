import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { skillPayloadCeilings } from '../../src/catalog/skill-payload-ceilings.ts';
import {
  ceilingBoundFigure,
  validateSkillPayloads,
} from '../../src/catalog/skill-payload-validator.ts';
import { minimumTaskTypes, skillTaskTypes } from '../../src/catalog/skill-task-types.ts';
import {
  findUnroutedReferences,
  measureSkillPayload,
} from '../../src/eval/skill-payload-measurement.ts';

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
      const taskTypes = skillTaskTypes[skillName];
      const measured = await measureSkillPayload({
        skillRoot: path.join(projectRoot, 'skills', skillName),
        taskTypes: taskTypes === undefined ? undefined : [...taskTypes],
      });
      // Which figure is current depends on what the skill declares, and reading
      // the wrong one would let a median-bounded skill look compliant on a
      // number nothing checks.
      const measuredFigure =
        ceilingBoundFigure(skillName) === 'median loaded'
          ? measured.medianLoadedWords
          : measured.totalPayloadWords;

      expect(measuredFigure, `${skillName} measures over its ceiling`).toBeLessThanOrEqual(ceiling);
    }
  });

  /**
   * A median is only honest while every reference reaches it. These three cases
   * cover the ways a declaration could quietly stop being one: a file no task
   * opens, a task that names a file the skill does not ship, and a set too small
   * for a median to mean anything.
   */
  it('routes every reference of every skill that declares task types', async () => {
    for (const [skillName, taskTypes] of Object.entries(skillTaskTypes)) {
      const measured = await measureSkillPayload({
        skillRoot: path.join(projectRoot, 'skills', skillName),
        taskTypes: [...taskTypes],
      });

      expect(
        findUnroutedReferences(measured, [...taskTypes]),
        `${skillName} ships a reference no task type loads`
      ).toEqual([]);
    }
  });

  it('declares enough task types for a median, and names only skills that ship', async () => {
    for (const [skillName, taskTypes] of Object.entries(skillTaskTypes)) {
      expect(
        skillPayloadCeilings[skillName],
        `${skillName} has task types but no ceiling`
      ).toBeTypeOf('number');
      expect(
        taskTypes.length,
        `${skillName} declares too few task types for a median`
      ).toBeGreaterThanOrEqual(minimumTaskTypes);

      const ids = taskTypes.map((taskType) => taskType.id);

      expect(new Set(ids).size, `${skillName} repeats a task type id`).toBe(ids.length);
    }
  });

  it('binds the median rather than the total, so routed depth is affordable', async () => {
    const medianBound = Object.keys(skillPayloadCeilings).filter(
      (skill) => ceilingBoundFigure(skill) === 'median loaded'
    );

    expect(medianBound.length).toBeGreaterThan(0);

    for (const skillName of medianBound) {
      const measured = await measureSkillPayload({
        skillRoot: path.join(projectRoot, 'skills', skillName),
        taskTypes: [...(skillTaskTypes[skillName] as NonNullable<(typeof skillTaskTypes)[string]>)],
      });

      // The whole reason the median binds: a run opens materially less than the
      // skill ships. If these ever met, routing would have stopped happening and
      // the median would be the total under another name.
      expect(
        measured.medianLoadedWords,
        `${skillName} loads its whole payload for the median task`
      ).toBeLessThan(measured.totalPayloadWords);
    }
  });

  it('fails when a total-bounded payload grows past its ceiling', async () => {
    // A skill declaring no task types, so the total is what its ceiling holds.
    const skillName = Object.keys(skillPayloadCeilings).find(
      (skill) => ceilingBoundFigure(skill) === 'total payload'
    ) as string;
    const ceiling = skillPayloadCeilings[skillName] as number;
    const root = await scratchCatalog({ [skillName]: 'word '.repeat(ceiling + 1) });

    const result = await validateSkillPayloads(root);
    // The scratch catalog ships one skill, so every other recorded name is also
    // reported stale. Isolate the breach so those cannot satisfy this case.
    const breaches = result.errors.filter((error) => error.includes('total payload is'));

    expect(breaches).toHaveLength(1);
    expect(breaches[0]).toContain(`skills/${skillName}: total payload is ${ceiling + 1} words`);
    expect(breaches[0]).toContain(`over the recorded ceiling ${ceiling}`);
  });

  it('fails when the median task loads past its ceiling', async () => {
    // squad-mobile's task types all but one load the quality bar, so bloating
    // that one file is what moves a median rather than only the total.
    const skillName = 'squad-mobile';
    const ceiling = skillPayloadCeilings[skillName] as number;
    const taskTypes = skillTaskTypes[skillName] as NonNullable<(typeof skillTaskTypes)[string]>;
    const root = await scratchCatalog({ [skillName]: 'entrypoint' });
    const references = path.join(root, 'skills', skillName, 'references');

    await mkdir(references, { recursive: true });

    for (const file of new Set(taskTypes.flatMap((taskType) => taskType.references))) {
      const body = file === 'quality-bar-and-preflight.md' ? 'word '.repeat(ceiling + 1) : 'word';

      await writeFile(path.join(references, file), body, 'utf8');
    }

    const breaches = (await validateSkillPayloads(root)).errors.filter((error) =>
      error.includes('the median task loads')
    );

    expect(breaches).toHaveLength(1);
    expect(breaches[0]).toContain(`over the recorded ceiling ${ceiling}`);
    // The remedy the total-bounded message cannot offer.
    expect(breaches[0]).toContain('route it to fewer tasks');
  });

  it('leaves the median alone when new words land only below it', async () => {
    const skillName = 'squad-mobile';
    const taskTypes = skillTaskTypes[skillName] as NonNullable<(typeof skillTaskTypes)[string]>;
    const files = [...new Set(taskTypes.flatMap((taskType) => taskType.references))];
    // A file only one task type opens, in the task type that opens the fewest.
    // Words added there cannot reach the median unless that task overtakes it.
    const narrowest = [...taskTypes].sort(
      (left, right) => left.references.length - right.references.length
    )[0] as (typeof taskTypes)[number];
    const exclusive = narrowest.references.find(
      (file) => taskTypes.filter((taskType) => taskType.references.includes(file)).length === 1
    ) as string;

    expect(exclusive, `${skillName} has no task type with a reference of its own`).toBeTypeOf(
      'string'
    );

    const root = await scratchCatalog({ [skillName]: 'entrypoint' });
    const references = path.join(root, 'skills', skillName, 'references');

    await mkdir(references, { recursive: true });

    // Staggered on purpose: with every file the same size the task loads sit a
    // word apart, and any growth at all reorders them.
    for (const file of files) {
      await writeFile(
        path.join(references, file),
        file === exclusive ? 'word' : 'word '.repeat(300),
        'utf8'
      );
    }

    const measure = (): ReturnType<typeof measureSkillPayload> =>
      measureSkillPayload({
        skillRoot: path.join(root, 'skills', skillName),
        taskTypes: [...taskTypes],
      });
    const before = await measure();

    await writeFile(path.join(references, exclusive), 'word '.repeat(500), 'utf8');

    const after = await measure();

    // The total pays for every one of those words; the median pays for none.
    // This is the difference the whole task-type declaration exists to create,
    // and the reason routed depth is affordable where flat depth is not.
    expect(after.totalPayloadWords - before.totalPayloadWords).toBeGreaterThan(400);
    expect(after.medianLoadedWords).toBe(before.medianLoadedWords);
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
