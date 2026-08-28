import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { validateJudgingContract } from '../../src/eval/judging-contract-validator.ts';

/**
 * The offline half of the judging contract.
 *
 * Two checks here are the reason the validator exists: a judge in the subject's
 * own provider family, and a case that quietly pins a different model than the
 * cycle recorded. Both produce a number that looks like this cycle's and is not.
 */
const baseline = () =>
  parse(`
judging:
  subject: { provider: codex, model: gpt-5.6-sol }
  judge: { provider: anthropic, model: claude-opus-5 }
  subject_sanity_subset: { provider: anthropic, model: claude-sonnet-5, cases: 6, judged: false }
  authoring_assistance: maintainer plus interactive assistance
  temperature_control: unavailable on the judge
  paid_lanes: [acceptance, calibration]
  promotion_lane: acceptance
  length_control: { acceptance: acc-one, calibration: cal-one }
  budget: { estimated_usd_per_cycle: "15-25", hard_stop_usd: 150 }
  thresholds:
    registered: false
    equivalence_boundary: 0
    minimum_judge_human_agreement: 0.7
    minimum_calibration_pairs: 6
    bootstrap_seed: 1
`) as Record<string, unknown>;

const cases = () =>
  parse(`
lanes:
  development: { paid_judging: false }
  calibration: { paid_judging: true }
  acceptance: { paid_judging: true }
cases:
  - id: dev-one
    lane: development
    config:
      subject: { provider: codex, model: gpt-5.6-sol }
      judge: { provider: anthropic, model: claude-opus-5 }
  - id: cal-one
    lane: calibration
  - id: acc-one
    lane: acceptance
`) as Record<string, unknown>;

const run = (
  baselineManifest: Record<string, unknown> | null,
  caseManifest: Record<string, unknown> | null = cases()
) => {
  const errors: string[] = [];
  const notes: string[] = [];

  validateJudgingContract({
    baseline: baselineManifest,
    baselinePath: 'baseline-manifest.yml',
    cases: caseManifest,
    casesPath: 'case-manifest.yml',
    errors,
    notes,
  });

  return { errors, notes };
};

describe('validateJudgingContract', () => {
  it('accepts the pinned cross-provider contract', () => {
    expect(run(baseline()).errors).toEqual([]);
  });

  it('refuses a promotion lane that is not paid, or is missing', () => {
    const withoutLane = baseline();
    delete (withoutLane.judging as Record<string, unknown>).promotion_lane;

    expect(run(withoutLane).errors.join(' ')).toContain('promotion_lane');

    const free = baseline();
    (free.judging as Record<string, unknown>).promotion_lane = 'development';

    expect(run(free).errors.join(' ')).toContain('promotion_lane');
  });

  it('requires a length control for every paid lane, in that lane', () => {
    const partial = baseline();
    (partial.judging as Record<string, unknown>).length_control = { acceptance: 'acc-one' };

    expect(run(partial).errors.join(' ')).toContain('calibration');

    const misplaced = baseline();
    (misplaced.judging as Record<string, unknown>).length_control = {
      acceptance: 'acc-one',
      calibration: 'acc-one',
    };

    expect(run(misplaced).errors.join(' ')).toContain('acc-one');
  });

  it('refuses a length control naming a case that does not exist', () => {
    const ghost = baseline();
    (ghost.judging as Record<string, unknown>).length_control = {
      acceptance: 'acc-one',
      calibration: 'cal-does-not-exist',
    };

    expect(run(ghost).errors.join(' ')).toContain('cal-does-not-exist');
  });

  it('refuses an agreement figure allowed to rest on a single pair', () => {
    const thin = baseline();
    const judging = thin.judging as { thresholds: Record<string, unknown> };
    judging.thresholds.minimum_calibration_pairs = 0;

    expect(run(thin).errors.join(' ')).toContain('minimum_calibration_pairs');
  });

  it('refuses a judge in the subject provider family', () => {
    const manifest = baseline();
    (manifest.judging as Record<string, unknown>).judge = { model: 'o5', provider: 'openai' };

    expect(run(manifest).errors.join(' ')).toContain('same family');
  });

  it('requires the block once a lane declares paid judging', () => {
    expect(run({}).errors.join(' ')).toContain('pinned judging block is required');
  });

  it('says so, without failing, when no lane is paid', () => {
    const result = run({}, parse('lanes:\n  development: { paid_judging: false }\n'));

    expect(result.errors).toEqual([]);
    expect(result.notes.join(' ')).toContain('deterministic gates only');
  });

  it('refuses a case that pins a model the cycle did not', () => {
    const caseManifest = cases();
    const first = (caseManifest.cases as Array<Record<string, any>>)[0] as Record<string, any>;

    first.config.subject.model = 'gpt-5.4';

    expect(run(baseline(), caseManifest).errors.join(' ')).toContain('not the cycle');
  });

  it('refuses a paid-lane list that disagrees with the case manifest', () => {
    const manifest = baseline();
    (manifest.judging as Record<string, unknown>).paid_lanes = ['acceptance'];

    expect(run(manifest).errors.join(' ')).toContain('does not match');
  });

  it('refuses a sanity subset judged by its own provider family', () => {
    const manifest = baseline();
    (manifest.judging as Record<string, any>).subject_sanity_subset.judged = true;

    expect(run(manifest).errors.join(' ')).toContain('may not be judged');
  });

  it('refuses an undisclosed authoring assistant or temperature control', () => {
    const manifest = baseline();
    delete (manifest.judging as Record<string, unknown>).authoring_assistance;

    expect(run(manifest).errors.join(' ')).toContain('authoring_assistance');
  });

  it('refuses malformed thresholds and a missing hard stop', () => {
    const manifest = baseline();
    (manifest.judging as Record<string, any>).thresholds.minimum_judge_human_agreement = 0;
    (manifest.judging as Record<string, any>).budget.hard_stop_usd = 0;

    const errors = run(manifest).errors.join(' ');

    expect(errors).toContain('minimum_judge_human_agreement');
    expect(errors).toContain('hard_stop_usd');
  });
});
