import path from 'node:path';

import { assertCrossProvider } from './pairwise-judge.ts';
import { hashContent } from './skill-payload-measurement.ts';

/**
 * Every decision one evaluation run makes, separated from the script that runs it.
 *
 * The runner script is not importable, so while lane selection, case resolution,
 * held-out hash verification, length-control resolution, artifact layout, and the
 * budget stop lived inside it, none of them could be reached by a test — the whole
 * gate rested on code no fixture had ever executed. Everything here is pure: it
 * takes parsed manifests and already-read bodies, touches no filesystem and spawns
 * no process, so `pnpm test` exercises it offline and for free.
 *
 * The script keeps I/O, process control, and rendering. It calls into this module
 * for anything that decides *what* to grade, *where* the artifacts go, or *whether*
 * a run may proceed.
 */
export class OrchestrationError extends Error {}

/** The one arm a non-judging run grades, or the pair a comparison grades. */
export type RunArm = 'baseline' | 'candidate';

export interface LaneDefinition {
  frozen: boolean;
  name: string;
  paidJudging: boolean;
  /** Directory inside the private store holding held-out bodies, when private. */
  source: string | null;
  visibility: 'private' | 'public';
}

export interface ResolvedCase {
  category: string;
  id: string;
  rubricIds: string[];
  seed: number;
  targetPlatform: string;
}

export interface ParsedInvocation {
  /** Restricts the run to one case id, or null for the whole lane. */
  caseId: string | null;
  /** Grades both arms and compares them without calling a paid judge. */
  comparing: boolean;
  /** Runs one lane on both pinned runtimes and reports their divergences. */
  dualRuntime: boolean;
  judging: boolean;
  lane: string;
  /** Raw `--runs-root` value, still to be resolved and guarded by the caller. */
  runsRoot: string | null;
}

export interface JudgeContract {
  hardStopUsd: number;
  judge: { model: string; provider: string };
  models: { authoringAssistance: string; judge: string; subject: string };
  seed: number;
}

/** One side of a dual-runtime portability run, pinned by exact model and effort. */
export interface RuntimeSide {
  /** Reasoning effort as the runtime spells it, recorded in the report verbatim. */
  effort: string;
  /** Stable name for the side, used in artifact paths and the divergence report. */
  id: string;
  model: string;
  provider: string;
}

const defaultLane = 'development';
const armDirectorySeparator = '.';

/**
 * Reads the runner's flags.
 *
 * A flag with a missing or flag-shaped value is an error rather than a silent
 * `null`: `--case` with no argument used to widen the run to every case in the
 * lane, which is the opposite of what the operator asked for.
 */
export function parseEvalInvocation(argv: readonly string[]): ParsedInvocation {
  const comparing = argv.includes('--compare');
  const dualRuntime = argv.includes('--dual-runtime');
  const judging = argv.includes('--judge');

  // `--dual-runtime` grades one skill version on two runtimes; `--judge` and
  // `--compare` grade two skill versions on one runtime. Combining them would
  // ask a single arm layout to mean both things at once.
  if (dualRuntime && (judging || comparing)) {
    throw new OrchestrationError(
      '--dual-runtime compares two runtimes on one skill version and cannot be combined with --judge or --compare, which compare two skill versions on one runtime.'
    );
  }

  return {
    caseId: readFlag(argv, '--case'),
    comparing,
    dualRuntime,
    judging,
    lane: readFlag(argv, '--lane') ?? defaultLane,
    runsRoot: readFlag(argv, '--runs-root'),
  };
}

/** Reads `--flag value`, refusing a flag whose value is absent or another flag. */
export function readFlag(argv: readonly string[], name: string): string | null {
  const index = argv.indexOf(name);

  if (index === -1) return null;

  const value = argv[index + 1];

  if (value === undefined || value.startsWith('--')) {
    throw new OrchestrationError(`${name} needs a value.`);
  }

  return value;
}

/** Resolves the named lane, refusing one the manifest never declared. */
export function selectLane(manifest: Record<string, unknown>, laneName: string): LaneDefinition {
  const lanes = asRecord(manifest.lanes) ?? {};
  const lane = asRecord(lanes[laneName]);

  if (!lane) throw new OrchestrationError(`Case manifest declares no lane "${laneName}".`);

  const visibility = lane.visibility === 'private' ? 'private' : 'public';

  return {
    frozen: lane.frozen === true,
    name: laneName,
    paidJudging: lane.paid_judging === true,
    source: typeof lane.source === 'string' ? lane.source : null,
    visibility,
  };
}

