import type { GateResult, GateSeverity } from './gate-result.ts';

/**
 * Compares one skill version's behavior across two runtimes and names where they
 * disagree.
 *
 * This asks a different question from the A/B cycle. That one asks whether a skill
 * change helped; this one asks whether the *same* skill behaves equivalently on the
 * runtimes it is published for. A skill that only produces good output on one
 * runtime is a defective public product, and the defect is usually an instruction
 * that admits more than one reading rather than a difference between models.
 *
 * Governing rule, enforced by `reviewProposedFix`: when two runtimes diverge, fix
 * the ambiguity in the skill. Never tune the skill toward whichever runtime the
 * maintainer prefers, and never edit the shipped skill from inside a review — a
 * fix is a case in the next cycle, which passes the normal gates and promotion.
 *
 * Classification reads only anonymous side keys, gate results, loaded references,
 * and cited sources. `renderDivergenceReport` prints the divergences first and the
 * runtime identity table after them, so a reader does not read results through a
 * runtime preference.
 */
export class DivergenceReportError extends Error {}

export type DivergenceClass =
  'boundary' | 'effort' | 'gate' | 'platform' | 'routing' | 'source' | 'taste';

/** What one runtime did with one case, as the grader and the transcript observed it. */
export interface RuntimeObservation {
  /** Registered source URLs the run cited, in the order it cited them. */
  citedSources?: readonly string[];
  /** Reasoning effort as the runtime spells it. */
  effort: string;
  gates: readonly GateResult[];
  /** Reference file names the run loaded, e.g. `platform-web-foundations-and-motion.md`. */
  loadedReferences?: readonly string[];
  model: string;
  provider: string;
  /** Opaque side key. Classification reads this and never the model name. */
  side: string;
}

export interface Divergence {
  class: DivergenceClass;
  evidence: string[];
  /** Severity of the gate the divergence rests on; null when it rests on none. */
  severity: GateSeverity | null;
  /** The instruction-level change the class table prescribes for this signal. */
  suggestedResponse: string;
  summary: string;
}

export interface DivergenceReport {
  caseId: string;
  divergences: Divergence[];
  /** True when a runtime produced no observation, so the review covers one side. */
  partial: boolean;
  runtimes: Array<{ effort: string; model: string; provider: string; side: string }>;
  /**
   * Signal families neither side supplied, named with the classes that rest on
   * them. A review that compared only gates must not read as agreement about
   * reference routing it never observed.
   */
  unobservedSignals: string[];
}

/** A fix a reviewer proposes after reading a divergence. */
export interface ProposedFix {
  divergenceClass: DivergenceClass;
  /** Repository-relative path the fix would edit. */
  file: string;
  /**
   * Why the fix is proposed. `ambiguous-instruction` is the only admissible
   * reason; `preferred-runtime` is the overfitting this phase exists to refuse.
   */
  justification: 'ambiguous-instruction' | 'preferred-runtime';
  rationale: string;
}

export interface FixReview {
  accepted: boolean;
  /** Populated whenever `accepted` is false; the reason is always stated. */
  refusal: string | null;
}

/** The boundary invariant. A divergence on it is a role failure, not a gate nit. */
const boundaryInvariant = 'INV-SCOPE-001';
/** The source invariant. A divergence on it means one side adopted a page. */
const sourceInvariant = 'INV-SOURCE-001';
const platformReferencePrefix = 'platform-';
const shippedSkillRoot = 'skills/';

const responses: Record<DivergenceClass, string> = {
  boundary: 'Strengthen the scope wording and the forbidden-import gate.',
  effort: 'Record as a tier-robustness finding; do not tune for the higher tier.',
  gate: 'Make the requirement explicit rather than implied.',
  platform: 'Make the platform router explicit.',
  routing: 'Sharpen the routing condition.',
  source: 'Tighten the source lane wording.',
  taste: 'Judge on the calibration rubric; only then consider guidance changes.',
};

/**
 * Ranked most actionable first: a boundary or platform failure is a role or
 * router defect, a gate failure is an unstated requirement, and taste is last
 * because it is the only class whose signal is not objective.
 */
const classRank: Record<DivergenceClass, number> = {
  boundary: 0,
  platform: 1,
  source: 2,
  gate: 3,
  routing: 4,
  effort: 5,
  taste: 6,
};

const severityRank: Record<GateSeverity, number> = { critical: 0, high: 1, medium: 2 };

/**
 * Builds the review for one case.
 *
 * A missing side is reported as a partial review rather than dropped: preserving
 * the artifacts and saying plainly that one runtime never answered is honest,
 * while classifying a one-sided run would invent agreement out of absence.
 */
