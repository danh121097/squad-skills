import { describe, expect, it } from 'vitest';

import {
  bootstrapMeanInterval,
  buildRegressionLedger,
  judgeHumanAgreement,
  sampleVariance,
  scoreOutcomes,
  summarizeUsage,
  tallyOutcomes,
} from '../../src/eval/eval-statistics.ts';
import { unknownUsage, type PairwiseOutcome } from '../../src/eval/pairwise-judge.ts';

/**
 * Statistics fixed against hand-checkable inputs.
 *
 * Two behaviors carry the phase's rules and are asserted at their boundary: an
 * inconclusive pair is never scored as a tie, and an unreported cost never sums
 * to zero.
 */
const outcome = (caseId: string, verdict: PairwiseOutcome['verdict']): PairwiseOutcome => ({
  caseId,
  detail: '',
  orders: [],
  reason: 'judged',
  verdict,
});

describe('tallyOutcomes and scoreOutcomes', () => {
  it('counts every verdict and scores only the decided ones', () => {
    const outcomes = [
      outcome('a', 'candidate'),
      outcome('b', 'baseline'),
      outcome('c', 'tie'),
      outcome('d', 'inconclusive'),
    ];

    expect(tallyOutcomes(outcomes)).toEqual({
      inconclusive: 1,
      losses: 1,
      ties: 1,
      total: 4,
      wins: 1,
    });
    expect(scoreOutcomes(outcomes)).toEqual([1, -1, 0]);
  });

  it('does not let an order-unstable pair read as evidence of parity', () => {
    expect(scoreOutcomes([outcome('a', 'inconclusive')])).toEqual([]);
    expect(scoreOutcomes([outcome('a', 'tie')])).toEqual([0]);
  });
});

describe('bootstrapMeanInterval', () => {
  it('reproduces exactly for the same samples and seed', () => {
    const samples = [1, 1, 0, -1, 1, 0];

    expect(bootstrapMeanInterval(samples, { seed: 7 })).toEqual(
      bootstrapMeanInterval(samples, { seed: 7 })
    );
  });

  it('collapses to the value itself when every sample agrees', () => {
    const interval = bootstrapMeanInterval([1, 1, 1], { iterations: 200 });

    expect(interval).toMatchObject({ lower: 1, mean: 1, samples: 3, upper: 1 });
  });

  it('keeps the lower bound at or below zero for a small, noisy win', () => {
    const interval = bootstrapMeanInterval([1, 1, -1, 0], { iterations: 2000, seed: 3 });

    expect(interval.mean).toBeGreaterThan(0);
    expect(interval.lower).toBeLessThanOrEqual(0);
  });

  it('reports nothing rather than zero when no pair was decided', () => {
    expect(bootstrapMeanInterval([])).toMatchObject({ lower: null, mean: null, samples: 0 });
  });
});

describe('sampleVariance', () => {
  it('is undefined below two samples and exact above', () => {
    expect(sampleVariance([1])).toBeNull();
    expect(sampleVariance([1, -1])).toBe(2);
  });
});

describe('summarizeUsage', () => {
  it('sums reported fields', () => {
    const totals = summarizeUsage([
      { ...unknownUsage, costUsd: 0.5, inputTokens: 100, totalTokens: 120 },
      { ...unknownUsage, costUsd: 0.25, inputTokens: 50, totalTokens: 60 },
    ]);

    expect(totals).toMatchObject({
      costUsd: 0.75,
      inputTokens: 150,
      totalTokens: 180,
      unknownCost: 0,
    });
  });

  it('keeps an unreported cost unknown instead of counting it as free', () => {
    const totals = summarizeUsage([
      { ...unknownUsage, costUsd: 0.5 },
      { ...unknownUsage, costUsd: null },
    ]);

    expect(totals.costUsd).toBeNull();
    expect(totals.unknownCost).toBe(1);
  });
});

describe('judgeHumanAgreement', () => {
  it('measures agreement over comparable pairs and skips what the judge could not decide', () => {
    const result = judgeHumanAgreement([
      { human: 'candidate', judge: 'candidate' },
      { human: 'baseline', judge: 'baseline' },
      { human: 'tie', judge: 'candidate' },
      { human: 'candidate', judge: 'inconclusive' },
    ]);

    expect(result).toMatchObject({ compared: 3, skipped: 1 });
    expect(result.agreement).toBeCloseTo(2 / 3);
  });

  it('does not reward a judge that always answers the same way', () => {
    const result = judgeHumanAgreement([
      { human: 'candidate', judge: 'candidate' },
      { human: 'candidate', judge: 'candidate' },
    ]);

    expect(result.agreement).toBe(1);
    expect(result.kappa).toBeNull();
  });

  it('reports nothing when no calibration pair is comparable', () => {
    expect(judgeHumanAgreement([{ human: 'tie', judge: 'inconclusive' }])).toMatchObject({
      agreement: null,
      compared: 0,
    });
  });
});

describe('buildRegressionLedger', () => {
  it('names a case that went from pass to anything else', () => {
    const ledger = buildRegressionLedger(
      new Map([
        ['a', 'pass'],
        ['b', 'pass'],
        ['c', 'fail'],
      ]),
      new Map([
        ['a', 'pass'],
        ['b', 'fail'],
        ['c', 'fail'],
      ])
    );

    expect(ledger).toEqual([
      { caseId: 'b', detail: 'Deterministic gates went from pass to fail.' },
    ]);
  });

  it('treats an unverified candidate as a regression against a passing baseline', () => {
    expect(
      buildRegressionLedger(new Map([['a', 'pass']]), new Map([['a', 'unverified']]))
    ).toHaveLength(1);
  });

  it('names a case the candidate never produced', () => {
    expect(buildRegressionLedger(new Map([['a', 'pass']]), new Map())[0]?.detail).toContain(
      'no result'
    );
  });
});
