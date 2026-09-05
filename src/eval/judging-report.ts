import {
  bootstrapMeanInterval,
  sampleVariance,
  scoreOutcomes,
  summarizeUsage,
  tallyOutcomes,
  type AgreementResult,
  type ConfidenceInterval,
  type OutcomeTally,
  type RegressionEntry,
  type UsageTotals,
} from './eval-statistics.ts';
import { evaluateLengthControl, type PairwiseOutcome } from './pairwise-judge.ts';
import { hashContent } from './skill-payload-measurement.ts';

/**
 * The qualitative half of a run, assembled into one reproducible record.
 *
 * It deliberately reports more than a verdict. A win rate with no interval, no
 * variance, no bias control, and no cost is the number this phase was written
 * not to trust, so every one of those sits next to the result rather than in a
 * maintainer's memory.
 */
export interface JudgingModels {
  /** Disclosed, never treated as the author of the judged artifact. */
  authoringAssistance: string;
  judge: string;
  subject: string;
}

export interface JudgingReportInput {
  calibration: AgreementResult | null;
  cycleId: string;
  evidence: JudgingEvidenceIdentity;
  lane: string;
  /** Named by the caller; this engine never knows which skill it is grading. */
  skill: string;
  /** The length-matched rewording control, or null when it was not run. */
  lengthControl: PairwiseOutcome | null;
  models: JudgingModels;
  outcomes: readonly PairwiseOutcome[];
  regressions: readonly RegressionEntry[];
  /** Bootstrap seed, recorded so the interval can be recomputed exactly. */
  seed: number;
}

export interface JudgingReport {
  calibration: AgreementResult | null;
  cycleId: string;
  evidence: JudgingEvidenceIdentity;
  /** Judge calls actually made, which is not `tally.total * 2` once a case is
   * skipped for blocking gates or a budget stop. */
  judgeCalls: number;
  interval: ConfidenceInterval;
  lane: string;
  lengthControl: { biased: boolean; detail: string };
  models: JudgingModels;
  outcomes: PairwiseOutcome[];
  regressions: RegressionEntry[];
  reportHash: string;
  seed: number;
  skill: string;
  tally: OutcomeTally;
  usage: UsageTotals;
  /** The single worst decided case, which a mean would hide. */
  worstCase: { caseId: string; verdict: string } | null;
  variance: number | null;
}

/** Identity that binds qualitative judging to the deterministic candidate artifacts. */
export interface JudgingEvidenceIdentity {
  candidateArtifacts: Array<{
    artifactHash: string | null;
    caseId: string;
    runDirectory: string;
  }>;
  caseManifestHash: string;
  deterministicReportHash: string;
  payloadHash: string;
}

export function buildJudgingReport(input: JudgingReportInput): JudgingReport {
  const outcomes = [...input.outcomes].sort((left, right) =>
    left.caseId < right.caseId ? -1 : left.caseId > right.caseId ? 1 : 0
  );

  const scores = scoreOutcomes(outcomes);
  // The control's two calls are paid for out of the same budget, so they belong
  // in the totals the budget is checked against — even though the control is
  // never scored alongside the cases.
  const judged = [...outcomes, ...(input.lengthControl ? [input.lengthControl] : [])];
  const usages = judged.flatMap((outcome) => outcome.orders.map((order) => order.usage));

  const body = {
    calibration: input.calibration,
    cycleId: input.cycleId,
    evidence: {
      ...input.evidence,
      candidateArtifacts: [...input.evidence.candidateArtifacts].sort(
        (left, right) =>
          compare(left.caseId, right.caseId) || compare(left.runDirectory, right.runDirectory)
      ),
    },
    interval: bootstrapMeanInterval(scores, { seed: input.seed }),
    judgeCalls: usages.length,
    lane: input.lane,
    lengthControl: evaluateLengthControl(input.lengthControl),
    models: input.models,
    outcomes,
    regressions: [...input.regressions],
    seed: input.seed,
    skill: input.skill,
    tally: tallyOutcomes(outcomes),
    usage: summarizeUsage(usages),
    variance: sampleVariance(scores),
    worstCase: worstOf(outcomes),
  };

  return { ...body, reportHash: hashContent(JSON.stringify(body)) };
}

