import { spawn } from 'node:child_process';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { parseDocument } from 'yaml';

import { createClaudeJudgeRunner } from '../src/eval/claude-judge-client.ts';
import { createCodexJudgeRunner } from '../src/eval/codex-judge-client.ts';
import { rubricOutputSchema } from '../src/eval/judge-response-parser.ts';
import { validateJudgingContract } from '../src/eval/judging-contract-validator.ts';
import {
  buildDivergenceReport,
  portabilityReviewBlocks,
  renderDivergenceReport,
  type RuntimeObservation,
} from '../src/eval/cross-runtime-divergence-report.ts';
import { approvedDependenciesFor } from '../src/eval/approved-dependency-registry.ts';
import { hashCandidateArtifact } from '../src/eval/candidate-artifact-hash.ts';
import { buildRegressionLedger } from '../src/eval/eval-statistics.ts';
import { resolveHeldOutCaseFile } from '../src/eval/held-out-store-access.ts';
import {
  armDirectoryId,
  budgetStopExceeded,
  OrchestrationError,
  parseEvalInvocation,
  resolveArms,
  resolveHeldOutCase,
  resolveJudgeContract,
  resolveLengthControlCase as resolveDeclaredLengthControl,
  resolvePublicCase,
  resolveReportDirectory,
  resolveRuntimeReportDirectory,
  resolveRuntimeSides,
  selectCaseEntries,
  selectLane,
  type JudgeContract,
  type ResolvedCase,
  type RuntimeSide,
} from '../src/eval/eval-run-orchestration.ts';
import {
  buildEvalRunReport,
  renderMarkdownReport,
  summarizeCase,
  type CaseRunResult,
} from '../src/eval/eval-run-report.ts';
import {
  assertWritable,
  resolveRunDirectory,
  runsRootName,
  RunDirectoryError,
} from '../src/eval/eval-run-directory.ts';
import { gateResult, type GateResult, type GateStatus } from '../src/eval/gate-result.ts';
import { renderJudgingReport } from '../src/eval/judging-report.ts';
import { runJudging, type JudgingCaseInput } from '../src/eval/judging-orchestrator.ts';
import { runNativeCompileGate, type CommandOutcome } from '../src/eval/native-compile-gate.ts';
import {
  providerFamily,
  type JudgeRunner,
  type PairwiseWinner,
} from '../src/eval/pairwise-judge.ts';
import { renderCandidate } from '../src/eval/playwright-render-harness.ts';
import {
  runPresentationalStaticGates,
  type CandidateFile,
} from '../src/eval/presentational-output-static-gates.ts';
import { runRenderedUiGates } from '../src/eval/rendered-ui-gate-runner.ts';
import { minimumTargetSize } from '../src/eval/rendered-ui-snapshot.ts';
import { hashContent, measureSkillPayload } from '../src/eval/skill-payload-measurement.ts';

/**
 * Grades candidate presentational output against the deterministic half of the
 * invariant registry, and — only when asked — judges a graded pair.
 *
 * Deliberately outside `pnpm test`: it starts a browser, and with `--judge` it
 * calls a paid provider. The repository gate has to stay offline, free, and
 * deterministic, so every decision this script makes lives in `src/eval/` where
 * `pnpm test` exercises it against fixtures.
 *
 * Candidate output is read from `.eval-runs/<cycle>/<case>/`, or from
 * `<case>.baseline/` and `<case>.candidate/` when comparing a pair. Producing
 * that output is a separate step: this script runs no subject model.
 *
 * Every decision this file used to make inline now lives in
 * `src/eval/eval-run-orchestration.ts`, which is importable and therefore
 * testable. What stays here is I/O, process control, and rendering.
 */
const skill = 'squad-designer';
const evalDirectory = path.join('evals', skill);
const renderGatedPlatforms = new Set(['web', 'adaptive']);
const skippedDirectories = new Set(['dist', 'node_modules', '.git', 'screenshots']);
const textExtensions = new Set([
  '.css',
  '.dart',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.kt',
  '.md',
  '.scss',
  '.svelte',
  '.swift',
  '.ts',
  '.tsx',
  '.vue',
]);