export function buildDivergenceReport(options: {
  caseId: string;
  observations: readonly RuntimeObservation[];
  /** Sources the skill's registry declares; anything else is an adopted source. */
  registeredSources?: readonly string[];
  /** Qualitative differences a reviewer recorded where the gates agreed. */
  tasteNotes?: readonly string[];
}): DivergenceReport {
  const { caseId, observations } = options;

  if (observations.length === 0) {
    throw new DivergenceReportError(
      `No runtime produced an observation for "${caseId}"; there is nothing to compare.`
    );
  }

  const runtimes = observations.map((observation) => ({
    effort: observation.effort,
    model: observation.model,
    provider: observation.provider,
    side: observation.side,
  }));

  if (observations.length === 1) {
    return {
      caseId,
      divergences: [],
      partial: true,
      runtimes,
      unobservedSignals: findUnobservedSignals(observations),
    };
  }

  if (observations.length > 2) {
    throw new DivergenceReportError(
      `A divergence review compares exactly two runtimes; "${caseId}" supplied ${observations.length}.`
    );
  }

  return {
    caseId,
    divergences: classifyDivergences(options),
    partial: false,
    runtimes,
    unobservedSignals: findUnobservedSignals(observations),
  };
}

/**
 * Names the signal families no side reported.
 *
 * Three of the seven classes rest on transcript signals rather than on gates.
 * When a caller supplies gates alone — as the runner currently does — those
 * classes cannot fire, and silence from them is absence of measurement, not
 * agreement. The review states which ones it never compared.
 */
function findUnobservedSignals(observations: readonly RuntimeObservation[]): string[] {
  const unobserved: string[] = [];

  if (observations.every((observation) => (observation.loadedReferences ?? []).length === 0)) {
    unobserved.push('loaded references (`routing`, `platform`)');
  }

  if (observations.every((observation) => (observation.citedSources ?? []).length === 0)) {
    unobserved.push('cited sources (`source`)');
  }

  return unobserved;
}

/** The class table, applied to a pair of observations. */
export function classifyDivergences(options: {
  observations: readonly RuntimeObservation[];
  registeredSources?: readonly string[];
  tasteNotes?: readonly string[];
}): Divergence[] {
  const [left, right] = options.observations;

  if (!left || !right) {
    throw new DivergenceReportError('Classification needs two observations.');
  }

  const divergences: Divergence[] = [
    ...classifyReferenceDivergence(left, right),
    ...classifySourceDivergence(left, right, options.registeredSources ?? []),
    ...classifyGateDivergence(left, right),
  ];

  // Taste is only a finding where nothing objective separated the sides. A
  // qualitative note recorded next to a failing gate is a description of that
  // gate, and reporting it twice inflates the divergence count.
  if (divergences.length === 0) {
    for (const note of options.tasteNotes ?? []) {
      divergences.push({
        class: 'taste',
        evidence: [`${left.side} vs ${right.side}`],
        severity: null,
        suggestedResponse: responses.taste,
        summary: note,
      });
    }
  }

  return divergences.sort(compareDivergences);
}

/**
 * Refuses the two ways a portability review stops being one.
 *
 * A fix that edits the shipped skill makes the review a change, unreviewed and
 * ungated. A fix justified by which runtime scored better is overfitting: it
 * makes the skill agree with the maintainer's preferred runtime instead of
 * removing the ambiguity both runtimes read differently.
 */
