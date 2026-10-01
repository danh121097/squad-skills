import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { boundaryClauses } from '../../src/catalog/cross-skill-contract-clauses.ts';
import {
  normalizeProse,
  validateCrossSkillContract,
  type BoundaryClause,
} from '../../src/catalog/cross-skill-contract-validator.ts';

const temporaryProjects: string[] = [];

const designerEntrypoint = 'skills/squad-designer/SKILL.md';
const frontendIntake = 'skills/squad-frontend/references/designer-gate-and-design-intake.md';

// Role entrypoints, the two ends every HANDOFF-* clause binds.
const backendSkill = 'skills/squad-backend/SKILL.md';
const codeReviewSkill = 'skills/squad-code-review/SKILL.md';
const devopsSkill = 'skills/squad-devops/SKILL.md';
const fixSkill = 'skills/squad-fix/SKILL.md';
const frontendSkill = 'skills/squad-frontend/SKILL.md';
const mobileSkill = 'skills/squad-mobile/SKILL.md';
const productSkill = 'skills/squad-product/SKILL.md';
const productPlanDocument = 'skills/squad-product/references/plan-document-contract.md';
const teamContracts = 'skills/squads-team/references/domain-coverage-contracts.md';
const productQuality = 'skills/squad-product/references/quality-bar-and-preflight.md';
const qaSkill = 'skills/squad-qa/SKILL.md';
const teamSkill = 'skills/squads-team/SKILL.md';
const rolesWithAnImplementationSlice = [
  backendSkill,
  devopsSkill,
  fixSkill,
  frontendSkill,
  mobileSkill,
];
const preflightRoles = [
  ...rolesWithAnImplementationSlice,
  codeReviewSkill,
  productSkill,
  qaSkill,
].sort();

// Fixture aliases: the temp-dir projects reuse two real paths as stand-ins.
const designerFile = designerEntrypoint;
const frontendFile = frontendIntake;

const sharedClause: BoundaryClause = {
  id: 'FIXTURE-BOUNDARY-001',
  statement: 'the designer hands over presentational component code, not a written spec',
  files: [designerFile, frontendFile],
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
    });

    expect(result.errors.some((error) => error.includes('could not be read'))).toBe(true);
  });

  it('rejects a clause that binds fewer than two files', async () => {
    const projectRoot = await createProject({
      [designerFile]: `# Designer\n\n${sharedClause.statement}\n`,
    });

    const result = await validateCrossSkillContract(projectRoot, {
      clauses: [{ ...sharedClause, files: [designerFile] }],
    });

    expect(result.errors).toEqual([
      'FIXTURE-BOUNDARY-001: a boundary clause must bind at least two files.',
    ]);
  });

  it('holds the shipped skills to the current role boundary', async () => {
    const result = await validateCrossSkillContract(process.cwd());

    expect(result.errors).toEqual([]);
    expect(result.checkedFiles.length).toBeGreaterThan(0);
  });

  it('binds each shipped clause to at least two files and keeps ids unique', () => {
    const ids = boundaryClauses.map((entry) => entry.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(boundaryClauses.every((clause) => clause.files.length >= 2)).toBe(true);
  });
});

/**
 * The HANDOFF-* family binds the two ends of a stage boundary — what crosses one
 * and what closes one — so both sides are entrypoints a reader reaches without
 * loading a reference. The GATE-* and SOLO-* members carry no artifact across a
 * boundary: they bind who owns a stage and what verdict ends it, which is the
 * same contract seen from the pipeline rather than from the handover.
 *
 * squad-designer is absent from the family on purpose: its side of the design
 * handoff is already bound by BOUNDARY-*, and a boundary with two owners in two
 * clause families is a boundary they can disagree about. HANDOFF-DECISION-001 is
 * the one member that reaches it anyway, and the exception is narrow enough to
 * state: it binds who may answer a question the user owns, not who owns an
 * artifact, so there is no second owner for BOUNDARY-* to disagree with.
 */
/**
 * The PLAN-DOCUMENT-* family is the inverse of HANDOFF-*: its wording lives in
 * references, because the plan's shape is progressively disclosed and a run
 * reaches it by routing there. What keeps it from drifting into a second shape
 * is that every member is bound on the plan contract itself — the one file that
 * owns what a written plan holds. A clause the plan contract does not state is
 * a rule some other file invented.
 */
