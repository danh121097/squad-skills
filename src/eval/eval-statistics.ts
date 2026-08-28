import type {
  JudgeUsage,
  PairwiseOutcome,
  PairwiseVerdict,
  PairwiseWinner,
} from './pairwise-judge.ts';

/**
 * Deterministic statistics over judged pairs.
 *
 * Nothing here calls a provider, so every number in a report can be recomputed
 * from the recorded outcomes. The bootstrap is seeded for the same reason: an
 * interval that moves between two readings of the same data is not evidence.
 */
export interface OutcomeTally {
  /** Pairs whose two orders disagreed. Counted, never scored. */
  inconclusive: number;
  losses: number;
  ties: number;
  total: number;
  wins: number;
}

export interface ConfidenceInterval {
  confidence: number;
  iterations: number;
  lower: number | null;
  mean: number | null;
  /** Decided pairs the interval was computed from. */
  samples: number;
  upper: number | null;
}

export interface UsageTotals {
  cachedTokens: number | null;
  costUsd: number | null;
  inputTokens: number | null;
  latencyMs: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  /** Calls whose cost the provider never reported, so it stays unknown. */
  unknownCost: number;
  unknownTokens: number;
}

export interface AgreementResult {
  /** Raw agreement over comparable labels. */
  agreement: number | null;
  compared: number;
  /** Chance-corrected agreement; `null` when one label dominates completely. */
  kappa: number | null;
  /** Pairs the judge could not decide, which agreement cannot be read from. */
  skipped: number;
}

export interface RegressionEntry {
  caseId: string;
  detail: string;
}

export function tallyOutcomes(outcomes: readonly PairwiseOutcome[]): OutcomeTally {
  const count = (verdict: PairwiseVerdict) =>
    outcomes.filter((outcome) => outcome.verdict === verdict).length;

  return {
    inconclusive: count('inconclusive'),
    losses: count('baseline'),
    ties: count('tie'),
    total: outcomes.length,
    wins: count('candidate'),
  };
}

/**
 * Scores decided pairs as +1 candidate, -1 baseline, 0 tie.
 *
 * Inconclusive pairs are excluded rather than scored as ties: a tie is a
 * measurement that the two are equivalent, while an inconclusive pair is the
 * absence of a measurement, and folding one into the other would let order
 * instability read as evidence of parity.
 */
export function scoreOutcomes(outcomes: readonly PairwiseOutcome[]): number[] {
  const scores: Record<PairwiseWinner, number> = { baseline: -1, candidate: 1, tie: 0 };

  return outcomes
    .filter((outcome) => outcome.verdict !== 'inconclusive')
    .map((outcome) => scores[outcome.verdict as PairwiseWinner]);
}

export interface BootstrapOptions {
  confidence?: number;
  iterations?: number;
  seed?: number;
}

/**
 * Percentile bootstrap over the per-case scores.
 *
 * A mean alone cannot tell a real improvement from four cases that happened to
 * land the same way, and the promotion rule is written against the lower bound
 * rather than the mean for exactly that reason.
 */
export function bootstrapMeanInterval(
  samples: readonly number[],
  options: BootstrapOptions = {}
): ConfidenceInterval {
  const confidence = options.confidence ?? 0.95;
  const iterations = options.iterations ?? 2000;

  if (samples.length === 0) {
    return { confidence, iterations: 0, lower: null, mean: null, samples: 0, upper: null };
  }

  const random = mulberry32(options.seed ?? 1);
  const means: number[] = [];

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let total = 0;

    for (let draw = 0; draw < samples.length; draw += 1) {
      total += samples[Math.floor(random() * samples.length)] as number;
    }

    means.push(total / samples.length);
  }

  means.sort((left, right) => left - right);

  const tail = (1 - confidence) / 2;

  return {
    confidence,
    iterations,
    lower: percentile(means, tail),
    mean: samples.reduce((total, value) => total + value, 0) / samples.length,
    samples: samples.length,
    upper: percentile(means, 1 - tail),
  };
}

/** Sample variance, `null` below two samples where it is undefined. */
export function sampleVariance(samples: readonly number[]): number | null {
  if (samples.length < 2) return null;

  const mean = samples.reduce((total, value) => total + value, 0) / samples.length;
  const squared = samples.reduce((total, value) => total + (value - mean) ** 2, 0);

  return squared / (samples.length - 1);
}

