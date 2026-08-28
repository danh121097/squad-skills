import { parseDocument } from 'yaml';

import type { AgreementResult, ConfidenceInterval, RegressionEntry } from './eval-statistics.ts';
import type { PairwiseOutcome } from './pairwise-judge.ts';

/**
 * The promotion decision, as a pure function over recorded evidence.
 *
 * Every refusal below is a separate reason, and the gate collects all of them
 * rather than returning on the first: a maintainer who fixes one blocker should
 * see the other three in the same run instead of discovering them one paid
 * cycle at a time.
 *
 * Nothing here mutates anything. Applying an approved diff is the normal
 * workflow's job — this gate only answers whether it may be applied, which is
 * also why a provider outage cannot leave a half-promoted skill behind.
 */
export interface ApprovalRecord {
  /** The version this signature was given for, not merely the current one. */
  candidateVersion: string;
  checklist: Record<string, boolean>;
  cycleId: string;
  /** Hash of the judging report the reviewer actually read. */
  judgingReportHash: string;
  reviewedOn: string;
  reviewer: string;
}

export interface PromotionInput {
  /** Raw `promotion-approval.yml`, or null when no human signed anything. */
  approvalSource: string | null;
  baselineVersion: string;
  /** Measured budget regression against the recorded ceiling, when any. */
  budgetRegression: string | null;
  calibration: AgreementResult | null;
  calibrationMinimumAgreement: number;
  /** Fewest labelled pairs that can carry an agreement figure. */
  calibrationMinimumPairs: number;
  candidateVersion: string;
  cycleId: string;
  /** Verdict of the deterministic gates over the candidate arm. */
  deterministicBlocking: boolean;
  /** Distance from zero the lower bound must clear to count as an improvement. */
  equivalenceBoundary: number;
  interval: ConfidenceInterval;
  /** Lane the judged evidence came from. Promotion reads the held-out lane. */
  judgedLane: string;
  /** Hash recorded in the judging report, recomputed by the caller. */
  judgingReportHash: string;
  lengthControl: { biased: boolean; detail: string };
  /** The lane a promotion may be decided on, from the contract. */
  promotionLane: string;
  outcomes: readonly PairwiseOutcome[];
  regressions: readonly RegressionEntry[];
  /** Cards whose freshness lapsed; a stale source cannot back a promotion. */
  staleKnowledgeCards: readonly string[];
  /**
   * Whether the promotion threshold was registered after calibration rather
   * than guessed before it. Cycle one refuses to report a verdict without it.
   */
  thresholdRegistered: boolean;
}

export interface PromotionDecision {
  approved: boolean;
  notes: string[];
  refusals: string[];
}

/** Every box a human has to tick before a candidate diff may be applied. */
export const requiredApprovalChecklist = [
  'diff_reviewed',
  'transcripts_reviewed',
  'source_provenance_reviewed',
  'screenshots_reviewed',
] as const;

export function evaluatePromotion(input: PromotionInput): PromotionDecision {
  const refusals: string[] = [];
  const notes: string[] = [];

  // Read first: every number below describes one lane's evidence, and a
  // calibration run writes the same report shape an acceptance run does.
  if (input.judgedLane !== input.promotionLane) {
    refusals.push(
      `Judged evidence comes from the "${input.judgedLane}" lane; promotion is decided on the held-out "${input.promotionLane}" lane.`
    );
  }

  if (input.deterministicBlocking) {
    refusals.push(
      'Deterministic gates block this candidate. A rubric score never overrides a failed invariant.'
    );
  }

  for (const regression of input.regressions) {
    refusals.push(`Critical regression on "${regression.caseId}": ${regression.detail}`);
  }

  const undecided = input.outcomes.filter((outcome) => outcome.verdict === 'inconclusive');

  for (const outcome of undecided) {
    // The reason is carried through rather than assumed: a maintainer sent to
    // debug an unstable judge, when the gates simply refused to send the case,
    // looks in the wrong place.
    refusals.push(`${undecidedLabel(outcome.reason)} on "${outcome.caseId}": ${outcome.detail}`);
  }

  if (!input.thresholdRegistered) {
    refusals.push(
      'No promotion threshold is registered. The threshold is set after the first calibration, not guessed before it, so no verdict can be reported yet.'
    );
  }

  refusals.push(...calibrationRefusals(input));

  if (input.lengthControl.biased) {
    refusals.push(`Length and style control: ${input.lengthControl.detail}`);
  }

  refusals.push(...intervalRefusals(input, notes));

  if (input.budgetRegression) {
    refusals.push(`Context budget regression: ${input.budgetRegression}`);
  }

  for (const card of input.staleKnowledgeCards) {
    refusals.push(`Knowledge card "${card}" is past its freshness date and needs re-review.`);
  }

  refusals.push(...versionRefusals(input));
  refusals.push(...approvalRefusals(input, notes));

  return { approved: refusals.length === 0, notes, refusals };
}

