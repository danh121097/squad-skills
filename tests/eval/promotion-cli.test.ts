import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { hashCandidateArtifact } from '../../src/eval/candidate-artifact-hash.ts';
import { buildEvalRunReport } from '../../src/eval/eval-run-report.ts';
import { gateResult } from '../../src/eval/gate-result.ts';
import { buildJudgingReport } from '../../src/eval/judging-report.ts';
import { unknownUsage } from '../../src/eval/pairwise-judge.ts';
import { hashContent, measureSkillPayload } from '../../src/eval/skill-payload-measurement.ts';

const repositoryRoot = process.cwd();
const promoter = path.join(repositoryRoot, 'scripts', 'promote-squad-designer-candidate.ts');
const temporaryProjects: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryProjects.splice(0).map((directory) => rm(directory, { force: true, recursive: true }))
  );
});

describe('promote-squad-designer-candidate', () => {
  it('approves a current complete evidence pair, then refuses it after payload drift', async () => {
    const project = await fixture();

    expect(run(project).status).toBe(0);

    await writeFile(
      path.join(project, 'skills', 'squad-designer', 'SKILL.md'),
      skill('Entirely different candidate under the same version.')
    );
    const stale = run(project);

    expect(stale.status).toBe(1);
    expect(stale.stdout).toContain('current candidate payload');
  });

  it('refuses when the claimed candidate artifact was removed after judging', async () => {
    const project = await fixture();
    const candidateRoot = path.join(project, '.eval-runs', 'promotion-cycle', 'acc-001.candidate');

    await rm(candidateRoot, { force: true, recursive: true });
    const result = run(project);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('candidate artifact for "acc-001" is missing');
    expect(result.stdout).toContain('.eval-runs/promotion-cycle/acc-001.candidate');
  });
});

async function fixture(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'promotion-cli-'));
  temporaryProjects.push(root);
  const evalRoot = path.join(root, 'evals', 'squad-designer');
  const skillRoot = path.join(root, 'skills', 'squad-designer');
  const runRoot = path.join(root, '.eval-runs', 'promotion-cycle', 'acceptance');
  await Promise.all([
    mkdir(evalRoot, { recursive: true }),
    mkdir(skillRoot, { recursive: true }),
    mkdir(runRoot, { recursive: true }),
  ]);
  await writeFile(path.join(skillRoot, 'SKILL.md'), skill('Reviewed candidate.'));
  const caseSource = [
    'cycle_id: promotion-cycle',
    'cases:',
    '  - {id: acc-001, lane: acceptance}',
    '',
  ].join('\n');
  await writeFile(path.join(evalRoot, 'case-manifest.yml'), caseSource);
  await writeFile(
    path.join(evalRoot, 'baseline-manifest.yml'),
    [
      'skills:',
      '  squad-designer: {version: 2.0.0}',
      'judging:',
      '  promotion_lane: acceptance',
      '  thresholds:',
      '    registered: true',
      '    minimum_judge_human_agreement: 0.7',
      '    minimum_calibration_pairs: 6',
      '    equivalence_boundary: 0',
      '',
    ].join('\n')
  );

  const payload = await measureSkillPayload({ skillRoot });
  const candidateDirectory = '.eval-runs/promotion-cycle/acc-001.candidate';
  const baselineDirectory = '.eval-runs/promotion-cycle/acc-001.baseline';
  const candidateRoot = path.join(root, candidateDirectory);
  const baselineRoot = path.join(root, baselineDirectory);
  await Promise.all([
    mkdir(candidateRoot, { recursive: true }),
    mkdir(baselineRoot, { recursive: true }),
  ]);
  await Promise.all([
    writeFile(path.join(candidateRoot, 'component.ts'), 'export const candidate = true;\n'),
    writeFile(path.join(baselineRoot, 'component.ts'), 'export const baseline = true;\n'),
  ]);
  const [candidateArtifactHash, baselineArtifactHash] = await Promise.all([
    hashCandidateArtifact(candidateRoot),
    hashCandidateArtifact(baselineRoot),
  ]);
  const report = buildEvalRunReport(
    {
      caseManifestHash: hashContent(caseSource),
      cycleId: 'promotion-cycle',
      nodeVersion: process.versions.node,
      payloadHash: payload.payloadHash,
      renderer: 'fixture',
    },
    ['baseline', 'candidate'].map((arm) => ({
      arm: arm as 'baseline' | 'candidate',
      artifactHash: arm === 'candidate' ? candidateArtifactHash : baselineArtifactHash,
      caseId: 'acc-001',
      category: 'fixture',
      lane: 'acceptance',
      results: [gateResult('INV-BUILD-001', 'critical', 'render-gated', 'pass', 'passed')],
      runDirectory: arm === 'candidate' ? candidateDirectory : baselineDirectory,
      targetPlatform: 'web',
    }))
  );
  const order = {
    criteria: [],
    detail: null,
    order: 'ab' as const,
    usage: { ...unknownUsage, costUsd: 0 },
    winner: 'candidate' as const,
  };
  const judgedOutcome = {
    caseId: 'acc-001',
    detail: 'candidate wins in both orders',
    orders: [order, { ...order, order: 'ba' as const, winner: 'candidate' as const }],
    reason: 'judged' as const,
    verdict: 'candidate' as const,
  };
  const judging = buildJudgingReport({
    calibration: { agreement: 1, compared: 6, kappa: null, skipped: 0 },
    cycleId: 'promotion-cycle',
    evidence: {
      candidateArtifacts: [
        {
          artifactHash: candidateArtifactHash,
          caseId: 'acc-001',
          runDirectory: candidateDirectory,
        },
      ],
      caseManifestHash: report.environment.caseManifestHash,
      deterministicReportHash: report.reportHash,
      payloadHash: report.environment.payloadHash,
    },
    lane: 'acceptance',
    lengthControl: { ...judgedOutcome, caseId: 'length-control', verdict: 'tie' },
    models: { authoringAssistance: 'fixture', judge: 'anthropic/test', subject: 'codex/test' },
    outcomes: [judgedOutcome],
    regressions: [],
    seed: 1,
    skill: 'squad-designer',
  });
  await writeFile(path.join(runRoot, 'report.json'), JSON.stringify(report));
  await writeFile(path.join(runRoot, 'judging.json'), JSON.stringify(judging));
  await writeFile(
    path.join(runRoot, 'promotion-approval.yml'),
    [
      'reviewer: Fixture Reviewer',
      'reviewed_on: 2026-09-05',
      'cycle_id: promotion-cycle',
      'candidate_version: 3.0.0',
      `judging_report_hash: ${judging.reportHash}`,
      'checklist:',
      '  diff_reviewed: true',
      '  transcripts_reviewed: true',
      '  source_provenance_reviewed: true',
      '  screenshots_reviewed: true',
      '',
    ].join('\n')
  );
  return root;
}

function skill(body: string): string {
  return `---\nname: squad-designer\ndescription: Fixture\nmetadata:\n  version: 3.0.0\n---\n\n${body}\n`;
}

function run(project: string) {
  return spawnSync(process.execPath, [promoter], {
    cwd: project,
    encoding: 'utf8',
    timeout: 10_000,
  });
}
