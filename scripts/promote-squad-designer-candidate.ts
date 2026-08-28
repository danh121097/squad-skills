import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { parseDocument } from 'yaml';

import { verifyJudgingReportHash, type JudgingReport } from '../src/eval/judging-report.ts';
import {
  evaluatePromotion,
  renderPromotionDecision,
  type PromotionInput,
} from '../src/eval/promotion-gate.ts';
import { measureSkillPayload } from '../src/eval/skill-payload-measurement.ts';
import type { EvalRunReport } from '../src/eval/eval-run-report.ts';

/**
 * Decides whether a candidate may be promoted, and changes nothing either way.
 *
 * The separation is the point. A gate that also applies the diff has to be
 * trusted to stop halfway when a provider dies mid-run; a gate that only
 * answers cannot leave a half-promoted skill behind. Applying the approved
 * diff, bumping the major version, and running `pnpm test` stay in the normal
 * workflow, which this command reports on rather than replaces.
 */
const skill = 'squad-designer';
const evalDirectory = path.join('evals', skill);
const projectRoot = process.cwd();

const baselineManifest = parseDocument(
  await readFile(path.join(projectRoot, evalDirectory, 'baseline-manifest.yml'), 'utf8')
).toJS() as Record<string, Record<string, any>>;

const cycleId = String(
  parseDocument(
    await readFile(path.join(projectRoot, evalDirectory, 'case-manifest.yml'), 'utf8')
  ).toJS().cycle_id
);

// The held-out lane, from the contract. A calibration run writes the same
// report shape, so the lane a promotion reads is named rather than inferred.
const promotionLane = String(baselineManifest.judging?.promotion_lane ?? 'acceptance');
const runDirectory = path.join(
  projectRoot,
  readFlag('--runs-root') ?? '.eval-runs',
  cycleId,
  promotionLane
);

const gateReport = await readJson<EvalRunReport>(
  readFlag('--report') ?? path.join(runDirectory, 'report.json')
);
const judgingReport = await readJson<JudgingReport>(
  readFlag('--judging') ?? path.join(runDirectory, 'judging.json')
);
const approvalSource = await readText(
  readFlag('--approval') ?? path.join(runDirectory, 'promotion-approval.yml')
);

if (!gateReport) {
  console.error('No deterministic gate report; run `pnpm eval:designer` before promoting.');
  process.exit(1);
}

if (!judgingReport) {
  console.error('No judging report; a promotion needs both halves of the evidence.');
  process.exit(1);
}

// Recomputed, not read. The report body is the evidence; without this check a
// hand-written `judging.json` passed to `--judging` is accepted verbatim, and
// the interval a promotion turns on is whatever someone typed.
if (!verifyJudgingReportHash(judgingReport)) {
  console.error(
    'The judging report does not match its own recorded hash; it was edited after the run that produced it.'
  );
  process.exit(1);
}

if (judgingReport.cycleId !== cycleId) {
  console.error(
    `The judging report belongs to cycle "${judgingReport.cycleId}", not the current "${cycleId}".`
  );
  process.exit(1);
}

const thresholds = baselineManifest.judging?.thresholds ?? {};
const input: PromotionInput = {
  approvalSource,
  baselineVersion: String(baselineManifest.skills?.[skill]?.version ?? ''),
  budgetRegression: await measureBudgetRegression(),
  calibration: judgingReport.calibration,
  // Defaults chosen so a malformed threshold refuses rather than passes: `NaN`
  // makes every comparison false, which would silently switch two gates off.
  calibrationMinimumAgreement: threshold('minimum_judge_human_agreement', 1),
  calibrationMinimumPairs: threshold('minimum_calibration_pairs', Number.POSITIVE_INFINITY),
  candidateVersion: await readSkillVersion(),
  cycleId,
  deterministicBlocking: gateReport.summary.blocking,
  equivalenceBoundary: threshold('equivalence_boundary', Number.POSITIVE_INFINITY),
  interval: judgingReport.interval,
  judgedLane: judgingReport.lane,
  judgingReportHash: judgingReport.reportHash,
  lengthControl: judgingReport.lengthControl,
  outcomes: judgingReport.outcomes,
  promotionLane,
  regressions: judgingReport.regressions,
  staleKnowledgeCards: await findStaleKnowledgeCards(),
  thresholdRegistered: thresholds.registered === true,
};

const decision = evaluatePromotion(input);

console.log(renderPromotionDecision(decision, skill));
process.exit(decision.approved ? 0 : 1);

/** A threshold that is missing or not a finite number falls back to refusing. */
function threshold(name: string, fallback: number): number {
  const value = Number(thresholds[name]);

  return Number.isFinite(value) ? value : fallback;
}

/**
 * The measured budget against the recorded ceiling.
 *
 * A candidate that judges better while loading more context per task has moved
 * the cost, not only the quality, so the ceiling is part of the promotion
 * decision rather than a separate report nobody reads at this moment.
 */
async function measureBudgetRegression(): Promise<string | null> {
  const reference = baselineManifest.phase_1_reference?.[skill];

  if (!reference) return null;

  const measurement = await measureSkillPayload({
    skillRoot: path.join(projectRoot, 'skills', skill),
    taskTypes:
      (baselineManifest.task_types as unknown as Array<{
        id: string;
        references: string[];
      }>) ?? [],
  });

  const breaches = [
    ['entrypoint_words', measurement.entrypointWords, Number(reference.entrypoint_words)],
    ['median_loaded_words', measurement.medianLoadedWords, Number(reference.median_loaded_words)],
  ].filter(([, measured, ceiling]) => (measured as number) > (ceiling as number));

  return breaches.length === 0
    ? null
    : breaches
        .map(
          ([field, measured, ceiling]) => `${field} measured ${measured} against ceiling ${ceiling}`
        )
        .join('; ');
}

/**
 * Cards whose freshness has lapsed.
 *
 * A promotion consumes the knowledge the cards carry, so a card past its own
 * declared expiry is a source nobody has confirmed still says what it said.
 */
async function findStaleKnowledgeCards(): Promise<string[]> {
  const directory = path.join(projectRoot, evalDirectory, 'knowledge');
  const today = new Date().toISOString().slice(0, 10);
  const stale: string[] = [];

  let entries;

  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return stale;
  }

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

    const source = await readFile(path.join(directory, entry.name), 'utf8');
    const expiry = /^freshness_expires_on:\s*(\S+)/m.exec(source)?.[1];

    if (expiry && expiry < today) stale.push(entry.name.replace(/\.md$/, ''));
  }

  return stale.sort();
}

async function readSkillVersion(): Promise<string> {
  const source = await readFile(path.join(projectRoot, 'skills', skill, 'SKILL.md'), 'utf8');

  return /^\s*version:\s*"?([^"\n]+)"?/m.exec(source)?.[1]?.trim() ?? '';
}

async function readJson<T>(file: string): Promise<T | null> {
  const source = await readText(file);

  if (source === null) return null;

  try {
    return JSON.parse(source) as T;
  } catch {
    console.error(`${file} is not valid JSON.`);
    process.exit(1);
  }
}

async function readText(file: string): Promise<string | null> {
  try {
    return await readFile(file, 'utf8');
  } catch {
    return null;
  }
}

function readFlag(name: string): string | null {
  const index = process.argv.indexOf(name);

  if (index === -1) return null;

  const value = process.argv[index + 1];

  if (value === undefined || value.startsWith('--')) {
    console.error(`${name} needs a value.`);
    process.exit(1);
  }

  return value;
}