/** The cases in one lane, narrowed to a single id when the operator named one. */
export function selectCaseEntries(
  manifest: Record<string, unknown>,
  laneName: string,
  caseId: string | null
): Array<Record<string, unknown>> {
  const cases = Array.isArray(manifest.cases) ? manifest.cases : [];
  const selected = cases
    .map((entry) => asRecord(entry))
    .filter((entry): entry is Record<string, unknown> => entry !== null)
    .filter((entry) => entry.lane === laneName && (!caseId || entry.id === caseId));

  if (selected.length === 0) {
    throw new OrchestrationError(
      caseId ? `No "${laneName}" case "${caseId}".` : `No cases in lane "${laneName}".`
    );
  }

  return selected;
}

/**
 * Which arms one case contributes.
 *
 * `null` means the case has a single unarmed directory. A comparison — judged or
 * not — needs both arms, because the deterministic regression ledger is a
 * per-case `baseline` against `candidate` and has nothing to compare otherwise.
 */
export function resolveArms(options: {
  comparing: boolean;
  judging: boolean;
}): readonly (RunArm | null)[] {
  return options.judging || options.comparing ? (['baseline', 'candidate'] as const) : [null];
}

/** `<case>` for an unarmed run, `<case>.baseline` / `<case>.candidate` for a pair. */
export function armDirectoryId(caseId: string, arm: RunArm | null): string {
  return arm ? `${caseId}${armDirectorySeparator}${arm}` : caseId;
}

/** Reads a public case, which carries its own body in the manifest. */
export function resolvePublicCase(entry: Record<string, unknown>): ResolvedCase {
  return {
    category: String(entry.category),
    id: String(entry.id),
    rubricIds: readRubricIds(entry.qualitative_rubric),
    seed: Number(entry.seed ?? 1),
    targetPlatform: String(entry.target_platform),
  };
}

/**
 * Reads a held-out case body and refuses one that drifted from its recorded hash.
 *
 * A holdout that silently changed is worse than a missing one: the run still
 * reports a verdict, against different text than the manifest describes. The
 * mismatch invalidates the cycle rather than the case.
 */
export function resolveHeldOutCase(options: {
  body: string;
  id: string;
  parsed: Record<string, unknown>;
  recordedHash: unknown;
}): ResolvedCase {
  const { body, id, parsed, recordedHash } = options;
  const measured = hashContent(body);

  if (measured !== recordedHash) {
    throw new OrchestrationError(
      `Held-out case "${id}" changed: manifest records ${String(recordedHash)}, store measures ${measured}.`
    );
  }

  return {
    category: String(parsed.category),
    id,
    rubricIds: readRubricIds(parsed.qualitative_rubric),
    seed: Number(parsed.seed ?? 1),
    targetPlatform: String(parsed.target_platform),
  };
}

/** Where a held-out body lives inside the private store clone. */
export function heldOutCaseFile(options: {
  id: string;
  laneSource: string | null;
  privatePath: string;
}): string {
  return path.join(options.privatePath, options.laneSource ?? '', `${options.id}.yml`);
}

/**
 * The verbosity control, resolved as a reference to a declared case.
 *
 * It is a reference rather than a case of its own because the control is the
 * *same* task reworded at greater length: giving it a platform and rubric set of
 * its own would measure a different comparison than the one whose verbosity bias
 * it estimates.
 */
export function resolveLengthControlCase(options: {
  baselineManifest: Record<string, any>;
  cases: readonly ResolvedCase[];
  controlId: string;
  laneName: string;
}): ResolvedCase | null {
  const declared = options.baselineManifest.judging?.length_control?.[options.laneName];

  if (typeof declared !== 'string' || declared.trim().length === 0) return null;

  const referenced = options.cases.find((entry) => entry.id === declared.trim());

  if (!referenced) {
    throw new OrchestrationError(
      `judging.length_control.${options.laneName} names "${declared}", which is not a case in lane "${options.laneName}".`
    );
  }

  return { ...referenced, id: options.controlId };
}