function undecidedLabel(reason: PairwiseOutcome['reason']): string {
  if (reason === 'gates-blocked') return 'Case not judged, deterministic gates block it,';
  if (reason === 'staging-failed') return 'Case not judged, a render could not be staged,';
  if (reason === 'budget-stop') return 'Case not judged, the judging budget stop fired,';

  return 'Order-unstable comparison';
}

function calibrationRefusals(input: PromotionInput): string[] {
  const { calibration, calibrationMinimumAgreement, calibrationMinimumPairs } = input;

  if (!calibration || calibration.compared === 0) {
    return [
      'The calibration subset was not scored against human labels, so judge agreement is unmeasured.',
    ];
  }

  // One agreeing pair is 100% agreement and no evidence at all.
  if (calibration.compared < calibrationMinimumPairs) {
    return [
      `Judge-human agreement rests on ${calibration.compared} calibration pair(s), below the registered minimum of ${calibrationMinimumPairs}.`,
    ];
  }

  if ((calibration.agreement ?? 0) < calibrationMinimumAgreement) {
    return [
      `Judge-human agreement is ${format(calibration.agreement)} over ${calibration.compared} calibration pair(s), below the registered minimum ${calibrationMinimumAgreement}. Revise the rubric or the judge rather than the threshold.`,
    ];
  }

  // Kappa is reported and not gated: it is undefined when one label dominates,
  // which is a property of the calibration set rather than of the judge.
  return [];
}

function intervalRefusals(input: PromotionInput, notes: string[]): string[] {
  const { equivalenceBoundary, interval } = input;

  if (interval.lower === null || interval.mean === null) {
    return ['No decided comparison produced an interval, so there is nothing to promote on.'];
  }

  notes.push(
    `Mean preference ${format(interval.mean)} over ${interval.samples} decided pair(s); ${Math.round(interval.confidence * 100)}% interval [${format(interval.lower)}, ${format(interval.upper)}].`
  );

  if (interval.lower <= equivalenceBoundary) {
    return [
      `The lower confidence bound ${format(interval.lower)} does not clear the equivalence boundary ${equivalenceBoundary}. A positive mean with a wide interval is not evidence of improvement.`,
    ];
  }

  return [];
}

function versionRefusals(input: PromotionInput): string[] {
  const baseline = majorOf(input.baselineVersion);
  const candidate = majorOf(input.candidateVersion);

  if (baseline === null || candidate === null) {
    return [
      `Version comparison needs two semantic versions; got baseline "${input.baselineVersion}" and candidate "${input.candidateVersion}".`,
    ];
  }

  // The role contract the skill ships changes with a promotion, and consumers
  // pin the skill by version, so anything short of a major bump publishes a
  // different contract under a compatible number.
  return candidate > baseline
    ? []
    : [
        `Promotion needs a major version bump; the candidate is ${input.candidateVersion} against baseline ${input.baselineVersion}.`,
      ];
}

