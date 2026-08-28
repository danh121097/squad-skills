import { spawn } from 'node:child_process';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { parseDocument } from 'yaml';

import { createClaudeJudgeRunner } from '../src/eval/claude-judge-client.ts';
import { createCodexJudgeRunner } from '../src/eval/codex-judge-client.ts';
import { rubricOutputSchema } from '../src/eval/judge-response-parser.ts';
import { validateJudgingContract } from '../src/eval/judging-contract-validator.ts';
import { buildRegressionLedger } from '../src/eval/eval-statistics.ts';
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
  assertCrossProvider,
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
 * `<case>.baseline/` and `<case>.candidate/` when judging a pair. Producing
 * that output is a separate step: this script runs no subject model.
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
/** A judge reads images and writes prose; it is slower than a compiler. */
const judgeTimeoutMs = 600_000;
/** The pair whose two arms measure verbosity bias rather than design quality. */
const lengthControlCaseId = 'length-control';
const calibrationLabelsFile = 'calibration-labels.yml';

const projectRoot = process.cwd();
const onlyCase = readFlag('--case');
const laneName = readFlag('--lane') ?? 'development';
const judging = process.argv.includes('--judge');
const runsRoot = path.resolve(projectRoot, readFlag('--runs-root') ?? runsRootName);

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

const lane = caseManifest.lanes?.[laneName];

if (!lane) fail(`Case manifest declares no lane "${laneName}".`);

const judgeConfig = judging ? readJudgeConfig() : null;

const selectedCases = caseManifest.cases.filter(
  (entry) => entry.lane === laneName && (!onlyCase || entry.id === onlyCase)
);

if (selectedCases.length === 0) {
  fail(onlyCase ? `No "${laneName}" case "${onlyCase}".` : `No cases in lane "${laneName}".`);
}

const cases = await resolveCases();

interface GradedArm {
  blocking: boolean;
  files: CandidateFile[];
  screenshots: string[];
  status: GateStatus;
}

const results: CaseRunResult[] = [];
const graded = new Map<string, GradedArm>();
let renderer = 'absent';

