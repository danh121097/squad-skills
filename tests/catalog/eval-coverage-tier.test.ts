import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

/**
 * AGENTS.md ships skill content in two tiers: eval-covered, which runs the
 * evaluation cycle, and review-only, which cannot because no lane exists.
 *
 * The tier a skill sits in is a fact about the working tree — does
 * `evals/<skill>/case-manifest.yml` exist — and the danger is that it gets
 * restated as a list of skill names in prose. A list drifts the moment a lane
 * is added, and the rule then reads as permission the maintainers never gave.
 *
 * The second danger is quieter: one contributor-facing file keeps the retired
 * absolute rule, and a contributor reading that file concludes a review-only
 * skill can never be changed. `README.md` did exactly that for one review pass.
 * So the tier-qualification case below reads every such surface, not only the
 * files a given change happens to touch.
 */
const projectRoot = path.resolve(import.meta.dirname, '..', '..');

/** Every file that tells a contributor what evidence a change must carry. */
const contributorSurfaces = [
  'AGENTS.md',
  'CONTRIBUTING.md',
  'README.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
  'docs/skill-observations.md',
  'docs/evaluation-and-governance.md',
];

/** Wording that states the evaluation obligation. */
const obligationMarkers = [
  'evaluation cycle',
  'review alone',
  'review agreement alone',
  'needs-evaluation-cycle',
  'promotion approval',
];

/** Wording that makes skill content the subject of the sentence. */
const skillContentSubjects = ['skill content', 'skill-content', 'reads at runtime'];

const temporaryRoots: string[] = [];

/** A skill is eval-covered exactly when its lane carries a case manifest. */
async function deriveEvalCoveredSkills(root: string): Promise<string[]> {
  let entries;

  try {
    entries = await readdir(path.join(root, 'evals'), { withFileTypes: true });
  } catch {
    return [];
  }

  const covered: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    try {
      await readFile(path.join(root, 'evals', entry.name, 'case-manifest.yml'), 'utf8');
      covered.push(entry.name);
    } catch {
      // No case manifest under this lane directory, so the skill is review-only.
    }
  }

  return covered.sort();
}

const read = (relativePath: string): Promise<string> =>
  readFile(path.join(projectRoot, relativePath), 'utf8');

/** Returns the body of one `## ` section, so a rule is read where it is stated. */
function section(markdown: string, heading: string): string {
  const body = markdown.split(`\n## ${heading}\n`)[1];

  if (body === undefined) throw new Error(`No "## ${heading}" section found.`);

  return body.split('\n## ')[0] as string;
}

/**
 * Splits Markdown into the units a reader takes a rule from: one list item, one
 * table row, or one paragraph. Reading whole sections instead would let a
 * qualified sentence nearby vouch for an unqualified one.
 */
function statementUnits(markdown: string): string[] {
  const units: string[] = [];
  let current: string[] = [];

  const flush = (): void => {
    if (current.length > 0) units.push(current.join(' '));
    current = [];
  };

  for (const line of markdown.split('\n')) {
    const startsUnit = /^\s*(?:[-*+]|\d+\.)\s/.test(line) || line.startsWith('|');

    if (line.trim() === '' || startsUnit) flush();
    if (line.trim() !== '') current.push(line.trim());
  }

  flush();

  return units;
}