/**
 * Lane-scoped artifact root.
 *
 * Both lanes write the same report shape, so a shared path let a later
 * calibration run silently overwrite the acceptance evidence a promotion is then
 * decided on.
 */
export function resolveReportDirectory(options: {
  cycleId: string;
  laneName: string;
  runsRoot: string;
}): string {
  return path.join(options.runsRoot, options.cycleId, options.laneName);
}

/** A dual-runtime run keeps each side's artifacts apart under the lane directory. */
export function resolveRuntimeReportDirectory(options: {
  cycleId: string;
  laneName: string;
  runsRoot: string;
  side: RuntimeSide;
}): string {
  return path.join(resolveReportDirectory(options), 'runtimes', options.side.id);
}

/**
 * Reads the pinned judging contract and refuses the pairings that invalidate it.
 *
 * Three refusals, all before a single call is made: a lane the manifest does not
 * pay to judge, a judge in the subject's own provider family, and a missing
 * contract. The development lane is deliberately excluded — deterministic gates
 * carry its iteration signal for free.
 */
export function resolveJudgeContract(options: {
  baselineManifest: Record<string, any>;
  laneName: string;
}): JudgeContract {
  const block = options.baselineManifest.judging;

  if (!block) throw new OrchestrationError('The baseline manifest pins no judging contract.');

  const paidLanes: string[] = Array.isArray(block.paid_lanes) ? block.paid_lanes : [];

  if (!paidLanes.includes(options.laneName)) {
    throw new OrchestrationError(
      `Lane "${options.laneName}" is not a paid judging lane (${paidLanes.join(', ')}). The development lane is covered by deterministic gates, which carry the iteration signal for free.`
    );
  }

  assertCrossProvider(block.subject.provider, block.judge.provider);

  return {
    hardStopUsd: Number(block.budget?.hard_stop_usd ?? 0),
    judge: block.judge,
    models: {
      authoringAssistance: String(block.authoring_assistance ?? 'undisclosed'),
      judge: `${block.judge.provider}/${block.judge.model}`,
      subject: `${block.subject.provider}/${block.subject.model}`,
    },
    seed: Number(block.thresholds?.bootstrap_seed ?? 1),
  };
}

/**
 * The two runtimes a portability run exercises, pinned by exact model and effort.
 *
 * Derived from the same `judging` block rather than a parallel list, so the
 * runtimes a portability run compares can never drift from the ones the cycle is
 * pinned to. Both sides run at high reasoning effort because the question is
 * whether the *instruction* reads the same on each runtime, and a low-effort
 * collapse would answer a different question.
 *
 * Same-family sides are refused: two members of one family are one runtime with
 * two names, and a review over them would report portability it never tested.
 */
export function resolveRuntimeSides(options: {
  baselineManifest: Record<string, any>;
  effort?: string;
}): RuntimeSide[] {
  const block = options.baselineManifest.judging;

  if (!block?.subject?.model || !block?.judge?.model) {
    throw new OrchestrationError(
      'A dual-runtime run needs judging.subject and judging.judge pinned in the baseline manifest; it runs the promoted skill on both.'
    );
  }

  const effort = options.effort ?? 'high';

  assertCrossProvider(block.subject.provider, block.judge.provider);

  return [
    {
      effort,
      id: sideId(String(block.subject.provider), String(block.subject.model)),
      model: String(block.subject.model),
      provider: String(block.subject.provider),
    },
    {
      effort,
      id: sideId(String(block.judge.provider), String(block.judge.model)),
      model: String(block.judge.model),
      provider: String(block.judge.provider),
    },
  ];
}

/**
 * Whether a reported judging cost passed the hard stop.
 *
 * An unknown total is never treated as a run that was free: subscription auth
 * reports no cost at all, so `null` means unmeasured, not zero.
 */
export function budgetStopExceeded(costUsd: number | null, hardStopUsd: number): boolean {
  return costUsd !== null && costUsd > hardStopUsd;
}

function sideId(provider: string, model: string): string {
  return `${provider}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function readRubricIds(value: unknown): string[] {
  return Array.isArray(value) ? value.map((entry) => String(entry)) : [];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
