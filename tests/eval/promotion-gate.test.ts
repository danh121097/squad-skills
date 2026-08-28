import { describe, expect, it } from 'vitest';

import {
  evaluatePromotion,
  parseApprovalRecord,
  requiredApprovalChecklist,
  type PromotionInput,
} from '../../src/eval/promotion-gate.ts';
import type { PairwiseOutcome } from '../../src/eval/pairwise-judge.ts';

/**
 * The refusal paths, which are the whole product of this gate.
 *
 * Each case below is one way a promotion could otherwise happen on incomplete
 * evidence: a mean that hides a regression, an unstable comparison, an
 * uncalibrated judge, an unsigned checklist, a version that does not move.
 */
const reportHash = 'sha256:1111';
const approval = [
  'reviewer: Harry Nguyen',
  'reviewed_on: 2026-08-28',
  'cycle_id: designer-2026-08-27',
  'candidate_version: 3.0.0',
  `judging_report_hash: ${reportHash}`,
  'checklist:',
  ...requiredApprovalChecklist.map((item) => `  ${item}: true`),
  '',
].join('\n');

const outcome = (caseId: string, verdict: PairwiseOutcome['verdict']): PairwiseOutcome => ({
  caseId,
  detail: 'both orders agreed',
  orders: [],
  reason: 'judged',
  verdict,
});

const promotable = (overrides: Partial<PromotionInput> = {}): PromotionInput => ({
  approvalSource: approval,
  baselineVersion: '2.2.0',
  budgetRegression: null,
  calibration: { agreement: 0.9, compared: 10, kappa: 0.8, skipped: 0 },
  calibrationMinimumAgreement: 0.7,
  calibrationMinimumPairs: 6,
  candidateVersion: '3.0.0',
  cycleId: 'designer-2026-08-27',
  deterministicBlocking: false,
  equivalenceBoundary: 0,
  interval: { confidence: 0.95, iterations: 2000, lower: 0.3, mean: 0.6, samples: 6, upper: 0.9 },
  judgedLane: 'acceptance',
  judgingReportHash: reportHash,
  lengthControl: { biased: false, detail: 'tied' },
  outcomes: [outcome('a', 'candidate'), outcome('b', 'tie')],
  promotionLane: 'acceptance',
  regressions: [],
  staleKnowledgeCards: [],
  thresholdRegistered: true,
  ...overrides,
});