async function listSkills(): Promise<string[]> {
  const entries = await readdir(path.join(projectRoot, 'skills'), { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

afterEach(async () => {
  while (temporaryRoots.length > 0) {
    await rm(temporaryRoots.pop() as string, { force: true, recursive: true });
  }
});

describe('eval coverage tiers', () => {
  it('reads the covered set off disk, and every covered lane names a real skill', async () => {
    const covered = await deriveEvalCoveredSkills(projectRoot);
    const skills = await listSkills();

    // Without this the case passes on a tree with no `evals/` at all: the
    // derivation returns nothing and every assertion below runs on an empty set.
    expect(covered.length).toBeGreaterThan(0);

    // A lane for a skill that does not exist would put a name in the covered
    // set that no contributor could ever match against their change.
    for (const skill of covered) {
      expect(skills).toContain(skill);
      await expect(read(`skills/${skill}/SKILL.md`)).resolves.toBeTypeOf('string');
    }

    // Coverage is a property of the tree, so it cannot be every skill at once
    // while eight of them have no lane.
    expect(covered.length).toBeLessThanOrEqual(skills.length);
  });

  it('states both tiers in AGENTS.md without naming who is in them', async () => {
    const boundary = section(await read('AGENTS.md'), 'Contribution boundary');

    expect(boundary).toContain('eval-covered');
    expect(boundary).toContain('review-only');
    // The machine-checkable rule itself, so the tier is derived from the tree.
    expect(boundary).toContain('evals/<skill>/case-manifest.yml');

    for (const skill of await listSkills()) {
      // Word-anchored: a future skill named after a common noun must not fail
      // this for appearing inside another word.
      expect(boundary).not.toMatch(new RegExp(`\\b${skill}\\b`));
    }
  });

  it('never states the evaluation obligation without naming the tier it binds', async () => {
    for (const surface of contributorSurfaces) {
      const units = statementUnits(await read(surface));

      for (const unit of units) {
        const text = unit.toLowerCase();
        const bindsSkillContent = skillContentSubjects.some((subject) => text.includes(subject));
        const statesObligation = obligationMarkers.some((marker) => text.includes(marker));

        if (!bindsSkillContent || !statesObligation) continue;

        // An unqualified statement of the rule reads as binding on all nine
        // skills, which is the rule the tiers replaced.
        expect(`${surface}: ${unit}`).toContain('val-covered');
      }
    }
  });

  it('points contributors at the same tiers from every contributor-facing surface', async () => {
    const accepted = section(await read('CONTRIBUTING.md'), 'What is accepted');

    // CONTRIBUTING points at the definitions rather than restating them, so the
    // two files cannot disagree about what a tier requires.
    expect(accepted).toContain('](AGENTS.md)');
    expect(accepted).toContain('eval-covered');
    expect(accepted).toContain('review-only');

    const template = await read('.github/PULL_REQUEST_TEMPLATE.md');

    expect(template).toContain('eval-covered');
    expect(template).toContain('review-only');
  });

  it('flips a skill to review-only when its case manifest goes away', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'eval-coverage-tier-'));
    temporaryRoots.push(root);

    const covered = path.join(root, 'evals', 'skill-with-lane');
    const manifest = path.join(covered, 'case-manifest.yml');

    await mkdir(covered, { recursive: true });
    await mkdir(path.join(root, 'evals', 'skill-without-lane'), { recursive: true });
    await writeFile(manifest, 'cases: []\n', 'utf8');

    // A lane directory alone is not coverage; the case manifest is what a cycle
    // needs to run at all.
    expect(await deriveEvalCoveredSkills(root)).toEqual(['skill-with-lane']);

    await rm(manifest);

    expect(await deriveEvalCoveredSkills(root)).toEqual([]);
  });

  /**
   * The tier a pull request declares is a checkbox, so the rule leans on a
   * property nothing states: an eval-covered skill's payload cannot move
   * silently, because `pnpm validate:evals` recomputes its recorded hash and
   * fails on the mismatch. Editing `squad-designer/SKILL.md` without
   * re-measuring reds the gate today.
   *
   * That property is what makes a mis-ticked checkbox low-stakes, and it holds
   * only while every covered skill actually has a hash recorded somewhere. A
   * lane added without a manifest entry — which is exactly what evaluation
   * fan-out produces — would remove it for that skill with nothing to say so.
   */
  it('records a payload hash for every eval-covered skill, so its payload cannot move unnoticed', async () => {
    const covered = await deriveEvalCoveredSkills(projectRoot);

    expect(covered.length).toBeGreaterThan(0);

    const laneNames = (await readdir(path.join(projectRoot, 'evals'), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    const manifests: string[] = [];

    for (const lane of laneNames) {
      try {
        manifests.push(await read(path.join('evals', lane, 'baseline-manifest.yml')));
      } catch {
        // A lane need not carry a baseline manifest; only the covered skills it
        // records matter here.
      }
    }

    for (const skillName of covered) {
      // A recorded hash is `skills.<name>` followed by a `payload_hash` line
      // before the next skill entry, which is the shape the manifest writes.
      const recorded = manifests.some((manifest) =>
        new RegExp(`\\n  ${skillName}:\\n(?:    .*\\n)*?    payload_hash:`).test(manifest)
      );

      expect(
        recorded,
        `${skillName} is eval-covered but no baseline manifest records its payload hash`
      ).toBe(true);
    }
  });
});
