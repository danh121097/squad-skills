import { mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { boundaryClauses, retiredPhrases } from '../../src/catalog/cross-skill-contract-clauses.ts';
import {
  normalizeProse,
  validateCrossSkillContract,
  type BoundaryClause,
  type RetiredPhrase,
} from '../../src/catalog/cross-skill-contract-validator.ts';

const temporaryProjects: string[] = [];

const designerEntrypoint = 'skills/squad-designer/SKILL.md';
const designerHandoff =
  'skills/squad-designer/references/design-system-ux-accessibility-and-handoff.md';
const designerMotion = 'skills/squad-designer/references/platform-web-foundations-and-motion.md';
const designerNativeAppleAndroid =
  'skills/squad-designer/references/platform-native-apple-android.md';
const designerNativeCross = 'skills/squad-designer/references/platform-native-cross-platform.md';
const designerReferences = [
  'skills/squad-designer/references/anti-slop-quality-review.md',
  'skills/squad-designer/references/codebase-first-examples.md',
  designerHandoff,
  'skills/squad-designer/references/official-sources.md',
  'skills/squad-designer/references/platform-adaptive-layout-and-input.md',
  designerNativeAppleAndroid,
  designerNativeCross,
  designerMotion,
  'skills/squad-designer/references/task-specific-ui-ux-research.md',
];
const frontendIntake = 'skills/squad-frontend/references/designer-gate-and-design-intake.md';
const frontendMotion = 'skills/squad-frontend/references/frontend-stack-and-motion-selection.md';
const mobileGates = 'skills/squad-mobile/references/design-platform-and-lifecycle-gates.md';
const teamPipeline = 'skills/squads-team/references/delivery-pipeline-and-roster.md';
const teamFiles = [teamPipeline, 'skills/squads-team/references/domain-coverage-contracts.md'];
const teamCoordination = 'skills/squads-team/references/coordination-contract.md';
const designerSources = 'skills/squad-designer/references/official-sources.md';
// Sorted, because the pinning assertion sorts each clause's file list.
const roleRuntimes = [
  'skills/squad-backend/references/runtime-capability-fallbacks.md',
  'skills/squad-code-review/references/review-runtime-and-verdict.md',
  'skills/squad-devops/references/runtime-and-safe-delivery-fallbacks.md',
  'skills/squad-fix/references/runtime-capability-fallbacks.md',
  'skills/squad-frontend/references/runtime-capability-fallbacks.md',
  'skills/squad-mobile/references/runtime-capability-fallbacks.md',
  'skills/squad-qa/references/test-strategy-runtime-and-verdict.md',
];

// Role entrypoints, the two ends every HANDOFF-* clause binds.
const backendSkill = 'skills/squad-backend/SKILL.md';
const codeReviewSkill = 'skills/squad-code-review/SKILL.md';
const devopsSkill = 'skills/squad-devops/SKILL.md';
const fixSkill = 'skills/squad-fix/SKILL.md';
const frontendSkill = 'skills/squad-frontend/SKILL.md';
const mobileSkill = 'skills/squad-mobile/SKILL.md';
const qaSkill = 'skills/squad-qa/SKILL.md';
const teamSkill = 'skills/squads-team/SKILL.md';
const buildRoles = [backendSkill, devopsSkill, fixSkill, frontendSkill, mobileSkill];
const preflightRoles = [...buildRoles, codeReviewSkill, qaSkill].sort();

// Fixture aliases: the temp-dir projects reuse two real paths as stand-ins.
const designerFile = designerEntrypoint;
const frontendFile = frontendIntake;

const sharedClause: BoundaryClause = {
  id: 'FIXTURE-BOUNDARY-001',
  statement: 'the designer hands over presentational component code, not a written spec',
  files: [designerFile, frontendFile],
};

const retiredFixture: RetiredPhrase = {
  id: 'FIXTURE-RETIRED-001',
  phrase: 'not production code',
  files: [designerFile],
};

afterEach(async () => {
  await Promise.all(
    temporaryProjects
      .splice(0)
      .map((projectRoot) => rm(projectRoot, { force: true, recursive: true }))
  );
});

describe('validateCrossSkillContract', () => {
  it('accepts a clause stated on every bound file', async () => {
    const projectRoot = await createProject({
      [designerFile]: `# Designer\n\nHere ${sharedClause.statement}.\n`,
      [frontendFile]: `# Intake\n\nHere ${sharedClause.statement}.\n`,
    });

    const result = await validateCrossSkillContract(projectRoot, {
      clauses: [sharedClause],
      retiredPhrases: [],
    });

    expect(result.errors).toEqual([]);
    expect(result.checkedFiles).toEqual([designerFile, frontendFile]);
  });

  it('accepts a clause rewrapped across lines and partly emphasized', async () => {
    const projectRoot = await createProject({
      [designerFile]:
        '# Designer\n\nThe designer hands over **presentational component code**,\nnot a written spec.\n',
      [frontendFile]: `# Intake\n\n${sharedClause.statement}\n`,
    });

    const result = await validateCrossSkillContract(projectRoot, {
      clauses: [sharedClause],
      retiredPhrases: [],
    });

    expect(result.errors).toEqual([]);
  });

  it('fails a single-sided edit and names both the missing and the carrying file', async () => {
    const projectRoot = await createProject({
      [designerFile]: `# Designer\n\n${sharedClause.statement}\n`,
      [frontendFile]: '# Intake\n\nThe designer hands over an implementable contract.\n',
    });

    const result = await validateCrossSkillContract(projectRoot, {
      clauses: [sharedClause],
      retiredPhrases: [],
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain(frontendFile);
    expect(result.errors[0]).toContain(designerFile);
    expect(result.errors[0]).toContain(sharedClause.id);
  });

  it('fails when a divergent clause is reworded on every side at once', async () => {
    const projectRoot = await createProject({
      [designerFile]: '# Designer\n\nThe designer hands over code.\n',
      [frontendFile]: '# Intake\n\nThe designer hands over code.\n',
    });

    const result = await validateCrossSkillContract(projectRoot, {
      clauses: [sharedClause],
      retiredPhrases: [],
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('no other bound file');
  });

  it('reports a bound file that cannot be read', async () => {
    const projectRoot = await createProject({
      [designerFile]: `# Designer\n\n${sharedClause.statement}\n`,
    });

    const result = await validateCrossSkillContract(projectRoot, {
      clauses: [sharedClause],
      retiredPhrases: [],
    });

    expect(result.errors.some((error) => error.includes('could not be read'))).toBe(true);
  });

  it('rejects a clause that binds fewer than two files', async () => {
    const projectRoot = await createProject({
      [designerFile]: `# Designer\n\n${sharedClause.statement}\n`,
    });

    const result = await validateCrossSkillContract(projectRoot, {
      clauses: [{ ...sharedClause, files: [designerFile] }],
      retiredPhrases: [],
    });

    expect(result.errors).toEqual([
      'FIXTURE-BOUNDARY-001: a boundary clause must bind at least two files.',
    ]);
  });

  it('fails when retired spec-era wording survives', async () => {
    const projectRoot = await createProject({
      [designerFile]: '# Designer\n\nProduce **specs, not production code**.\n',
    });

    const result = await validateCrossSkillContract(projectRoot, {
      clauses: [],
      retiredPhrases: [retiredFixture],
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('retired');
  });

  it('holds the shipped skills to the current role boundary', async () => {
    const result = await validateCrossSkillContract(process.cwd());

    expect(result.errors).toEqual([]);
    expect(result.checkedFiles.length).toBeGreaterThan(0);
  });

  it('reports a retired-phrase file that cannot be read', async () => {
    const projectRoot = await createProject({});

    const result = await validateCrossSkillContract(projectRoot, {
      clauses: [],
      retiredPhrases: [retiredFixture],
    });

    expect(result.errors).toEqual([`FIXTURE-RETIRED-001: ${designerFile} could not be read.`]);
  });

  // A clause only binds the files that name the boundary. A designer reference
  // no clause names can still tell the designer to hand over a document, so the
  // retired-phrase sweep has to cover the whole skill, including files added later.
  it('sweeps every shipped designer file for retired wording', async () => {
    const references = await readdir(path.join(process.cwd(), 'skills/squad-designer/references'));
    const designerFiles = [
      designerEntrypoint,
      ...references
        .filter((file) => file.endsWith('.md'))
        .map((file) => `skills/squad-designer/references/${file}`),
    ];
    const swept = new Set(retiredPhrases.flatMap((phrase) => phrase.files));

    expect(designerFiles.filter((file) => !swept.has(file))).toEqual([]);
  });

  // Pins the whole inventory. Asserting only "no errors" lets a bound path be
  // dropped from a clause without any test noticing: the remaining files still
  // agree, so the gate stays green while its coverage silently shrinks.
  it('pins every shipped clause and retired phrase to its exact file set', () => {
    const inventory = Object.fromEntries(
      [...boundaryClauses, ...retiredPhrases].map((entry) => [entry.id, [...entry.files].sort()])
    );

    expect(inventory).toEqual({
      'BOUNDARY-ARTIFACT-001': [designerEntrypoint, frontendIntake, mobileGates, ...teamFiles],
      'BOUNDARY-LOGIC-001': [designerEntrypoint, frontendIntake, mobileGates, ...teamFiles],
      'BOUNDARY-MOTION-001': [
        designerNativeAppleAndroid,
        designerNativeCross,
        designerMotion,
        frontendMotion,
        mobileGates,
      ],
      'PAIRING-DETECT-001': [designerSources, ...roleRuntimes, teamCoordination].sort(),
      'PAIRING-AUTHORITY-001': [designerSources, ...roleRuntimes].sort(),
      'PAIRING-SAFETY-001': roleRuntimes,
      'HANDOFF-API-001': [backendSkill, frontendSkill, mobileSkill],
      'HANDOFF-QA-001': [...buildRoles, qaSkill].sort(),
      'HANDOFF-VERDICT-001': [codeReviewSkill, qaSkill],
      'HANDOFF-FINDINGS-001': [codeReviewSkill, fixSkill],
      'HANDOFF-DEPLOY-001': [codeReviewSkill, devopsSkill],
      'HANDOFF-GATE-001': [...buildRoles, teamSkill].sort(),
      'HANDOFF-SOLO-001': [...buildRoles, codeReviewSkill, qaSkill, teamSkill].sort(),
      'QUALITY-PREFLIGHT-001': preflightRoles,
      'RETIRED-SPEC-001': [designerEntrypoint, ...designerReferences, ...teamFiles],
      'RETIRED-SPEC-002': [designerEntrypoint, designerHandoff, teamPipeline],
      'RETIRED-SPEC-003': designerReferences,
      'RETIRED-SPEC-004': [designerEntrypoint, ...designerReferences],
      'RETIRED-SPEC-005': [designerEntrypoint, ...designerReferences, ...teamFiles],
    });
  });

  it('binds each shipped clause to at least two files and keeps ids unique', () => {
    const ids = [...boundaryClauses, ...retiredPhrases].map((entry) => entry.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(boundaryClauses.every((clause) => clause.files.length >= 2)).toBe(true);
  });
});

/**
 * The HANDOFF-* family binds the two ends of a stage boundary — what a role
 * hands over and what the next role is told to expect — so both sides are
 * entrypoints a reader reaches without loading a reference.
 *
 * squad-designer is absent from the family on purpose. Its SKILL.md is
 * eval-covered, so an edit there runs the evaluation cycle rather than this
 * gate, and its side of the design handoff is already bound by BOUNDARY-*.
 */
describe('handoff contract family', () => {
  const handoffClauses = boundaryClauses.filter((clause) => clause.id.startsWith('HANDOFF-'));

  it('binds every handoff clause to role entrypoints on both sides', () => {
    expect(handoffClauses.length).toBeGreaterThan(0);

    for (const clause of handoffClauses) {
      expect(clause.files.length).toBeGreaterThanOrEqual(2);
      expect(clause.files.every((file) => file.endsWith('/SKILL.md'))).toBe(true);
    }
  });

  it('keeps the eval-covered designer entrypoint out of the family', () => {
    expect(handoffClauses.some((clause) => clause.files.includes(designerEntrypoint))).toBe(false);
  });

  // The solo clause is the one every non-designer role carries, so it is the
  // one a propagation pass is most likely to leave half-applied.
  it('states the solo fallback on all eight non-designer entrypoints', async () => {
    const solo = boundaryClauses.find((clause) => clause.id === 'HANDOFF-SOLO-001');

    expect(solo?.files.sort()).toEqual([...buildRoles, codeReviewSkill, qaSkill, teamSkill].sort());

    const result = await validateCrossSkillContract(process.cwd(), {
      clauses: solo ? [solo] : [],
      retiredPhrases: [],
    });

    expect(result.errors).toEqual([]);
  });

  it('fails when one side of a handoff drops the bound shape', async () => {
    const api = boundaryClauses.find((clause) => clause.id === 'HANDOFF-API-001');
    if (!api) throw new Error('HANDOFF-API-001 is missing from the shipped clauses.');

    const projectRoot = await createProject({
      [backendSkill]: `# Backend\n\nTo Frontend and Mobile, ${api.statement}.\n`,
      [frontendSkill]: '# Frontend\n\nFrom Backend, whatever the endpoint list happens to say.\n',
      [mobileSkill]: `# Mobile\n\nFrom Backend, ${api.statement}.\n`,
    });

    const result = await validateCrossSkillContract(projectRoot, {
      clauses: [api],
      retiredPhrases: [],
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain(frontendSkill);
    expect(result.errors[0]).toContain(backendSkill);
  });

  // Carried in from the quality-bar phase: seven roles were given this line
  // word for word with nothing holding them to it.
  it('binds the quality-bar pre-flight line to every role that runs one', async () => {
    const preflight = boundaryClauses.find((clause) => clause.id === 'QUALITY-PREFLIGHT-001');

    expect(preflight?.files.sort()).toEqual(preflightRoles);

    const result = await validateCrossSkillContract(process.cwd(), {
      clauses: preflight ? [preflight] : [],
      retiredPhrases: [],
    });

    expect(result.errors).toEqual([]);
  });
});

describe('normalizeProse', () => {
  it('collapses wrapping, emphasis, and smart quotes', () => {
    expect(normalizeProse('The  *designer’s*\n`code`  handoff')).toBe(
      "the designer's code handoff"
    );
  });

  // The three holes the Phase 3 review named in this matcher.
  it('removes fenced blocks so a clause stated only in a code sample does not count', () => {
    expect(normalizeProse('before\n\n```text\nthe shared boundary clause\n```\n\nafter')).toBe(
      'before after'
    );
  });

  it('removes HTML comments so a hidden clause does not count', () => {
    expect(normalizeProse('before <!-- the shared boundary clause --> after')).toBe('before after');
  });

  it('collapses a Markdown link to its label so a linked clause still matches', () => {
    expect(normalizeProse('state stays with [squad-frontend](../squad-frontend/SKILL.md)')).toBe(
      'state stays with squad-frontend'
    );
  });
});

describe('retired-phrase detection', () => {
  const retired: RetiredPhrase[] = [
    { files: ['a.md'], id: 'RETIRED-FIXTURE', phrase: 'AgentKit is optional' },
  ];

  const check = async (contents: string) =>
    validateCrossSkillContract(await createProject({ 'a.md': contents }), {
      clauses: [],
      retiredPhrases: retired,
    });

  it('fails when the retired wording is stated as the live rule', async () => {
    expect((await check('AgentKit is optional for this role.')).errors).toHaveLength(1);
  });

  it('passes wording that no longer contains the retired phrase', async () => {
    // "is no longer optional" does not contain "is optional"; the phrase is
    // gone, so nothing is being suppressed here.
    expect((await check('AgentKit is no longer optional for this role.')).errors).toEqual([]);
  });

  it.each([
    ['a trailing retirement note', 'The stance that AgentKit is optional was retired.'],
    ['an ordinary sentence containing "cannot"', 'A run cannot start while AgentKit is optional.'],
    ['a nearby negation', 'This is not a suggestion. AgentKit is optional only in theory.'],
  ])('still fails on %s without an explicit opt-out', async (_label, contents) => {
    // Nearby English is not consent. Inferring it from a marker list silenced
    // the gate on ordinary prose, which is the failure direction that matters:
    // a drift detector that quietly stops detecting is worse than a noisy one.
    expect((await check(contents)).errors).toHaveLength(1);
  });

  it('names the opt-out in the failure so the fix is discoverable', async () => {
    const result = await check('AgentKit is optional for this role.');

    expect(result.errors[0]).toContain('retired-phrase-ok: RETIRED-FIXTURE');
  });

  it('passes a file that opts out explicitly', async () => {
    const contents = [
      '<!-- retired-phrase-ok: RETIRED-FIXTURE -->',
      '',
      'The retired wording was "AgentKit is optional"; pairing is now detected per task.',
    ].join('\n');

    expect((await check(contents)).errors).toEqual([]);
  });

  it("does not let one file's opt-out cover another", async () => {
    const projectRoot = await createProject({
      'a.md': 'AgentKit is optional here.',
      'b.md': '<!-- retired-phrase-ok: RETIRED-FIXTURE -->',
    });

    const result = await validateCrossSkillContract(projectRoot, {
      clauses: [],
      retiredPhrases: [
        { files: ['a.md', 'b.md'], id: 'RETIRED-FIXTURE', phrase: 'AgentKit is optional' },
      ],
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('a.md');
  });

  it('reads retired wording inside a fenced block, which a clause check would skip', async () => {
    // A fenced handoff template is shipped instruction text, not an
    // illustrative sample, so the two checks normalize differently.
    const contents = ['Use this template:', '', '```md', 'AgentKit is optional', '```'].join('\n');

    expect((await check(contents)).errors).toHaveLength(1);
  });
});

async function createProject(files: Record<string, string>): Promise<string> {
  const projectRoot = await mkdtemp(path.join(tmpdir(), 'cross-skill-contract-'));
  temporaryProjects.push(projectRoot);

  for (const [file, contents] of Object.entries(files)) {
    const target = path.join(projectRoot, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents, 'utf8');
  }

  return projectRoot;
}
