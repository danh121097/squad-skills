import { summarizeGateResults, type GateResult, type GateSummary } from './gate-result.ts';
import { hashContent } from './skill-payload-measurement.ts';

export interface CaseRunResult {
  /**
   * Which side of a pairwise run produced this result, when there was one. A
   * judged run grades the same case twice, so the case id alone stops being
   * unique and the report has to say which artifact each row measured.
   */
  arm?: 'baseline' | 'candidate';
  caseId: string;
  category: string;
  lane: string;
  results: GateResult[];
  /** Path relative to the project root, so the report stays machine-independent. */
  runDirectory: string;
  targetPlatform: string;
}

/**
 * What the report needs to be reproducible. Deliberately no timestamp and no
 * absolute path: the contract requires that rerunning the same artifact with the
 * same config yields an identical result and hash, and a clock reading would
 * break that on the first rerun.
 *
 * The environment is inside the hash on purpose, so two hashes match only when
 * the same artifact was checked the same way. A different Node or browser build
 * is a different verification and gets a different hash — that is a signal to
 * compare, not a reproducibility failure.
 */
export interface EvalRunEnvironment {
  cycleId: string;
  /** Digest of the case manifest, so a case edit is visible in the hash. */
  caseManifestHash: string;
  nodeVersion: string;
  /** Digest of the governing skill's shipped payload at run time. */
  payloadHash: string;
  /**
   * Named browser build used by the render-gated cases in this run, or `absent`
   * when nothing rendered. Run-level, not per-case: it identifies the build, and
   * it is never evidence that a given case rendered. Whether a case was measured
   * is carried by that case's own gate results.
   */
  renderer: string;
}

export interface EvalRunReport {
  cases: CaseRunResult[];
  environment: EvalRunEnvironment;
  reportHash: string;
  summary: GateSummary;
}

/**
 * Aggregates case results into one verdict plus a reproducible hash.
 *
 * Aggregation is a max over severity, never a mean over scores: the contract
 * makes a critical invariant blocking on its own, so a run that improved
 * everywhere else still fails. That is the whole point of separating
 * deterministic gates from Phase 5 judging.
 */
export function buildEvalRunReport(
  environment: EvalRunEnvironment,
  cases: readonly CaseRunResult[]
): EvalRunReport {
  // Code-unit ordering, matching `sortResults`: this order feeds the hash, and
  // `localeCompare` is locale-dependent, so the same run could hash differently
  // under a different ICU build.
  const sortedCases = [...cases]
    .sort(
      (left, right) =>
        compare(left.caseId, right.caseId) || compare(left.arm ?? '', right.arm ?? '')
    )
    .map((entry) => ({ ...entry, results: sortResults(entry.results) }));

  const summary = summarizeGateResults(sortedCases.flatMap((entry) => entry.results));
  const body = { cases: sortedCases, environment, summary };

  return { ...body, reportHash: hashContent(canonicalize(body)) };
}

/**
 * Recomputes the hash a deterministic report carries, over the report itself.
 *
 * The judging half of a promotion has always been checked this way; this half
 * was read as a bare boolean, so a hand-written `--report` naming no cases at
 * all passed as clean deterministic evidence.
 *
 * This is a check against stale, mixed-up and hand-edited artifacts, which is
 * what actually goes wrong in a maintainer-run rig. It is deliberately not
 * authentication: the digest is unkeyed, so anyone who can edit the body can
 * recompute it. Making promotion unforgeable needs a signature or a CI
 * attestation, which is a different decision than this one.
 */
export function verifyEvalRunReportHash(report: EvalRunReport): boolean {
  const { cases, environment, summary } = report;

  return hashContent(canonicalize({ cases, environment, summary })) === report.reportHash;
}

/** Per-case verdict, used by the Markdown renderer and by callers gating a promotion. */
export function summarizeCase(entry: CaseRunResult): GateSummary {
  return summarizeGateResults(entry.results);
}

export function renderMarkdownReport(report: EvalRunReport): string {
  const { environment, summary } = report;
  const lines = [
    `# squad-designer deterministic gate report`,
    '',
    `- cycle: \`${environment.cycleId}\``,
    `- node: \`${environment.nodeVersion}\``,
    `- renderer: \`${environment.renderer}\``,
    `- skill payload: \`${environment.payloadHash}\``,
    `- case manifest: \`${environment.caseManifestHash}\``,
    `- report hash: \`${report.reportHash}\``,
    '',
    `**${summary.status.toUpperCase()}** — ${summary.passed} passed, ${summary.failed} failed ` +
      `(${summary.criticalFailures} critical, ${summary.highFailures} high, ${summary.mediumFailures} medium), ` +
      `${summary.unverified} unverified. ` +
      `${summary.blocking ? 'Blocks promotion.' : 'Does not block promotion.'}`,
    '',
  ];

  for (const entry of report.cases) {
    const caseSummary = summarizeCase(entry);

    lines.push(
      `## ${entry.caseId}${entry.arm ? ` (${entry.arm})` : ''} — ${caseSummary.status}`,
      '',
      `lane \`${entry.lane}\` · category \`${entry.category}\` · platform \`${entry.targetPlatform}\` · artifacts \`${entry.runDirectory}\``,
      '',
      '| Invariant | Severity | Tier | Status | Detail |',
      '| --- | --- | --- | --- | --- |'
    );

    for (const result of entry.results) {
      lines.push(
        `| \`${result.invariant}\` | ${result.severity} | ${result.tier} | ${result.status} | ${escapeCell(result.detail)} |`
      );
    }

    lines.push('');

    const evidence = entry.results.filter(
      (result) => result.status !== 'pass' && result.evidence.length > 0
    );

    if (evidence.length === 0) continue;

    lines.push('<details><summary>Measurements</summary>', '');

    for (const result of evidence) {
      lines.push(`- \`${result.invariant}\``);
      for (const item of result.evidence) lines.push(`  - ${item}`);
    }

    lines.push('', '</details>', '');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

/**
 * Failures first, then unverified, so a reader sees what blocks before what
 * passed.
 *
 * The tie-break runs past the invariant id because one id can report twice:
 * `INV-COMPILE-001` produces a compile-tier and a human-review result for
 * SwiftUI and Compose, commonly with the same status. Ordering them by id alone
 * left their relative order to the input, which moved the report hash for
 * identical content — the one thing the hash exists to rule out.
 */
function sortResults(results: readonly GateResult[]): GateResult[] {
  const rank = { fail: 0, pass: 2, unverified: 1 } as const;

  return [...results].sort(
    (left, right) =>
      rank[left.status] - rank[right.status] ||
      compare(left.invariant, right.invariant) ||
      compare(left.tier, right.tier) ||
      compare(left.status, right.status) ||
      compare(left.detail, right.detail)
  );
}

/**
 * Code-unit ordering, not `localeCompare`: canonical order feeds a hash, and
 * collation depends on the runtime's ICU data rather than on the content.
 */
function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/** Key-sorted JSON so an unrelated property order cannot move the report hash. */
function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => compare(left, right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`);

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value) ?? 'null';
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/[\n\r]/g, ' ');
}
