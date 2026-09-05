import { judgeHumanAgreement, type RegressionEntry } from './eval-statistics.ts';
import {
  buildJudgingReport,
  type JudgingEvidenceIdentity,
  type JudgingModels,
  type JudgingReport,
} from './judging-report.ts';
import {
  buildJudgePackets,
  judgePair,
  type JudgeFile,
  type JudgeRunner,
  type JudgeSide,
  type PairwiseOutcome,
  type PairwiseWinner,
} from './pairwise-judge.ts';

/**
 * Drives judging over already-graded arms.
 *
 * The order here is the contract's, not a convenience: deterministic gates run
 * first, and a case either arm blocks on is never sent to a judge. Paying a
 * provider to rank two components when one of them fails contrast is spending
 * money to learn something the free gate already decided.
 */
export interface JudgingArm {
  /** Whether this arm's deterministic gates block promotion. */
  blocking: boolean;
  files: JudgeFile[];
  screenshots: string[];
}

export interface JudgingCaseInput {
  baseline: JudgingArm;
  candidate: JudgingArm;
  caseId: string;
  rubricIds: string[];
  seed: number;
}

export type ScreenshotStager = (options: {
  caseId: string;
  index: number;
  order: 'ab' | 'ba';
  side: JudgeSide;
  source: string;
}) => Promise<string>;

export interface RunJudgingOptions {
  /** Human labels for the calibration subset, keyed by case id. */
  calibrationLabels?: ReadonlyMap<string, PairwiseWinner>;
  cases: readonly JudgingCaseInput[];
  cycleId: string;
  evidence: JudgingEvidenceIdentity;
  /**
   * Known spend at which the run stops making calls. Null disables it; an
   * unknown cost never counts toward it, because a stop that fires on an
   * unmeasured total is not a budget control either.
   */
  hardStopUsd?: number | null;
  lane: string;
  /** The semantically equivalent, longer rewording control. */
  lengthControl?: JudgingCaseInput | null;
  models: JudgingModels;
  regressions: readonly RegressionEntry[];
  run: JudgeRunner;
  /** Named by the caller; this engine never knows which skill it is grading. */
  skill: string;
  /** Bootstrap seed from the pinned thresholds, recorded in the report. */
  seed: number;
  stageScreenshot: ScreenshotStager;
}

export async function runJudging(options: RunJudgingOptions): Promise<JudgingReport> {
  const outcomes: PairwiseOutcome[] = [];
  const spend = { usd: 0 };

  for (const entry of options.cases) {
    outcomes.push(await judgeCase(entry, options, spend));
  }

  const lengthControl = options.lengthControl
    ? await judgeCase(options.lengthControl, options, spend)
    : null;

  return buildJudgingReport({
    calibration: calibrationAgreement(outcomes, options.calibrationLabels),
    cycleId: options.cycleId,
    evidence: options.evidence,
    lane: options.lane,
    lengthControl,
    models: options.models,
    outcomes,
    regressions: options.regressions,
    seed: options.seed,
    skill: options.skill,
  });
}

/**
 * Model and provider names the judge must not see.
 *
 * A pinned model name in a file header or a run path identifies the arm as
 * precisely as the word "candidate" does, so it is redacted from the prompt and
 * refused by the blinding backstop.
 */
function redactTermsFor(models: JudgingModels): string[] {
  return [models.subject, models.judge]
    .flatMap((entry) => [entry, ...entry.split('/')])
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 2);
}

async function judgeCase(
  entry: JudgingCaseInput,
  options: RunJudgingOptions,
  spend: { usd: number }
): Promise<PairwiseOutcome> {
  const hardStop = options.hardStopUsd ?? null;

  // Checked before the call, not after the run: a stop that only reports an
  // overrun once every call is paid for is a receipt, not a stop.
  if (hardStop !== null && spend.usd > hardStop) {
    return {
      caseId: entry.caseId,
      detail: `Not judged: known judging spend ${spend.usd} passed the hard stop ${hardStop}.`,
      orders: [],
      reason: 'budget-stop',
      verdict: 'inconclusive',
    };
  }

  const blocked = [
    entry.baseline.blocking ? 'baseline' : null,
    entry.candidate.blocking ? 'candidate' : null,
  ].filter((value): value is string => value !== null);

  if (blocked.length > 0) {
    return {
      caseId: entry.caseId,
      detail: `Not judged: deterministic gates block the ${blocked.join(' and ')} arm, and a rubric score never overrides a failed invariant.`,
      orders: [],
      reason: 'gates-blocked',
      verdict: 'inconclusive',
    };
  }

  const pair = {
    baseline: { files: entry.baseline.files, screenshots: entry.baseline.screenshots },
    candidate: { files: entry.candidate.files, screenshots: entry.candidate.screenshots },
    caseId: entry.caseId,
    rubricIds: entry.rubricIds,
    seed: entry.seed,
  };

  let staged: Map<string, string>;

  try {
    staged = await stageScreenshots(entry, options.stageScreenshot);
  } catch (error) {
    // One unreadable render must cost one case, not the whole run: everything
    // already paid for is still written to the report.
    return {
      caseId: entry.caseId,
      detail: `Not judged: a render could not be staged (${error instanceof Error ? error.message : String(error)}).`,
      orders: [],
      reason: 'staging-failed',
      verdict: 'inconclusive',
    };
  }

  const redactTerms = redactTermsFor(options.models);

  const packets = buildJudgePackets(pair, {
    redactTerms,
    screenshotPaths: (order, side, index) => staged.get(key(order, side, index)) as string,
  });

  const outcome = await judgePair({ pair, packets, run: options.run });

  for (const order of outcome.orders) {
    if (typeof order.usage.costUsd === 'number' && Number.isFinite(order.usage.costUsd)) {
      spend.usd += order.usage.costUsd;
    }
  }

  return outcome;
}

/**
 * Copies each arm's renders to a blinded destination before any packet is built.
 *
 * The filename is part of what the judge sees, so `dev-x.candidate/mobile.png`
 * would defeat the blinding that the prompt text carefully preserves.
 */
async function stageScreenshots(
  entry: JudgingCaseInput,
  stage: ScreenshotStager
): Promise<Map<string, string>> {
  const staged = new Map<string, string>();

  for (const order of ['ab', 'ba'] as const) {
    const assignment: Record<JudgeSide, JudgingArm> =
      order === 'ab'
        ? { 'entry-a': entry.baseline, 'entry-b': entry.candidate }
        : { 'entry-a': entry.candidate, 'entry-b': entry.baseline };

    for (const side of ['entry-a', 'entry-b'] as const) {
      const screenshots = assignment[side].screenshots;

      for (let index = 0; index < screenshots.length; index += 1) {
        staged.set(
          key(order, side, index),
          await stage({
            caseId: entry.caseId,
            index,
            order,
            side,
            source: screenshots[index] as string,
          })
        );
      }
    }
  }

  return staged;
}

function calibrationAgreement(
  outcomes: readonly PairwiseOutcome[],
  labels: ReadonlyMap<string, PairwiseWinner> | undefined
) {
  if (!labels || labels.size === 0) return null;

  const pairs = outcomes
    .filter((outcome) => labels.has(outcome.caseId))
    .map((outcome) => ({
      human: labels.get(outcome.caseId) as PairwiseWinner,
      judge: outcome.verdict,
    }));

  return judgeHumanAgreement(pairs);
}

function key(order: string, side: string, index: number): string {
  return `${order}:${side}:${index}`;
}