/**
 * Recomputes the hash a report carries, over the report itself.
 *
 * The hash is written from the body at build time, so removing it and hashing
 * what remains reproduces it exactly — unless a field was edited afterwards.
 * Promotion runs this before reading a single number: an evidence file that can
 * be hand-written is not evidence.
 */
export function verifyJudgingReportHash(report: JudgingReport): boolean {
  const { reportHash, ...body } = report;

  return hashContent(JSON.stringify(body)) === reportHash;
}

export function renderJudgingReport(report: JudgingReport): string {
  const { interval, tally, usage } = report;
  const lines = [
    `# ${report.skill} qualitative judging report`,
    '',
    `- cycle: \`${report.cycleId}\``,
    `- lane: \`${report.lane}\``,
    `- deterministic report: \`${report.evidence.deterministicReportHash}\``,
    `- candidate payload: \`${report.evidence.payloadHash}\``,
    `- case manifest: \`${report.evidence.caseManifestHash}\``,
    `- subject: \`${report.models.subject}\``,
    `- judge: \`${report.models.judge}\``,
    `- authoring assistance: \`${report.models.authoringAssistance}\``,
    `- bootstrap seed: \`${report.seed}\``,
    `- report hash: \`${report.reportHash}\``,
    '',
    'The judge exposes no temperature control, so its output is not guaranteed',
    'deterministic. Order swaps and repeated runs absorb the residual variance;',
    'this report does not claim determinism it cannot enforce.',
    '',
    `**${tally.wins} win / ${tally.losses} loss / ${tally.ties} tie / ${tally.inconclusive} inconclusive** over ${tally.total} case(s).`,
    '',
    `- mean preference: ${number(interval.mean)} (variance ${number(report.variance)})`,
    `- ${Math.round(interval.confidence * 100)}% bootstrap interval: [${number(interval.lower)}, ${number(interval.upper)}] over ${interval.samples} decided pair(s)`,
    `- worst decided case: ${report.worstCase ? `\`${report.worstCase.caseId}\` (${report.worstCase.verdict})` : 'none'}`,
    `- length and style control: ${report.lengthControl.detail}`,
    `- judge-human agreement: ${
      report.calibration
        ? `${number(report.calibration.agreement)} raw, kappa ${number(report.calibration.kappa)} over ${report.calibration.compared} pair(s)`
        : 'not scored'
    }`,
    '',
    '## Efficiency',
    '',
    `- tokens: input ${number(usage.inputTokens)}, output ${number(usage.outputTokens)}, cached ${number(usage.cachedTokens)}, total ${number(usage.totalTokens)}`,
    `- latency: ${number(usage.latencyMs)} ms across ${report.judgeCalls} judge call(s)`,
    `- cost: ${number(usage.costUsd)} (${usage.unknownCost} call(s) reported no cost; subscription auth exposes none, and unknown is never recorded as zero)`,
    '',
    '## Per-case ledger',
    '',
    '| Case | Verdict | Detail |',
    '| --- | --- | --- |',
    ...report.outcomes.map(
      (outcome) => `| \`${outcome.caseId}\` | ${outcome.verdict} | ${cell(outcome.detail)} |`
    ),
    '',
  ];

  if (report.regressions.length > 0) {
    lines.push(
      '## Deterministic regressions',
      '',
      ...report.regressions.map((regression) => `- \`${regression.caseId}\`: ${regression.detail}`),
      ''
    );
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * The worst *decided* case, which is what the label says.
 *
 * Inconclusive pairs are excluded here for the same reason they are excluded
 * from scoring: they are the absence of a decision, not a bad one. They are not
 * hidden — the tally counts them and promotion refuses on them.
 */
function worstOf(outcomes: readonly PairwiseOutcome[]): { caseId: string; verdict: string } | null {
  const rank = { baseline: 0, candidate: 2, tie: 1 } as const;
  const decided = outcomes.filter(
    (outcome): outcome is PairwiseOutcome & { verdict: keyof typeof rank } =>
      outcome.verdict !== 'inconclusive'
  );
  const worst = [...decided].sort((left, right) => rank[left.verdict] - rank[right.verdict])[0];

  return worst ? { caseId: worst.caseId, verdict: worst.verdict } : null;
}

function number(value: number | null): string {
  return value === null ? 'unknown' : String(Number(value.toFixed(3)));
}

function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/[\n\r]/g, ' ');
}