describe('evaluatePromotion', () => {
  it('refuses evidence judged on a lane other than the promotion lane', () => {
    const decision = evaluatePromotion(promotable({ judgedLane: 'calibration' }));

    expect(decision.approved).toBe(false);
    expect(decision.refusals.join(' ')).toContain('"calibration" lane');
  });

  it('refuses an agreement figure resting on too few labelled pairs', () => {
    const decision = evaluatePromotion(
      promotable({ calibration: { agreement: 1, compared: 1, kappa: null, skipped: 0 } })
    );

    expect(decision.refusals.join(' ')).toContain('below the registered minimum of 6');
  });

  it('refuses an approval signed for another cycle, version, or report', () => {
    for (const overrides of [
      { cycleId: 'designer-2026-09-01' },
      { candidateVersion: '3.1.0' },
      { judgingReportHash: 'sha256:2222' },
    ]) {
      const decision = evaluatePromotion(promotable(overrides));

      expect(decision.approved).toBe(false);
      expect(decision.refusals.join(' ')).toMatch(/approval record/);
    }
  });

  it('names why a pair was not decided instead of calling everything unstable', () => {
    const blocked: PairwiseOutcome = {
      caseId: 'c',
      detail: 'Not judged: deterministic gates block the candidate arm.',
      orders: [],
      reason: 'gates-blocked',
      verdict: 'inconclusive',
    };

    const decision = evaluatePromotion(promotable({ outcomes: [blocked] }));

    expect(decision.refusals.join(' ')).toContain('deterministic gates block it');
    expect(decision.refusals.join(' ')).not.toContain('Order-unstable');
  });

  it('approves only when every check holds', () => {
    const decision = evaluatePromotion(promotable());

    expect(decision.refusals).toEqual([]);
    expect(decision.approved).toBe(true);
    expect(decision.notes.join(' ')).toContain('Approved by Harry Nguyen');
  });

  it('refuses when deterministic gates block, whatever the judge preferred', () => {
    const decision = evaluatePromotion(promotable({ deterministicBlocking: true }));

    expect(decision.approved).toBe(false);
    expect(decision.refusals[0]).toContain('never overrides a failed invariant');
  });

  it('refuses a candidate that wins the mean and regresses one case', () => {
    const decision = evaluatePromotion(
      promotable({ regressions: [{ caseId: 'acc-web-billing', detail: 'pass to fail.' }] })
    );

    expect(decision.approved).toBe(false);
    expect(decision.refusals.join(' ')).toContain('acc-web-billing');
  });

  it('refuses an order-unstable comparison', () => {
    const decision = evaluatePromotion({
      ...promotable(),
      outcomes: [outcome('a', 'candidate'), outcome('b', 'inconclusive')],
    });

    expect(decision.refusals.join(' ')).toContain('Order-unstable');
  });

  it('refuses to report a verdict before a threshold is registered', () => {
    const decision = evaluatePromotion(promotable({ thresholdRegistered: false }));

    expect(decision.refusals.join(' ')).toContain('threshold is registered');
  });

  it('refuses when the calibration subset was never scored', () => {
    expect(evaluatePromotion(promotable({ calibration: null })).refusals.join(' ')).toContain(
      'not scored against human labels'
    );
  });

  it('refuses when the judge disagrees with the human labels', () => {
    const decision = evaluatePromotion(
      promotable({ calibration: { agreement: 0.4, compared: 10, kappa: 0.1, skipped: 0 } })
    );

    expect(decision.refusals.join(' ')).toContain('below the registered minimum');
  });

  it('refuses when the longer no-op control won', () => {
    const decision = evaluatePromotion(
      promotable({ lengthControl: { biased: true, detail: 'the control won' } })
    );

    expect(decision.refusals.join(' ')).toContain('the control won');
  });

  it('refuses a small positive mean whose lower bound touches the boundary', () => {
    const decision = evaluatePromotion(
      promotable({
        interval: {
          confidence: 0.95,
          iterations: 2000,
          lower: 0,
          mean: 0.4,
          samples: 4,
          upper: 0.8,
        },
      })
    );

    expect(decision.refusals.join(' ')).toContain('equivalence boundary');
    expect(decision.notes.join(' ')).toContain('Mean preference 0.400');
  });

  it('refuses when no pair was decided at all', () => {
    const decision = evaluatePromotion(
      promotable({
        interval: {
          confidence: 0.95,
          iterations: 0,
          lower: null,
          mean: null,
          samples: 0,
          upper: null,
        },
      })
    );

    expect(decision.refusals.join(' ')).toContain('nothing to promote on');
  });

  it('refuses a context budget regression and a stale knowledge card', () => {
    const decision = evaluatePromotion(
      promotable({
        budgetRegression: 'median_loaded_words measured 2100 against ceiling 2018',
        staleKnowledgeCards: ['wcag-text-contrast-minimum'],
      })
    );

    expect(decision.refusals.join(' ')).toContain('2100');
    expect(decision.refusals.join(' ')).toContain('wcag-text-contrast-minimum');
  });

  it('refuses anything short of a major version bump', () => {
    expect(
      evaluatePromotion(promotable({ candidateVersion: '2.3.0' })).refusals.join(' ')
    ).toContain('major version bump');
    // The approval has to move with the version: a signature names what it signed.
    expect(
      evaluatePromotion(
        promotable({
          approvalSource: approval.replace('candidate_version: 3.0.0', 'candidate_version: 4.0.0'),
          candidateVersion: '4.0.0',
        })
      ).approved
    ).toBe(true);
  });

  it('refuses without a human approval record', () => {
    expect(evaluatePromotion(promotable({ approvalSource: null })).refusals.join(' ')).toContain(
      'not bypassable'
    );
  });

  it('collects every blocker in one pass instead of stopping at the first', () => {
    const decision = evaluatePromotion(
      promotable({
        approvalSource: null,
        candidateVersion: '2.2.0',
        deterministicBlocking: true,
      })
    );

    expect(decision.refusals).toHaveLength(3);
  });
});

describe('parseApprovalRecord', () => {
  it('accepts a fully signed record', () => {
    expect(parseApprovalRecord(approval).errors).toEqual([]);
  });

  it('refuses an unsigned checklist item', () => {
    const partial = approval.replace('  diff_reviewed: true', '  diff_reviewed: false');

    expect(parseApprovalRecord(partial).errors.join(' ')).toContain('diff_reviewed');
    expect(parseApprovalRecord(partial).record).toBeNull();
  });

  it('refuses a record with no reviewer or no date', () => {
    const anonymous = approval.replace('reviewer: Harry Nguyen', 'reviewer: ""');

    expect(parseApprovalRecord(anonymous).errors.join(' ')).toContain('names no reviewer');
    expect(
      parseApprovalRecord(approval.replace('2026-08-28', 'yesterday')).errors.join(' ')
    ).toContain('ISO date');
  });

  it('refuses anything that is not a mapping', () => {
    expect(parseApprovalRecord('- approved').errors.join(' ')).toContain('YAML mapping');
  });
});