for (const entry of cases) {
  const arms = judging ? (['baseline', 'candidate'] as const) : ([null] as const);

  for (const arm of arms) {
    const directoryId = arm ? `${entry.id}.${arm}` : entry.id;
    const runDirectory = resolveOrFail(directoryId);
    const files = await readCandidateFiles(runDirectory);
    const outcome = await gradeDirectory({
      files,
      runDirectory,
      screenshotDirectory: judging ? path.join(runDirectory, 'screenshots') : undefined,
      targetPlatform: entry.targetPlatform,
    });

    const caseResult: CaseRunResult = {
      ...(arm ? { arm } : {}),
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

    results.push(caseResult);
  }
}

// Graded like a case, reported like neither: the control measures verbosity
// bias, so it must not move the deterministic verdict or the scored set. When
// its two directories are absent, its gates report `unverified`, it is never
// judged, and the bias stays unmeasured — which promotion treats as biased.
const lengthControlCase = judging ? resolveLengthControlCase() : null;

if (lengthControlCase) {
  for (const arm of ['baseline', 'candidate'] as const) {
    const directoryId = `${lengthControlCaseId}.${arm}`;
    const runDirectory = resolveOrFail(directoryId);
    const files = await readCandidateFiles(runDirectory);
    const outcome = await gradeDirectory({
      files,
      runDirectory,
      screenshotDirectory: path.join(runDirectory, 'screenshots'),
      targetPlatform: lengthControlCase.targetPlatform,
    });

    const summary = summarizeCase({
      caseId: lengthControlCaseId,
      category: lengthControlCase.category,
      lane: laneName,
      results: outcome.gates,
      runDirectory: path.relative(projectRoot, runDirectory),
      targetPlatform: lengthControlCase.targetPlatform,
    });

    graded.set(directoryId, {
      blocking: summary.blocking,
      files,
      screenshots: outcome.screenshots,
      status: summary.status,
    });
  }
}

const payload = await measureSkillPayload({ skillRoot: path.join(projectRoot, 'skills', skill) });
const report = buildEvalRunReport(
  {
    caseManifestHash: hashContent(caseSource),
    cycleId: caseManifest.cycle_id,
    nodeVersion: process.versions.node,
    payloadHash: payload.payloadHash,
    renderer,
  },
  results
);

// Lane-scoped on purpose. Both lanes write the same report shape, so a shared
// path let a later calibration run silently overwrite the acceptance evidence a
// promotion is then decided on.
const reportDirectory = path.join(runsRoot, caseManifest.cycle_id, laneName);

await mkdir(reportDirectory, { recursive: true });
await writeFile(path.join(reportDirectory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(path.join(reportDirectory, 'report.md'), renderMarkdownReport(report));

console.log(renderMarkdownReport(report));

const judgingBlocked = judgeConfig ? await judgeGradedPairs(judgeConfig) : false;

console.log(`Artifacts: ${path.relative(projectRoot, reportDirectory)}`);

// Unverified is not success: a run nothing could check must not exit green.
// A medium-only failure is reported in full and does not block, which is the
// one case where the verdict and the exit code disagree.
process.exit(report.summary.blocking || judgingBlocked ? 1 : 0);

interface ResolvedCase {
  category: string;
  id: string;
  rubricIds: string[];
  seed: number;
  targetPlatform: string;
}

interface JudgeConfig {
  hardStopUsd: number;
  judge: { model: string; provider: string };
  models: { authoringAssistance: string; judge: string; subject: string };
  seed: number;
}

/**
 * Reads the pinned judging contract and refuses a same-family pairing before a
 * single call is made, because that is where self-preference bias operates on
 * the judged artifact.
 */
function readJudgeConfig(): JudgeConfig {
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

  const block = baselineManifest.judging;

  if (!block) fail('The baseline manifest pins no judging contract.');

  const paidLanes: string[] = block.paid_lanes ?? [];

  if (!paidLanes.includes(laneName)) {
    fail(
      `Lane "${laneName}" is not a paid judging lane (${paidLanes.join(', ')}). The development lane is covered by deterministic gates, which carry the iteration signal for free.`
    );
  }

  try {
    assertCrossProvider(block.subject.provider, block.judge.provider);
  } catch (error) {
    fail((error as Error).message);
  }

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
 * Public cases carry their own body; held-out cases carry an id and a hash, so
 * their body is read from the private store and verified against the manifest
 * before it is used. A store that drifted invalidates the cycle rather than
 * quietly grading against different text.
 */
async function resolveCases(): Promise<ResolvedCase[]> {
  if (lane?.visibility !== 'private') {
    return selectedCases.map((entry) => ({
      category: String(entry.category),
      id: String(entry.id),
      rubricIds: (entry.qualitative_rubric as string[] | undefined) ?? [],
      seed: Number(entry.seed ?? 1),
      targetPlatform: String(entry.target_platform),
    }));
  }

  const privatePath = process.env.EVAL_PRIVATE_PATH;

  if (!privatePath) fail(`Lane "${laneName}" is held out; set EVAL_PRIVATE_PATH to its clone.`);

  const source = String(lane?.source ?? '');
  const resolved: ResolvedCase[] = [];

  for (const entry of selectedCases) {
    const id = String(entry.id);
    const file = path.join(privatePath, source, `${id}.yml`);
    let body: string;

    try {
      body = await readFile(file, 'utf8');
    } catch {
      fail(`Held-out case "${id}" is missing from the store at ${file}.`);
    }

    const measured = hashContent(body);

    if (measured !== entry.content_hash) {
      fail(
        `Held-out case "${id}" changed: manifest records ${String(entry.content_hash)}, store measures ${measured}.`
      );
    }

    const parsed = parseDocument(body).toJS() as Record<string, unknown>;

    resolved.push({
      category: String(parsed.category),
      id,
      rubricIds: (parsed.qualitative_rubric as string[] | undefined) ?? [],
      seed: Number(parsed.seed ?? 1),
      targetPlatform: String(parsed.target_platform),
    });
  }

  return resolved;
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
      approvedDependencies: await readApprovedDependencies(runDirectory),
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
  const declared = baselineManifest.judging?.length_control?.[laneName];

  if (typeof declared !== 'string' || declared.trim().length === 0) return null;

  const referenced = cases.find((entry) => entry.id === declared.trim());

  if (!referenced) {
    fail(
      `judging.length_control.case names "${declared}", which is not a case in lane "${laneName}".`
    );
  }

  return { ...referenced, id: lengthControlCaseId };
}

/** Returns whether judging produced a result that must block promotion. */
async function judgeGradedPairs(config: JudgeConfig): Promise<boolean> {
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
  if (judgingReport.usage.costUsd !== null && judgingReport.usage.costUsd > config.hardStopUsd) {
    console.error(
      `Judging cost ${judgingReport.usage.costUsd} passed the hard stop ${config.hardStopUsd}; remaining cases were not judged.`
    );

    return true;
  }

  return judgingReport.tally.inconclusive > 0;
}

function createRunner(
  config: JudgeConfig,
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
 * Reads `--flag value`. A flag with no value, or one followed by another flag,
 * is an error rather than a silent `null` — `--case` with a missing argument
 * used to grade every case instead of the one the operator named.
 */
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

/** The evidence packet's own manifest is the approved dependency set. */
async function readApprovedDependencies(runDirectory: string): Promise<string[]> {
  try {
    const manifest = JSON.parse(
      await readFile(path.join(runDirectory, 'package.json'), 'utf8')
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    return [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {}),
    ];
  } catch {
    return [];
  }
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

    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
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
