import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { measureSkillPayload } from '../eval/skill-payload-measurement.ts';

import { skillPayloadCeilings } from './skill-payload-ceilings.ts';

export interface SkillPayloadValidationResult {
  /** Skills whose payload was measured and compared, in catalog order. */
  checkedSkills: string[];
  errors: string[];
}

/**
 * Compares every shipped skill's total payload against its recorded ceiling.
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
      measured = await measureSkillPayload({ skillRoot: path.join(skillsDirectory, skillName) });
    } catch (error) {
      errors.push(`skills/${skillName}: payload could not be measured — ${String(error)}`);
      continue;
    }

    checkedSkills.push(skillName);

    if (measured.totalPayloadWords > ceiling) {
      errors.push(
        `skills/${skillName}: total payload is ${measured.totalPayloadWords} words, over the recorded ceiling ${ceiling}. Cut the content, or raise the ceiling in the same change as a reviewed figure.`
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