/** Long enough for a cold native toolchain, short enough that CI cannot hang. */
const compileTimeoutMs = 300_000;
/** Per-stream capture ceiling for any child process this runner spawns. */
const maxCapturedBytes = 4 * 1024 * 1024;
/** A judge reads images and writes prose; it is slower than a compiler. */
const judgeTimeoutMs = 600_000;
/** The pair whose two arms measure verbosity bias rather than design quality. */
const lengthControlCaseId = 'length-control';
const calibrationLabelsFile = 'calibration-labels.yml';

const projectRoot = process.cwd();
const invocation = decide(() => parseEvalInvocation(process.argv));
const { caseId: onlyCase, comparing, dualRuntime, judging, lane: laneName } = invocation;
const runsRoot = path.resolve(projectRoot, invocation.runsRoot ?? runsRootName);

// `--runs-root` is operator input and `cycle_id` comes from a manifest, so both
// are checked before anything is read or written. Without this the guards in
// `eval-run-directory.ts` were unreachable and a run could place artifacts in
// `src/` or outside the repository entirely.
try {
  assertWritable(runsRoot, projectRoot);
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}

const caseSource = await readFile(
  path.join(projectRoot, evalDirectory, 'case-manifest.yml'),
  'utf8'
);
const caseManifest = parseDocument(caseSource).toJS() as {
  cases: Array<Record<string, unknown>>;
  cycle_id: string;
  lanes: Record<string, Record<string, unknown>>;
};
const baselineManifest = parseDocument(
  await readFile(path.join(projectRoot, evalDirectory, 'baseline-manifest.yml'), 'utf8')
).toJS() as Record<string, Record<string, any>>;

const manifestRecord = caseManifest as unknown as Record<string, unknown>;
const lane = decide(() => selectLane(manifestRecord, laneName));
const judgeConfig = judging ? readJudgeContract() : null;
const runtimeSides = dualRuntime ? decide(() => resolveRuntimeSides({ baselineManifest })) : null;
const selectedCases = decide(() => selectCaseEntries(manifestRecord, laneName, onlyCase));
const cases = await resolveCases();

interface GradedArm {
  blocking: boolean;
  files: CandidateFile[];
  screenshots: string[];
  status: GateStatus;
}

const graded = new Map<string, GradedArm>();
let renderer = 'absent';

// A dual-runtime run grades the same skill version twice, once per runtime, and
// compares. It is a different question from the A/B lanes — which grade two skill
// versions on one runtime — so it writes its own per-side reports and a
// divergence review rather than overloading the arm column.
const divergenceBlocked = runtimeSides ? await runPortability(runtimeSides) : false;
const results: CaseRunResult[] = runtimeSides ? [] : await gradeLane(null);

// Graded like a case, reported like neither: the control measures verbosity
// bias, so it must not move the deterministic verdict or the scored set. When
// its two directories are absent, its gates report `unverified`, it is never
// judged, and the bias stays unmeasured — which promotion treats as biased.
const lengthControlCase = judging ? resolveLengthControlCase() : null;

if (lengthControlCase) {
  for (const arm of ['baseline', 'candidate'] as const) {
    await gradeInto({
      arm,
      directoryId: armDirectoryId(lengthControlCaseId, arm),
      entry: lengthControlCase,
      screenshots: true,
    });
  }
}

const reportDirectory = resolveReportDirectory({
  cycleId: caseManifest.cycle_id,
  laneName,
  runsRoot,
});
const report = await writeReport(reportDirectory, results);

console.log(renderMarkdownReport(report));

if (comparing) console.log(renderComparison());

const judgingBlocked = judgeConfig ? await judgeGradedPairs(judgeConfig, report) : false;

console.log(`Artifacts: ${path.relative(projectRoot, reportDirectory)}`);

// Unverified is not success: a run nothing could check must not exit green.
// A medium-only failure is reported in full and does not block, which is the
// one case where the verdict and the exit code disagree.
process.exit(
  (runtimeSides ? divergenceBlocked : report.summary.blocking) || judgingBlocked ? 1 : 0
);

/**
 * Reads the pinned judging contract and refuses a same-family pairing before a
 * single call is made, because that is where self-preference bias operates on
 * the judged artifact.
 */