describe('plan document contract family', () => {
  const planClauses = boundaryClauses.filter((clause) => clause.id.startsWith('PLAN-DOCUMENT-'));

  it('binds every plan-document clause on the plan contract that owns the shape', () => {
    expect(planClauses.length).toBeGreaterThan(0);

    for (const clause of planClauses) {
      expect(clause.files).toContain(productPlanDocument);
      expect(clause.files.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('handoff contract family', () => {
  const handoffClauses = boundaryClauses.filter((clause) => clause.id.startsWith('HANDOFF-'));

  it('binds every handoff clause to role entrypoints on both sides', () => {
    expect(handoffClauses.length).toBeGreaterThan(0);

    for (const clause of handoffClauses) {
      expect(clause.files.length).toBeGreaterThanOrEqual(2);
      expect(clause.files.every((file) => file.endsWith('/SKILL.md'))).toBe(true);
    }
  });

  it('keeps the designer entrypoint out of every artifact-carrying handoff clause', () => {
    const artifactClauses = handoffClauses.filter((clause) => clause.id !== 'HANDOFF-DECISION-001');

    expect(artifactClauses.some((clause) => clause.files.includes(designerEntrypoint))).toBe(false);
  });

  // Pinned as its own case rather than folded into the one above, so that
  // widening the exception to a second clause has to be argued in a diff instead
  // of arriving as a filter that quietly grew.
  it('lets only the decision clause reach the designer, and only at every entrypoint', () => {
    const decision = handoffClauses.find((clause) => clause.id === 'HANDOFF-DECISION-001');
    if (!decision) throw new Error('HANDOFF-DECISION-001 is missing from the shipped clauses.');

    expect(decision.files).toContain(designerEntrypoint);
    expect(decision.files).toHaveLength(10);
  });

  // The solo clause is the one every non-designer role carries, so it is the
  // one a propagation pass is most likely to leave half-applied.
  it('states the solo fallback on all eight non-designer entrypoints', async () => {
    const solo = boundaryClauses.find((clause) => clause.id === 'HANDOFF-SOLO-001');
    if (!solo) throw new Error('HANDOFF-SOLO-001 is missing from the shipped clauses.');

    // Sort a copy. `solo.files` is the shipped array itself, and sorting it in
    // place would reorder module state every later test reads.
    expect([...solo.files].sort()).toEqual(
      [...rolesWithAnImplementationSlice, codeReviewSkill, qaSkill, teamSkill].sort()
    );

    const result = await validateCrossSkillContract(process.cwd(), {
      clauses: [solo],
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
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain(frontendSkill);
    expect(result.errors[0]).toContain(backendSkill);
  });

  // The gate sequence was unbound until the handoff-artifact decision looked for
  // what protected it and found nothing did. TIER-001 binds which tiers run both
  // gates; this binds who issues the pass, which verdict closes each gate,
  // and in what order.
  //
  // The shipped set is already validated against the working tree above, so
  // these cases pin the two drifts the clause exists to stop: a reorder, and the
  // deletion of the hard gate that states the rule. The deletion case reads the
  // real `squads-team` entrypoint rather than a fixture, because what makes it
  // pass is a property of that file — the completion-checklist line repeats the
  // gates in different words and must not rescue a deleted hard gate 4.
  it('fails when the lead deletes the hard gate that states the sequence', async () => {
    const sequence = boundaryClauses.find((clause) => clause.id === 'HANDOFF-GATE-003');
    if (!sequence) throw new Error('HANDOFF-GATE-003 is missing from the shipped clauses.');

    expect([...sequence.files].sort()).toEqual([fixSkill, teamSkill]);

    const team = await readFile(path.join(process.cwd(), teamSkill), 'utf8');
    const withoutHardGate = team.replace(
      /^4\. \*\*No done without gates\*\*[\s\S]*?(?=^5\. )/m,
      ''
    );

    // The strip has to have removed something, or the case would pass for the
    // wrong reason on any future renumbering of the hard gates.
    expect(withoutHardGate).not.toEqual(team);
    expect(normalizeProse(withoutHardGate)).toContain('qa pass and code review approve');

    const projectRoot = await createProject({
      [teamSkill]: withoutHardGate,
      [fixSkill]: await readFile(path.join(process.cwd(), fixSkill), 'utf8'),
    });

    const result = await validateCrossSkillContract(projectRoot, {
      clauses: [sequence],
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain(teamSkill);
  });

  it('fails when one side reorders the mandatory gates', async () => {
    const sequence = boundaryClauses.find((clause) => clause.id === 'HANDOFF-GATE-003');
    if (!sequence) throw new Error('HANDOFF-GATE-003 is missing from the shipped clauses.');

    const projectRoot = await createProject({
      [teamSkill]: `# Team\n\nEvery slice must receive QA ${sequence.statement}.\n`,
      [fixSkill]: '# Fix\n\nEvery fix slice must receive Code Review `APPROVE` and QA `PASS`.\n',
    });

    const result = await validateCrossSkillContract(projectRoot, {
      clauses: [sequence],
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain(fixSkill);
    expect(result.errors[0]).toContain(teamSkill);
  });

  it('fails when a gate drops the behavioral-versus-implementation boundary', async () => {
    const boundary = boundaryClauses.find((clause) => clause.id === 'HANDOFF-GATE-004');
    if (!boundary) throw new Error('HANDOFF-GATE-004 is missing from the shipped clauses.');

    const projectRoot = await createProject({
      [teamSkill]: `# Team\n\n${boundary.statement}.\n`,
      [qaSkill]: `# QA\n\n${boundary.statement}.\n`,
      [codeReviewSkill]: '# Review\n\nReview everything again from scratch.\n',
    });

    const result = await validateCrossSkillContract(projectRoot, {
      clauses: [boundary],
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain(codeReviewSkill);
  });

  it('fails when one gate restarts the whole pipeline instead of preserving delta-sized reruns', async () => {
    const rerun = boundaryClauses.find((clause) => clause.id === 'HANDOFF-RERUN-001');
    if (!rerun) throw new Error('HANDOFF-RERUN-001 is missing from the shipped clauses.');

    const projectRoot = await createProject({
      [teamSkill]: `# Team\n\n${rerun.statement}.\n`,
      [qaSkill]: '# QA\n\nAfter code changes, discard every result and restart all checks.\n',
      [codeReviewSkill]: `# Review\n\n${rerun.statement}.\n`,
    });

    const result = await validateCrossSkillContract(projectRoot, {
      clauses: [rerun],
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain(qaSkill);
  });

  // Seven roles were given this line word for word with nothing holding them
  // to it until the clause existed; squad-product made eight by copying the
  // bound sentence rather than writing its own.
  it('binds the quality-bar pre-flight line to every role that runs one', async () => {
    const preflight = boundaryClauses.find((clause) => clause.id === 'QUALITY-PREFLIGHT-001');
    if (!preflight) throw new Error('QUALITY-PREFLIGHT-001 is missing from the shipped clauses.');

    expect([...preflight.files].sort()).toEqual(preflightRoles);

    const result = await validateCrossSkillContract(process.cwd(), {
      clauses: [preflight],
    });

    expect(result.errors).toEqual([]);
  });

  it('binds the written plan shape to the plan contract, its quality bar and the lead fallback', async () => {
    const planLayout = boundaryClauses.find((clause) => clause.id === 'PLAN-DOCUMENT-LAYOUT-001');
    if (!planLayout) throw new Error('PLAN-DOCUMENT-LAYOUT-001 is missing from shipped clauses.');

    expect([...planLayout.files].sort()).toEqual(
      [productPlanDocument, productQuality, teamContracts].sort()
    );

    const result = await validateCrossSkillContract(process.cwd(), {
      clauses: [planLayout],
    });

    expect(result.errors).toEqual([]);
  });

  it('binds the core phase sections to the plan contract and its quality bar', async () => {
    const planDetail = boundaryClauses.find((clause) => clause.id === 'QUALITY-PREFLIGHT-PLAN-001');
    if (!planDetail) throw new Error('QUALITY-PREFLIGHT-PLAN-001 is missing from shipped clauses.');

    expect([...planDetail.files].sort()).toEqual([productPlanDocument, productQuality].sort());

    const result = await validateCrossSkillContract(process.cwd(), {
      clauses: [planDetail],
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

  // The three holes a review of this matcher named.
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