export function reviewProposedFix(fix: ProposedFix): FixReview {
  const normalized = fix.file.replace(/\\/g, '/').replace(/^\.\//, '');

  if (normalized.startsWith(shippedSkillRoot)) {
    return {
      accepted: false,
      refusal: `A portability review may not edit the shipped skill (${fix.file}); the fix enters the next cycle as a failing development case, which passes the normal gates and promotion.`,
    };
  }

  if (fix.justification === 'preferred-runtime') {
    return {
      accepted: false,
      refusal:
        'The fix is justified by which runtime performed better, which tunes the skill toward one runtime; an accepted fix must name the ambiguity both runtimes read differently.',
    };
  }

  return { accepted: true, refusal: null };
}

export function renderDivergenceReport(report: DivergenceReport): string {
  const lines: string[] = [`# Cross-runtime divergence — \`${report.caseId}\``, ''];

  if (report.partial) {
    lines.push(
      `**PARTIAL** — only ${report.runtimes.length} of 2 runtimes produced an observation. Artifacts are preserved; no divergence was classified.`,
      ''
    );
  } else if (report.divergences.length === 0) {
    lines.push(
      '**NO DIVERGENCE** — both runtimes agreed on every signal this review compared.',
      ''
    );
  } else {
    lines.push(
      `**${report.divergences.length} divergence(s)**, most actionable first.`,
      '',
      '| Class | Severity | Finding | Proposed instruction fix | Evidence |',
      '| --- | --- | --- | --- | --- |'
    );

    for (const divergence of report.divergences) {
      lines.push(
        `| \`${divergence.class}\` | ${divergence.severity ?? '—'} | ${divergence.summary} | ${divergence.suggestedResponse} | ${divergence.evidence.join('; ')} |`
      );
    }

    lines.push('');
  }

  if (report.unobservedSignals.length > 0) {
    lines.push(
      `**Not compared** — no side reported ${report.unobservedSignals.join(' or ')}, so the classes resting on them were never tested. Their silence is unmeasured, not agreement.`,
      ''
    );
  }

  // Deliberately last. Naming the runtimes above the findings invites the
  // reader to read every difference as the preferred runtime being right.
  lines.push(
    '## Runtimes',
    '',
    '| Side | Provider | Model | Effort |',
    '| --- | --- | --- | --- |'
  );

  for (const runtime of report.runtimes) {
    lines.push(
      `| \`${runtime.side}\` | ${runtime.provider} | \`${runtime.model}\` | ${runtime.effort} |`
    );
  }

  return `${lines.join('\n')}\n`;
}

function classifyReferenceDivergence(
  left: RuntimeObservation,
  right: RuntimeObservation
): Divergence[] {
  const leftReferences = new Set(left.loadedReferences ?? []);
  const rightReferences = new Set(right.loadedReferences ?? []);
  const onlyLeft = [...leftReferences].filter((entry) => !rightReferences.has(entry));
  const onlyRight = [...rightReferences].filter((entry) => !leftReferences.has(entry));

  if (onlyLeft.length === 0 && onlyRight.length === 0) return [];

  // A platform reference is the router's answer, so a difference there is the
  // router being ambiguous rather than a condition being loose.
  const platform = [...onlyLeft, ...onlyRight].some((entry) =>
    entry.startsWith(platformReferencePrefix)
  );

  return [
    {
      class: platform ? 'platform' : 'routing',
      evidence: [
        ...onlyLeft.map((entry) => `${left.side} only: ${entry}`),
        ...onlyRight.map((entry) => `${right.side} only: ${entry}`),
      ],
      severity: null,
      suggestedResponse: platform ? responses.platform : responses.routing,
      summary: platform
        ? 'The runtimes routed to different platform references for the same target.'
        : 'The runtimes loaded different references for the same task.',
    },
  ];
}

function classifySourceDivergence(
  left: RuntimeObservation,
  right: RuntimeObservation,
  registered: readonly string[]
): Divergence[] {
  const known = new Set(registered);
  const unregistered = (observation: RuntimeObservation): string[] =>
    (observation.citedSources ?? []).filter((entry) => !known.has(entry));

  const leftAdopted = unregistered(left);
  const rightAdopted = unregistered(right);

  if (leftAdopted.length === 0 && rightAdopted.length === 0) return [];

  return [
    {
      class: 'source',
      evidence: [
        ...leftAdopted.map((entry) => `${left.side} adopted: ${entry}`),
        ...rightAdopted.map((entry) => `${right.side} adopted: ${entry}`),
      ],
      severity: null,
      suggestedResponse: responses.source,
      summary: 'A runtime cited a source the skill registry does not declare.',
    },
  ];
}

function classifyGateDivergence(left: RuntimeObservation, right: RuntimeObservation): Divergence[] {
  // Same model at two efforts is one runtime asked twice, so a gate difference
  // there is tier robustness, not portability.
  const sameRuntime = left.provider === right.provider && left.model === right.model;
  const effortDivergence = sameRuntime && left.effort !== right.effort;
  const leftGates = indexGates(left.gates);
  const rightGates = indexGates(right.gates);
  const divergences: Divergence[] = [];

  for (const invariant of [...new Set([...leftGates.keys(), ...rightGates.keys()])].sort()) {
    const leftGate = leftGates.get(invariant);
    const rightGate = rightGates.get(invariant);

    if (leftGate?.status === rightGate?.status) continue;

    const severity = leftGate?.severity ?? rightGate?.severity ?? 'medium';
    const divergenceClass: DivergenceClass = effortDivergence
      ? 'effort'
      : invariant === boundaryInvariant
        ? 'boundary'
        : invariant === sourceInvariant
          ? 'source'
          : 'gate';

    divergences.push({
      class: divergenceClass,
      evidence: [`${left.side}: ${describe(leftGate)}`, `${right.side}: ${describe(rightGate)}`],
      severity,
      suggestedResponse: responses[divergenceClass],
      summary:
        divergenceClass === 'boundary'
          ? `One runtime left the presentational boundary (\`${invariant}\`).`
          : `The runtimes disagree on \`${invariant}\`.`,
    });
  }

  return divergences;
}

function describe(gate: GateResult | undefined): string {
  return gate ? `${gate.status}${gate.detail ? ` — ${gate.detail}` : ''}` : 'not reported';
}

function indexGates(gates: readonly GateResult[]): Map<string, GateResult> {
  return new Map(gates.map((gate) => [gate.invariant, gate]));
}

function compareDivergences(left: Divergence, right: Divergence): number {
  const byClass = classRank[left.class] - classRank[right.class];

  if (byClass !== 0) return byClass;

  const leftSeverity = left.severity ? severityRank[left.severity] : 3;
  const rightSeverity = right.severity ? severityRank[right.severity] : 3;

  return leftSeverity - rightSeverity || left.summary.localeCompare(right.summary);
}