function readJudgeContract(): JudgeContract {
  // The same offline validator `pnpm validate:evals` runs. Re-reading the block
  // by hand here is how a missing `subject` became a raw TypeError and a
  // non-numeric hard stop became `NaN`, which silently disables the stop.
  const contractErrors: string[] = [];

  validateJudgingContract({
    baseline: baselineManifest,
    baselinePath: path.join(evalDirectory, 'baseline-manifest.yml'),
    cases: caseManifest as unknown as Record<string, unknown>,
    casesPath: path.join(evalDirectory, 'case-manifest.yml'),
    errors: contractErrors,
    notes: [],
  });

  if (contractErrors.length > 0) {
    fail(`The pinned judging contract is invalid:\n- ${contractErrors.join('\n- ')}`);
  }

  return decide(() => resolveJudgeContract({ baselineManifest, laneName }));
}

/**
 * Public cases carry their own body; held-out cases carry an id and a hash, so
 * their body is read from the private store and verified against the manifest
 * before it is used. A store that drifted invalidates the cycle rather than
 * quietly grading against different text.
 */
async function resolveCases(): Promise<ResolvedCase[]> {
  if (lane.visibility !== 'private') return selectedCases.map(resolvePublicCase);

  const privatePath = process.env.EVAL_PRIVATE_PATH;

  if (!privatePath) fail(`Lane "${laneName}" is held out; set EVAL_PRIVATE_PATH to its clone.`);

  const resolved: ResolvedCase[] = [];

  for (const entry of selectedCases) {
    const id = String(entry.id);
    const located = await resolveHeldOutCaseFile({ id, laneSource: lane.source, privatePath });

    if (located.error !== undefined) fail(`Held-out case "${id}": ${located.error}.`);

    let body: string;

    try {
      body = await readFile(located.file, 'utf8');
    } catch {
      fail(`Held-out case "${id}" could not be read from ${located.file}.`);
    }

    resolved.push(
      decide(() =>
        resolveHeldOutCase({
          body,
          id,
          parsed: parseDocument(body).toJS() as Record<string, unknown>,
          recordedHash: entry.content_hash,
        })
      )
    );
  }

  return resolved;
}

/**
 * Grades every case in the lane, optionally suffixing each run directory.
 *
 * The suffix is what separates the layouts this script supports: absent for a
 * plain run, an arm for a two-version comparison, a runtime side id for a
 * portability run. All three read the same `<runsRoot>/<cycle>/<id>` shape, so
 * one guarded resolver covers them.
 */
async function gradeLane(side: RuntimeSide | null): Promise<CaseRunResult[]> {
  const collected: CaseRunResult[] = [];
  const arms = side ? ([side.id] as const) : resolveArms({ comparing, judging });

  for (const entry of cases) {
    for (const arm of arms) {
      collected.push(
        await gradeInto({
          arm: arm === 'baseline' || arm === 'candidate' ? arm : null,
          directoryId: armDirectoryId(entry.id, arm as never),
          entry,
          screenshots: judging,
        })
      );
    }
  }

  return collected;
}

/** Grades one directory, records it for later comparison, and returns its row. */
async function gradeInto(options: {
  arm: 'baseline' | 'candidate' | null;
  directoryId: string;
  entry: ResolvedCase;
  screenshots: boolean;
}): Promise<CaseRunResult> {
  const { arm, directoryId, entry, screenshots } = options;
  const runDirectory = resolveOrFail(directoryId);
  const files = await readCandidateFiles(runDirectory);
  const outcome = await gradeDirectory({
    files,
    runDirectory,
    screenshotDirectory: screenshots ? path.join(runDirectory, 'screenshots') : undefined,
    targetPlatform: entry.targetPlatform,
  });

  const caseResult: CaseRunResult = {
    ...(arm ? { arm } : {}),
    artifactHash: await hashCandidateArtifact(runDirectory),
    caseId: entry.id,
    category: entry.category,
    lane: laneName,
    results: outcome.gates,
    runDirectory: path.relative(projectRoot, runDirectory),
    targetPlatform: entry.targetPlatform,
  };
  const summary = summarizeCase(caseResult);

  graded.set(directoryId, {
    blocking: summary.blocking,
    files,
    screenshots: outcome.screenshots,
    status: summary.status,
  });

  return caseResult;
}

/** Writes the run report for one directory and returns it. */
async function writeReport(
  directory: string,
  rows: readonly CaseRunResult[]
): Promise<ReturnType<typeof buildEvalRunReport>> {
  const payload = await measureSkillPayload({
    skillRoot: path.join(projectRoot, 'skills', skill),
  });
  const built = buildEvalRunReport(
    {
      caseManifestHash: hashContent(caseSource),
      cycleId: caseManifest.cycle_id,
      nodeVersion: process.versions.node,
      payloadHash: payload.payloadHash,
      renderer,
    },
    rows
  );

  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'report.json'), `${JSON.stringify(built, null, 2)}\n`);
  await writeFile(path.join(directory, 'report.md'), renderMarkdownReport(built));

  return built;
}