function approvalRefusals(input: PromotionInput, notes: string[]): string[] {
  if (input.approvalSource === null) {
    return ['No human approval record. Diff, transcript, and source review is not bypassable.'];
  }

  const parsed = parseApprovalRecord(input.approvalSource);

  if (parsed.errors.length > 0 || !parsed.record) return parsed.errors;

  const record = parsed.record;
  const refusals: string[] = [];

  // A signature has to name what it signed. Without this, last cycle's approval
  // silently satisfies this cycle, and a reviewer who read one report approves
  // a different one.
  if (record.cycleId !== input.cycleId) {
    refusals.push(
      `The approval record is signed for cycle "${record.cycleId}", not "${input.cycleId}".`
    );
  }

  if (record.candidateVersion !== input.candidateVersion) {
    refusals.push(
      `The approval record is signed for candidate version "${record.candidateVersion}", not "${input.candidateVersion}".`
    );
  }

  if (record.judgingReportHash !== input.judgingReportHash) {
    refusals.push(
      'The approval record names a different judging report than the one being promoted.'
    );
  }

  if (refusals.length === 0) {
    notes.push(`Approved by ${record.reviewer} on ${record.reviewedOn}.`);
  }

  return refusals;
}

/**
 * Reads and checks the human approval record.
 *
 * An unsigned box is a refusal rather than a warning: the record exists so a
 * person states what they inspected, and a partially filled one asserts less
 * than it appears to.
 */
export function parseApprovalRecord(source: string): {
  errors: string[];
  record: ApprovalRecord | null;
} {
  const document = parseDocument(source);

  if (document.errors.length > 0) {
    return { errors: ['The approval record is not valid YAML.'], record: null };
  }

  const value: unknown = document.toJS();

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { errors: ['The approval record must be a YAML mapping.'], record: null };
  }

  const record = value as Record<string, unknown>;
  const errors: string[] = [];
  const reviewer = typeof record.reviewer === 'string' ? record.reviewer.trim() : '';
  const reviewedOn = typeof record.reviewed_on === 'string' ? record.reviewed_on.trim() : '';
  const cycleId = typeof record.cycle_id === 'string' ? record.cycle_id.trim() : '';
  const candidateVersion =
    typeof record.candidate_version === 'string' ? record.candidate_version.trim() : '';
  const judgingReportHash =
    typeof record.judging_report_hash === 'string' ? record.judging_report_hash.trim() : '';

  if (reviewer.length === 0) errors.push('The approval record names no reviewer.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewedOn)) {
    errors.push('The approval record needs reviewed_on as an ISO date.');
  }
  if (cycleId.length === 0) errors.push('The approval record names no cycle_id.');
  if (candidateVersion.length === 0) {
    errors.push('The approval record names no candidate_version.');
  }
  if (judgingReportHash.length === 0) {
    errors.push('The approval record names no judging_report_hash.');
  }

  const checklist =
    typeof record.checklist === 'object' && record.checklist !== null
      ? (record.checklist as Record<string, unknown>)
      : {};

  const signed: Record<string, boolean> = {};

  for (const item of requiredApprovalChecklist) {
    if (checklist[item] !== true) {
      errors.push(`The approval checklist item "${item}" is not signed.`);
      signed[item] = false;
      continue;
    }

    signed[item] = true;
  }

  return {
    errors,
    record:
      errors.length > 0
        ? null
        : { candidateVersion, checklist: signed, cycleId, judgingReportHash, reviewedOn, reviewer },
  };
}

export function renderPromotionDecision(decision: PromotionDecision, skill: string): string {
  const lines = [
    `# ${skill} promotion decision`,
    '',
    decision.approved ? '**APPROVED**' : '**REFUSED**',
    '',
  ];

  if (decision.notes.length > 0) {
    lines.push('## Evidence', '', ...decision.notes.map((note) => `- ${note}`), '');
  }

  if (decision.refusals.length > 0) {
    lines.push('## Refusals', '', ...decision.refusals.map((reason) => `- ${reason}`), '');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function majorOf(version: string): number | null {
  const match = /^(\d+)\.\d+\.\d+/.exec(version.trim());

  return match ? Number(match[1]) : null;
}

function format(value: number | null): string {
  return value === null ? 'unknown' : value.toFixed(3);
}
