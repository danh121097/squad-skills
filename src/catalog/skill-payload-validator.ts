import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { findUnroutedReferences, measureSkillPayload } from '../eval/skill-payload-measurement.ts';

import { skillPayloadCeilings } from './skill-payload-ceilings.ts';
import { minimumTaskTypes, skillTaskTypes } from './skill-task-types.ts';

export interface SkillPayloadValidationResult {
  /** Skills whose payload was measured and compared, in catalog order. */
  checkedSkills: string[];
  errors: string[];
}

/**
 * Compares every shipped skill's payload against its recorded ceiling.
 *
 * Which figure the ceiling bounds depends on the skill. One that declares task
 * types in `skill-task-types.ts` is bounded on the median loaded set, because
 * that is what a run of it actually costs and taxing the total would tax the
 * routing that keeps a run cheap. One that declares none has no loaded set to
 * measure, so the total is the only bound available and the ceiling holds it.
 *
 * The measurement primitive lives under `src/eval/` because the evaluation
 * contract needed it first, but the question this asks is a catalog question —
 * is what the catalog ships still the size it was reviewed at — so the check
 * belongs here and runs in `pnpm validate` rather than `pnpm validate:evals`.
 * That matters for the six skills no manifest records: `validate:evals` would
 * never reach them.
 *
 * Membership is derived from `skills/` rather than from the ceiling table, so a
 * new skill fails until a ceiling is recorded for it. The reverse direction is
 * checked too: a ceiling naming a skill that no longer exists is a stale entry
 * that would sit unread, and a renamed skill would otherwise silently lose its
 * bound while the table still looked complete.
 */
export async function validateSkillPayloads(
  projectRoot: string
): Promise<SkillPayloadValidationResult> {
  const skillsDirectory = path.join(projectRoot, 'skills');
  const errors: string[] = [];
  const checkedSkills: string[] = [];

  let entries;

  try {
    entries = await readdir(skillsDirectory, { withFileTypes: true });
  } catch {
    return { checkedSkills, errors: [`skills/ could not be read, so no payload ceiling applies.`] };
  }

  const skillNames = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const skillName of skillNames) {
    const ceiling = skillPayloadCeilings[skillName];

    if (ceiling === undefined) {
      errors.push(
        `skills/${skillName}: no payload ceiling is recorded in src/catalog/skill-payload-ceilings.ts, so its size would grow unchecked. Measure it and record the figure.`
      );
      continue;
    }

    let measured;

    try {
      measured = await measureSkillPayload({
        skillRoot: path.join(skillsDirectory, skillName),
        taskTypes:
          skillTaskTypes[skillName] === undefined ? undefined : [...skillTaskTypes[skillName]],
      });
    } catch (error) {
      errors.push(`skills/${skillName}: payload could not be measured — ${String(error)}`);
      continue;
    }

    checkedSkills.push(skillName);

    const taskTypes = skillTaskTypes[skillName];

    if (taskTypes === undefined) {
      if (measured.totalPayloadWords > ceiling) {
        errors.push(
          `skills/${skillName}: total payload is ${measured.totalPayloadWords} words, over the recorded ceiling ${ceiling}. Cut the content, or raise the ceiling in the same change as a reviewed figure.`
        );
      }

      continue;
    }

    // A median over one or two task types is the value itself or the mean of
    // the pair, which a single narrow task type could drag anywhere.
    if (taskTypes.length < minimumTaskTypes) {
      errors.push(
        `skills/${skillName}: ${taskTypes.length} task type(s) declared in src/catalog/skill-task-types.ts, and a median needs at least ${minimumTaskTypes} to mean anything. Declare the rest, or remove the entry so the total payload binds instead.`
      );
      continue;
    }

    // A reference no task type loads is payload the median never counts, which
    // is exactly how a skill could grow without the ceiling noticing.
    const unrouted = findUnroutedReferences(measured, [...taskTypes]);

    if (unrouted.length > 0) {
      errors.push(
        `skills/${skillName}: ${unrouted.join(', ')} ${unrouted.length === 1 ? 'is' : 'are'} loaded by no task type in src/catalog/skill-task-types.ts, so the median does not count ${unrouted.length === 1 ? 'it' : 'them'}. Route ${unrouted.length === 1 ? 'it' : 'them'}, or delete the file.`
      );
      continue;
    }

    if (measured.medianLoadedWords > ceiling) {
      errors.push(
        `skills/${skillName}: the median task loads ${measured.medianLoadedWords} words, over the recorded ceiling ${ceiling}. Cut the content, route it to fewer tasks, or raise the ceiling in the same change as a reviewed figure.`
      );
    }
  }

  for (const recordedSkill of Object.keys(skillPayloadCeilings)) {
    if (!skillNames.includes(recordedSkill)) {
      errors.push(
        `src/catalog/skill-payload-ceilings.ts records a ceiling for "${recordedSkill}", which the catalog does not ship. Remove it, or restore the skill it was measured against.`
      );
    }
  }

  return { checkedSkills, errors };
}

/** Ceilings naming a skill with no task types bind the total payload instead. */
export function ceilingBoundFigure(skillName: string): 'median loaded' | 'total payload' {
  return skillTaskTypes[skillName] === undefined ? 'total payload' : 'median loaded';
}