/**
 * Sums usage, propagating unknowns instead of absorbing them.
 *
 * A missing field makes the total unknown for that field and increments the
 * unknown counter. Summing the known half and printing it as the total is how a
 * cost report ends up understating a run it never fully observed.
 */
export function summarizeUsage(usages: readonly JudgeUsage[]): UsageTotals {
  const fields = [
    'cachedTokens',
    'costUsd',
    'inputTokens',
    'latencyMs',
    'outputTokens',
    'totalTokens',
  ] as const;

  // Null, not zero, until something is actually summed. A run where every case
  // was blocked makes no calls, and reporting `cost: 0` for it would state a
  // measurement nobody took — the same false budget an unknown cost recorded as
  // zero produces.
  const totals: Record<(typeof fields)[number], number | null> = {
    cachedTokens: null,
    costUsd: null,
    inputTokens: null,
    latencyMs: null,
    outputTokens: null,
    totalTokens: null,
  };
  const summed = new Set<(typeof fields)[number]>();

  for (const usage of usages) {
    for (const field of fields) {
      const value = usage[field];

      // A non-finite value is not a measurement either: NaN would survive every
      // later comparison, including the budget stop, as a silent false.
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        totals[field] = null;
        summed.add(field);
        continue;
      }

      if (summed.has(field) && totals[field] === null) continue;

      totals[field] = (totals[field] ?? 0) + value;
      summed.add(field);
    }
  }

  return {
    ...totals,
    unknownCost: usages.filter((usage) => usage.costUsd === null).length,
    unknownTokens: usages.filter((usage) => usage.totalTokens === null).length,
  };
}

/**
 * Judge-human agreement over the calibration subset.
 *
 * Raw agreement plus Cohen's kappa: raw agreement alone looks high whenever one
 * label dominates, which is exactly the calibration set a judge could pass by
 * always answering the same way.
 */
export function judgeHumanAgreement(
  pairs: ReadonlyArray<{ human: PairwiseWinner; judge: PairwiseVerdict }>
): AgreementResult {
  const comparable = pairs.filter((pair) => pair.judge !== 'inconclusive') as Array<{
    human: PairwiseWinner;
    judge: PairwiseWinner;
  }>;

  const skipped = pairs.length - comparable.length;

  if (comparable.length === 0) {
    return { agreement: null, compared: 0, kappa: null, skipped };
  }

  const observed =
    comparable.filter((pair) => pair.human === pair.judge).length / comparable.length;

  const labels: PairwiseWinner[] = ['baseline', 'candidate', 'tie'];
  const expected = labels.reduce((total, label) => {
    const humanShare = comparable.filter((pair) => pair.human === label).length / comparable.length;
    const judgeShare = comparable.filter((pair) => pair.judge === label).length / comparable.length;

    return total + humanShare * judgeShare;
  }, 0);

  return {
    agreement: observed,
    compared: comparable.length,
    // Perfect expected agreement leaves kappa undefined rather than perfect:
    // both raters used one label, so there is no chance-corrected signal.
    kappa: expected === 1 ? null : (observed - expected) / (1 - expected),
    skipped,
  };
}

/**
 * Per-case regression ledger against the previous run's deterministic verdicts.
 *
 * A case the baseline passed and the candidate does not is a regression at any
 * aggregate score, which is why promotion reads this list rather than the mean.
 */
export function buildRegressionLedger(
  baseline: ReadonlyMap<string, 'pass' | 'fail' | 'unverified'>,
  candidate: ReadonlyMap<string, 'pass' | 'fail' | 'unverified'>
): RegressionEntry[] {
  const entries: RegressionEntry[] = [];

  for (const [caseId, baselineStatus] of [...baseline].sort(([left], [right]) =>
    left < right ? -1 : left > right ? 1 : 0
  )) {
    const candidateStatus = candidate.get(caseId);

    if (candidateStatus === undefined) {
      entries.push({ caseId, detail: 'The candidate produced no result for a graded case.' });
      continue;
    }

    if (baselineStatus === 'pass' && candidateStatus !== 'pass') {
      entries.push({
        caseId,
        detail: `Deterministic gates went from pass to ${candidateStatus}.`,
      });
    }
  }

  return entries;
}

/** Nearest-rank percentile over a sorted array. */
function percentile(sorted: readonly number[], fraction: number): number | null {
  if (sorted.length === 0) return null;

  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(fraction * sorted.length) - 1));

  return sorted[index] as number;
}

/** Small, fast, seeded PRNG. Reproducibility is the only requirement here. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;

    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
