/**
 * The shape every deterministic gate reports, whatever tier produced it.
 *
 * `unverified` is a first-class outcome, not a soft pass. A missing browser or
 * absent native toolchain must reach the report as "not checked" so a run that
 * verified nothing can never be read as a run that verified everything.
 */
export type GateStatus = 'pass' | 'fail' | 'unverified';

export type GateSeverity = 'critical' | 'high' | 'medium';

/** Which mechanism produced a result, mirroring the contract's tier column. */
export type VerificationTier = 'static' | 'render-gated' | 'compile-tier' | 'human-review';

export interface GateResult {
  /** Registry id from `evals/<skill>/eval-contract.md`, e.g. `INV-A11Y-001`. */
  invariant: string;
  /** Human-readable cause, always populated for `fail` and `unverified`. */
  detail: string;
  /** Machine-readable evidence: measured ratios, sizes, selectors, paths. */
  evidence: string[];
  severity: GateSeverity;
  status: GateStatus;
  tier: VerificationTier;
}

export interface GateSummary {
  /**
   * Whether this run may be promoted. One `critical` blocks, one `high` blocks,
   * and a gate that never ran blocks too — an unchecked run is not a clean one.
   * `medium` is reported and never blocks, because a raw literal is a coherence
   * smell, and failing correct work on one is the gate theater this registry
   * exists to avoid.
   */
  blocking: boolean;
  criticalFailures: number;
  failed: number;
  highFailures: number;
  /** Failures that are reported but do not block promotion on their own. */
  mediumFailures: number;
  passed: number;
  /** What the run observed. `fail` whenever any gate failed, at any severity. */
  status: GateStatus;
  total: number;
  unverified: number;
}

/**
 * Collapses results into one verdict.
 *
 * Critical failures are never averaged away: the contract makes severity
 * `critical` blocking on its own, so aggregation is a max over severity rather
 * than a mean over scores. `unverified` results degrade the verdict to
 * `unverified` when nothing failed, because a clean report from gates that
 * never ran is the failure mode this whole phase exists to prevent.
 *
 * `status` and `blocking` answer different questions and are both needed.
 * `status` is what the run observed; `blocking` is whether it may be promoted.
 * They diverge on exactly one case — a `medium` failure alone — which the
 * contract reports and does not gate on.
 */
export function summarizeGateResults(results: readonly GateResult[]): GateSummary {
  const failures = results.filter((result) => result.status === 'fail');
  const unverified = results.filter((result) => result.status === 'unverified').length;
  const criticalFailures = failures.filter((result) => result.severity === 'critical').length;
  const highFailures = failures.filter((result) => result.severity === 'high').length;

  const mediumFailures = failures.filter((result) => result.severity === 'medium').length;

  let status: GateStatus = 'pass';

  // No results is not a pass. An empty registry means nothing was checked, and
  // reporting that as success is the inversion this phase exists to prevent.
  if (results.length === 0) status = 'unverified';
  else if (failures.length > 0) status = 'fail';
  else if (unverified > 0) status = 'unverified';

  return {
    blocking: criticalFailures > 0 || highFailures > 0 || unverified > 0 || results.length === 0,
    criticalFailures,
    failed: failures.length,
    highFailures,
    mediumFailures,
    passed: results.filter((result) => result.status === 'pass').length,
    status,
    total: results.length,
    unverified,
  };
}

/** Convenience constructor keeping the reason attached to every non-pass. */
export function gateResult(
  invariant: string,
  severity: GateSeverity,
  tier: VerificationTier,
  status: GateStatus,
  detail: string,
  evidence: string[] = []
): GateResult {
  return { detail, evidence, invariant, severity, status, tier };
}