/**
 * The free half of an A/B: which cases the candidate broke, and which it fixed.
 *
 * `--compare` exists so the deterministic signal can be read without paying a
 * judge. A `pass` -> non-`pass` move is the regression the promotion gate refuses
 * on its own, independently of any aggregate score.
 */
function renderComparison(): string {
  const statuses = (arm: 'baseline' | 'candidate') =>
    new Map(cases.map((entry) => [entry.id, statusOf(armDirectoryId(entry.id, arm))]));
  const baseline = statuses('baseline');
  const candidate = statuses('candidate');
  const regressions = buildRegressionLedger(baseline, candidate);
  const lines = [
    '',
    '## Deterministic A/B',
    '',
    '| Case | Baseline | Candidate | Move |',
    '| --- | --- | --- | --- |',
  ];

  for (const entry of cases) {
    const before = baseline.get(entry.id) ?? 'unverified';
    const after = candidate.get(entry.id) ?? 'unverified';

    lines.push(
      `| \`${entry.id}\` | ${before} | ${after} | ${before === after ? 'unchanged' : `${before} -> ${after}`} |`
    );
  }

  lines.push(
    '',
    regressions.length === 0
      ? 'No case regressed from `pass`.'
      : `${regressions.length} regression(s): ${regressions.map((entry) => `\`${entry.caseId}\``).join(', ')}. A regression blocks promotion regardless of the aggregate.`
  );

  return lines.join('\n');
}

/**
 * Grades one skill version on both pinned runtimes and reports where they differ.
 *
 * Returns whether the review must block. A divergence carrying a critical or high
 * gate severity blocks, because the same instruction produced a failing artifact
 * on one of the runtimes the skill is published for. A partial review — one
 * runtime never answered — blocks too: the artifacts are preserved and reported,
 * but nothing was actually compared.
 */
async function runPortability(sides: readonly RuntimeSide[]): Promise<boolean> {
  const perSide = new Map<string, CaseRunResult[]>();

  for (const side of sides) {
    const rows = await gradeLane(side);

    perSide.set(side.id, rows);

    await writeReport(
      resolveRuntimeReportDirectory({
        cycleId: caseManifest.cycle_id,
        laneName,
        runsRoot,
        side,
      }),
      rows
    );
  }

  const directory = resolveReportDirectory({
    cycleId: caseManifest.cycle_id,
    laneName,
    runsRoot,
  });
  const reviews = [];
  let blocking = false;

  await mkdir(directory, { recursive: true });

  for (const entry of cases) {
    const observations: RuntimeObservation[] = [];

    for (const side of sides) {
      const row = perSide.get(side.id)?.find((candidate) => candidate.caseId === entry.id);

      // A side that produced nothing is left out rather than filled in with a
      // clean row, so the review reports itself as partial instead of inventing
      // agreement out of absence.
      if (!row || row.results.length === 0) continue;

      observations.push({
        effort: side.effort,
        gates: row.results,
        model: side.model,
        provider: side.provider,
        side: side.id,
      });
    }

    const review = decide(() => buildDivergenceReport({ caseId: entry.id, observations }));

    reviews.push(review);
    blocking ||= portabilityReviewBlocks(review, observations);

    console.log(renderDivergenceReport(review));
  }

  await writeFile(path.join(directory, 'divergence.json'), `${JSON.stringify(reviews, null, 2)}\n`);
  await writeFile(
    path.join(directory, 'divergence.md'),
    reviews.map(renderDivergenceReport).join('\n')
  );

  return blocking;
}

async function gradeDirectory(options: {
  files: CandidateFile[];
  runDirectory: string;
  screenshotDirectory: string | undefined;
  targetPlatform: string;
}): Promise<{ gates: GateResult[]; screenshots: string[] }> {
  const { files, runDirectory, screenshotDirectory, targetPlatform } = options;
  const gates: GateResult[] = [];
  const screenshots: string[] = [];

  if (files.length === 0) {
    // No output is not a pass and not a failure of the design: it is a run that
    // has not happened yet, and the report has to say so.
    gates.push(
      gateResult(
        'INV-BUILD-001',
        'critical',
        'static',
        'unverified',
        `No candidate output at ${path.relative(projectRoot, runDirectory)}; produce a run before grading it.`
      )
    );

    return { gates, screenshots };
  }

  gates.push(
    ...runPresentationalStaticGates({
      approvedDependencies: approvedDependenciesFor(manifestRecord, targetPlatform),
      files,
    })
  );

  // One case that throws must not discard the whole run. A crashed page or a
  // protocol error is a case nothing could measure, which is `unverified` —
  // losing the report entirely would leave no record that anything ran.
  try {
    if (renderGatedPlatforms.has(targetPlatform)) {
      const outcome = await renderCandidate({
        platformMinimumTargetPx: minimumTargetSize(targetPlatform),
        runDirectory,
        screenshotDirectory,
      });

      if (outcome.renderer !== 'absent') renderer = outcome.renderer;

      screenshots.push(...outcome.screenshots);
      gates.push(...runRenderedUiGates(outcome.snapshot));
    } else {
      gates.push(
        ...(await runNativeCompileGate({ run: runCommand, runDirectory, targetPlatform }))
      );
    }
  } catch (error) {
    gates.push(
      gateResult(
        'INV-BUILD-001',
        'critical',
        'render-gated',
        'unverified',
        `Grading threw before it could measure anything: ${(error as Error).message.split('\n')[0]}`
      )
    );
  }

  return { gates, screenshots };
}

/**
 * The control reuses a declared case's platform and rubrics.
 *
 * It is a reference rather than a case of its own because the control is the
 * *same* task reworded at greater length: inventing a separate platform and
 * rubric set for it would measure a different comparison than the one whose
 * verbosity bias it is supposed to estimate.
 */
function resolveLengthControlCase(): ResolvedCase | null {
  return decide(() =>
    resolveDeclaredLengthControl({
      baselineManifest,
      cases,
      controlId: lengthControlCaseId,
      laneName,
    })
  );
}

/** Returns whether judging produced a result that must block promotion. */
async function judgeGradedPairs(
  config: JudgeContract,
  deterministicReport: ReturnType<typeof buildEvalRunReport>
): Promise<boolean> {
  const judgeDirectory = path.join(reportDirectory, 'judge');
  const schemaDirectory = path.join(judgeDirectory, 'schema');

  await mkdir(schemaDirectory, { recursive: true });

  // One schema per case, not one union schema per run: a union enumerates
  // rubrics a case never declared and sets `minItems` to their count, which
  // forces the judge to invent evidence for rubrics that do not apply.
  const schemaPath = async (packet: { caseId: string; rubricIds: string[] }): Promise<string> => {
    const file = path.join(schemaDirectory, `${packet.caseId}.json`);

    await writeFile(file, `${JSON.stringify(rubricOutputSchema(packet.rubricIds), null, 2)}\n`);

    return file;
  };

  // The judge runs with the blinded staging directory as its cwd. Its `Read`
  // allowance is meant for renders; rooted at the repository it would also
  // reach source and dotfiles, and the artifacts it grades are model-produced
  // text that may try exactly that.
  const run = createRunner(config, schemaPath, judgeDirectory);

  if (!run) return true;

  const judgingCases = cases
    .map((entry) => toJudgingCase(entry.id, entry.rubricIds, entry.seed))
    .filter((entry): entry is JudgingCaseInput => entry !== null);

  const judgingReport = await runJudging({
    calibrationLabels: await readCalibrationLabels(),
    cases: judgingCases,
    cycleId: caseManifest.cycle_id,
    evidence: {
      candidateArtifacts: deterministicReport.cases
        .filter((entry) => entry.arm === 'candidate')
        .map((entry) => ({
          artifactHash: entry.artifactHash ?? null,
          caseId: entry.caseId,
          runDirectory: entry.runDirectory,
        })),
      caseManifestHash: deterministicReport.environment.caseManifestHash,
      deterministicReportHash: deterministicReport.reportHash,
      payloadHash: deterministicReport.environment.payloadHash,
    },
    hardStopUsd: config.hardStopUsd,
    lane: laneName,
    lengthControl: lengthControlCase
      ? toJudgingCase(lengthControlCaseId, lengthControlCase.rubricIds, lengthControlCase.seed)
      : null,
    models: config.models,
    regressions: buildRegressionLedger(
      new Map(cases.map((entry) => [entry.id, statusOf(`${entry.id}.baseline`)])),
      new Map(cases.map((entry) => [entry.id, statusOf(`${entry.id}.candidate`)]))
    ),
    run,
    seed: config.seed,
    skill,
    stageScreenshot: async ({ caseId, index, order, side, source }) => {
      const destinationDirectory = path.join(judgeDirectory, caseId, order);

      await mkdir(destinationDirectory, { recursive: true });

      const destination = path.join(destinationDirectory, `${side}-${index + 1}.png`);

      await copyFile(source, destination);

      return destination;
    },
  });

  await writeFile(
    path.join(reportDirectory, 'judging.json'),
    `${JSON.stringify(judgingReport, null, 2)}\n`
  );
  await writeFile(path.join(reportDirectory, 'judging.md'), renderJudgingReport(judgingReport));

  console.log(renderJudgingReport(judgingReport));

  // The stop itself fires inside the run, between cases; this only reports what
  // it cost. Subscription auth reports no cost at all, which is why an unknown
  // total is never treated as a run that was free.
  if (budgetStopExceeded(judgingReport.usage.costUsd, config.hardStopUsd)) {
    console.error(
      `Judging cost ${judgingReport.usage.costUsd} passed the hard stop ${config.hardStopUsd}; remaining cases were not judged.`
    );

    return true;
  }

  return judgingReport.tally.inconclusive > 0;
}

function createRunner(
  config: JudgeContract,
  schemaPath: (packet: { caseId: string; rubricIds: string[] }) => Promise<string>,
  judgeCwd: string
): JudgeRunner | null {
  const family = providerFamily(config.judge.provider);
  const run = async (argv: readonly string[]) => {
    const outcome = await runCommand(
      family === 'openai' ? 'codex' : 'claude',
      argv,
      judgeCwd,
      judgeTimeoutMs
    );

    // stdout only: the answer is parsed line by line, and an interleaved stderr
    // write would splice a JSON line and lose an answer to `inconclusive`.
    return { status: outcome.missing ? null : outcome.status, stdout: outcome.stdout ?? '' };
  };

  if (family === 'openai') {
    return createCodexJudgeRunner({ model: config.judge.model, run, schemaPath });
  }

  if (family === 'anthropic') {
    return createClaudeJudgeRunner({ model: config.judge.model, run });
  }

  console.error(
    `No judge client for provider family "${family}"; add one rather than judging on code alone.`
  );

  return null;
}

function toJudgingCase(caseId: string, rubricIds: string[], seed: number): JudgingCaseInput | null {
  const baseline = graded.get(`${caseId}.baseline`);
  const candidate = graded.get(`${caseId}.candidate`);

  if (!baseline || !candidate) return null;

  return {
    baseline: {
      blocking: baseline.blocking,
      files: baseline.files,
      screenshots: baseline.screenshots,
    },
    candidate: {
      blocking: candidate.blocking,
      files: candidate.files,
      screenshots: candidate.screenshots,
    },
    caseId,
    rubricIds,
    seed,
  };
}

function statusOf(directoryId: string): GateStatus {
  return graded.get(directoryId)?.status ?? 'unverified';
}

/**
 * Human labels for the calibration subset, recorded in the run rather than in
 * the frozen store: a label compares this candidate against the baseline, so it
 * cannot exist before the candidate does.
 */
async function readCalibrationLabels(): Promise<Map<string, PairwiseWinner>> {
  const labels = new Map<string, PairwiseWinner>();

  let source: string;

  try {
    source = await readFile(path.join(reportDirectory, calibrationLabelsFile), 'utf8');
  } catch {
    return labels;
  }

  const parsed = parseDocument(source).toJS() as Record<string, unknown>;

  for (const [caseId, winner] of Object.entries(parsed ?? {})) {
    if (winner === 'baseline' || winner === 'candidate' || winner === 'tie') {
      labels.set(caseId, winner);
    }
  }

  return labels;
}

function resolveOrFail(directoryId: string): string {
  try {
    return resolveRunDirectory({
      caseId: directoryId,
      cycleId: caseManifest.cycle_id,
      projectRoot,
      runsRoot,
    });
  } catch (error) {
    if (!(error instanceof RunDirectoryError)) throw error;

    fail(`${directoryId}: ${error.message}`);
  }
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

/**
 * Runs one decision from `src/eval/eval-run-orchestration.ts` and exits on refusal.
 *
 * The decisions themselves throw rather than exiting so a test can assert them;
 * this is the single place a refusal becomes a non-zero exit, which keeps the
 * script's error surface uniform.
 */
function decide<T>(decision: () => T): T {
  try {
    return decision();
  } catch (error) {
    if (error instanceof OrchestrationError || (error as Error).name === 'JudgeContractError') {
      fail((error as Error).message);
    }

    throw error;
  }
}

/** Candidate text files, as POSIX paths relative to the run directory. */
async function readCandidateFiles(runDirectory: string): Promise<CandidateFile[]> {
  const files: CandidateFile[] = [];

  const walk = async (directory: string): Promise<void> => {
    let entries;

    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        if (!skippedDirectories.has(entry.name)) await walk(entryPath);
        continue;
      }

      if (!entry.isFile() || !textExtensions.has(path.extname(entry.name).toLowerCase())) continue;

      files.push({
        path: path.relative(runDirectory, entryPath).split(path.sep).join('/'),
        source: await readFile(entryPath, 'utf8'),
      });
    }
  };

  await walk(runDirectory);

  return files.sort((left, right) => left.path.localeCompare(right.path));
}

/**
 * Runs one external command under a hard time limit with stdin closed.
 *
 * Both matter: a Gradle daemon waiting on a lock, or any tool that prompts,
 * would otherwise block the run forever. A timeout is reported as `unverified`
 * — the toolchain never answered, which is not the same as the output failing
 * to compile.
 */
function runCommand(
  command: string,
  args: readonly string[],
  cwd: string,
  timeoutMs: number = compileTimeoutMs
): Promise<CommandOutcome> {
  return new Promise((resolve) => {
    const child = spawn(command, [...args], {
      cwd,
      // Its own process group, so a timeout kills the CLI's children too. A
      // surviving grandchild holds a provider session open and keeps spending.
      detached: true,
      killSignal: 'SIGKILL',
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: timeoutMs,
    });
    let stdout = '';
    let stderr = '';
    let capturedBytes = 0;
    let truncated = false;

    // The timeout bounds how long a child runs, not how much it says. A noisy
    // compiler or a judge stuck in a loop can fill this process's heap well
    // inside the time limit, so the byte count is its own stop. The cap sits far
    // above any real judge envelope; reaching it means something is wrong, and
    // the truncated stdout then fails to parse, which is the honest outcome.
    const capture = (chunk: Buffer, append: (text: string) => void): void => {
      if (truncated) return;

      const remaining = maxCapturedBytes - capturedBytes;

      if (chunk.length < remaining) {
        capturedBytes += chunk.length;
        append(chunk.toString());

        return;
      }

      append(chunk.subarray(0, remaining).toString());
      capturedBytes = maxCapturedBytes;
      truncated = true;

      if (child.pid) {
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch {
          // Already gone, which is the outcome we wanted.
        }
      }
    };

    child.stdout.on('data', (chunk: Buffer) => capture(chunk, (text) => (stdout += text)));
    child.stderr.on('data', (chunk: Buffer) => capture(chunk, (text) => (stderr += text)));
    // `ENOENT` here means the binary is absent; every other spawn error is an
    // environment fault, and reporting one as a compile failure would blame the
    // candidate for the machine.
    child.on('error', (error: NodeJS.ErrnoException) =>
      resolve({
        missing: error.code === 'ENOENT',
        output: error.message,
        status: error.code === 'ENOENT' ? 127 : null,
        stdout: '',
      })
    );
    child.on('close', (status, signal) => {
      if (signal === 'SIGKILL' && child.pid) {
        // The timeout killed the child; its process group may still be running.
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch {
          // Already gone, which is the outcome we wanted.
        }
      }

      const output = stderr.length > 0 ? `${stdout}\n${stderr}` : stdout;

      // Reported separately from a timeout: the process was stopped because it
      // would not stop talking, and calling that a timeout would send whoever
      // reads it looking for a slow toolchain.
      if (truncated) {
        resolve({
          missing: false,
          output: `${output}\nOutput passed ${maxCapturedBytes} bytes; the process was stopped.`,
          status: null,
          stdout,
        });

        return;
      }

      resolve(
        signal === 'SIGKILL'
          ? {
              missing: false,
              output: `${output}\nTimed out after ${timeoutMs}ms.`,
              status: null,
              stdout,
            }
          : { missing: false, output, status: status ?? 1, stdout }
      );
    });
  });
}
