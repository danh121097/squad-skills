import { describe, expect, it } from 'vitest';

import {
  buildJudgingReport,
  renderJudgingReport,
  verifyJudgingReportHash,
  type JudgingReportInput,
} from '../../src/eval/judging-report.ts';
import {
  unknownUsage,
  type JudgeOrderResult,
  type PairwiseOutcome,
} from '../../src/eval/pairwise-judge.ts';

/**
 * What the report has to refuse to round off: a skipped case counted as a judge
 * call, an undecided pair reported as the worst result, and a number a
 * maintainer could have typed in by hand.
 */
const order = (costUsd: number | null = 0.5): JudgeOrderResult => ({
  criteria: [],
  detail: null,
  order: 'ab',
  usage: { ...unknownUsage, costUsd, inputTokens: 100, totalTokens: 120 },
  winner: null,
});

const outcome = (
  caseId: string,
  verdict: PairwiseOutcome['verdict'],
  overrides: Partial<PairwiseOutcome> = {}
): PairwiseOutcome => ({
  caseId,
  detail: '',
  orders: [order(), order()],
  reason: 'judged',
  verdict,
  ...overrides,
});

const input = (overrides: Partial<JudgingReportInput> = {}): JudgingReportInput => ({
  calibration: null,
  cycleId: 'designer-2026-08-27',
  evidence: {
    candidateArtifacts: [
      { artifactHash: 'sha256:a', caseId: 'a', runDirectory: '.eval-runs/a.candidate' },
      { artifactHash: 'sha256:b', caseId: 'b', runDirectory: '.eval-runs/b.candidate' },
    ],
    caseManifestHash: 'sha256:manifest',
    deterministicReportHash: 'sha256:deterministic',
    payloadHash: 'sha256:payload',
  },
  lane: 'acceptance',
  lengthControl: null,
  models: { authoringAssistance: 'maintainer', judge: 'judge-model', subject: 'subject-model' },
  outcomes: [outcome('a', 'candidate'), outcome('b', 'baseline')],
  regressions: [],
  seed: 1,
  skill: 'example-skill',
  ...overrides,
});

describe('buildJudgingReport', () => {
  it('counts the calls it made, not the cases it was given', () => {
    const report = buildJudgingReport(
      input({
        outcomes: [
          outcome('a', 'candidate'),
          outcome('b', 'inconclusive', { orders: [], reason: 'gates-blocked' }),
        ],
      })
    );

    expect(report.tally.total).toBe(2);
    expect(report.judgeCalls).toBe(2);
  });

  it('pays for the length control out of the same budget', () => {
    const report = buildJudgingReport(input({ lengthControl: outcome('length-control', 'tie') }));

    expect(report.judgeCalls).toBe(6);
    expect(report.usage.costUsd).toBe(3);
    expect(report.lengthControl.biased).toBe(false);
  });

  it('reports an unrun control as unmeasured bias', () => {
    expect(buildJudgingReport(input()).lengthControl.biased).toBe(true);
  });

  it('names the worst decided case, never an undecided one', () => {
    const report = buildJudgingReport(
      input({ outcomes: [outcome('a', 'candidate'), outcome('b', 'inconclusive')] })
    );

    expect(report.worstCase).toEqual({ caseId: 'a', verdict: 'candidate' });
  });

  it('has no worst case when nothing was decided', () => {
    expect(
      buildJudgingReport(input({ outcomes: [outcome('a', 'inconclusive')] })).worstCase
    ).toBeNull();
  });

  it('orders cases by id so two runs of the same evidence hash alike', () => {
    const forward = buildJudgingReport(input());
    const reversed = buildJudgingReport(
      input({ outcomes: [outcome('b', 'baseline'), outcome('a', 'candidate')] })
    );

    expect(reversed.reportHash).toBe(forward.reportHash);
  });

  it('binds the report hash to deterministic evidence and candidate artifacts', () => {
    const report = buildJudgingReport(input());

    expect(report.evidence.deterministicReportHash).toBe('sha256:deterministic');
    expect(
      verifyJudgingReportHash({
        ...report,
        evidence: { ...report.evidence, payloadHash: 'sha256:other' },
      })
    ).toBe(false);
  });

  it('keeps an unreported cost unknown across the whole run', () => {
    const report = buildJudgingReport(
      input({ outcomes: [outcome('a', 'candidate', { orders: [order(null), order()] })] })
    );

    expect(report.usage.costUsd).toBeNull();
    expect(report.usage.unknownCost).toBe(1);
  });
});

describe('verifyJudgingReportHash', () => {
  it('accepts the report it was built from', () => {
    expect(verifyJudgingReportHash(buildJudgingReport(input()))).toBe(true);
  });

  it('refuses a verdict edited after the run', () => {
    const report = buildJudgingReport(input());
    const edited = {
      ...report,
      outcomes: report.outcomes.map((entry) => ({ ...entry, verdict: 'candidate' as const })),
    };

    expect(verifyJudgingReportHash(edited)).toBe(false);
  });

  it('refuses a hand-written cost', () => {
    const report = buildJudgingReport(input());

    expect(verifyJudgingReportHash({ ...report, usage: { ...report.usage, costUsd: 0 } })).toBe(
      false
    );
  });
});

describe('renderJudgingReport', () => {
  it('prints an unknown cost as unknown rather than as zero', () => {
    const rendered = renderJudgingReport(
      buildJudgingReport(
        input({ outcomes: [outcome('a', 'candidate', { orders: [order(null)] })] })
      )
    );

    expect(rendered).toContain('cost: unknown');
    expect(rendered).toContain('1 call(s) reported no cost');
  });

  it('keeps a pipe in a detail from breaking the ledger table', () => {
    const rendered = renderJudgingReport(
      buildJudgingReport(input({ outcomes: [outcome('a', 'tie', { detail: 'a | b\nnext' })] }))
    );

    expect(rendered).toContain('a \\| b next');
  });

  it('states the determinism it cannot claim', () => {
    expect(renderJudgingReport(buildJudgingReport(input()))).toContain('not guaranteed');
  });
});
