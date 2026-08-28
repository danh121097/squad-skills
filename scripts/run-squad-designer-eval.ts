import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { parseDocument } from 'yaml';

import {
  buildEvalRunReport,
  renderMarkdownReport,
  type CaseRunResult,
} from '../src/eval/eval-run-report.ts';
import {
  assertWritable,
  resolveRunDirectory,
  runsRootName,
  RunDirectoryError,
} from '../src/eval/eval-run-directory.ts';
import { gateResult, type GateResult } from '../src/eval/gate-result.ts';
import { runNativeCompileGate, type CommandOutcome } from '../src/eval/native-compile-gate.ts';
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
 * invariant registry.
 *
 * Deliberately outside `pnpm test`: it starts a browser, and the repository
 * gate has to stay offline and browser-free. The gate logic it calls is unit
 * tested against fixture snapshots, so what runs here is the same code CI
 * verifies, driven by a real render instead of a fixture.
 *
 * Candidate output is read from `.eval-runs/<cycle>/<case>/`; producing it is a
 * separate step, because this phase runs no models.
 */
const skill = 'squad-designer';
const evalDirectory = path.join('evals', skill);
const renderGatedPlatforms = new Set(['web', 'adaptive']);
const skippedDirectories = new Set(['dist', 'node_modules', '.git']);
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

const projectRoot = process.cwd();
const onlyCase = readFlag('--case');
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
};

const developmentCases = caseManifest.cases.filter(
  (entry) => entry.lane === 'development' && (!onlyCase || entry.id === onlyCase)
);

if (developmentCases.length === 0) {
  console.error(onlyCase ? `No development case "${onlyCase}".` : 'No development cases.');
  process.exit(1);
}

const results: CaseRunResult[] = [];
let renderer = 'absent';

for (const entry of developmentCases) {
  const caseId = String(entry.id);
  const targetPlatform = String(entry.target_platform);
  let runDirectory: string;

  try {
    runDirectory = resolveRunDirectory({
      caseId,
      cycleId: caseManifest.cycle_id,
      projectRoot,
      runsRoot,
    });
  } catch (error) {
    if (!(error instanceof RunDirectoryError)) throw error;

    console.error(`${caseId}: ${error.message}`);
    process.exit(1);
  }

  const files = await readCandidateFiles(runDirectory);

  const gates: GateResult[] = [];

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
  } else {
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
        });

        if (outcome.renderer !== 'absent') renderer = outcome.renderer;

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
  }

  results.push({
    caseId,
    category: String(entry.category),
    lane: 'development',
    results: gates,
    runDirectory: path.relative(projectRoot, runDirectory),
    targetPlatform,
  });
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

const reportDirectory = path.join(runsRoot, caseManifest.cycle_id);

await mkdir(reportDirectory, { recursive: true });
await writeFile(path.join(reportDirectory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(path.join(reportDirectory, 'report.md'), renderMarkdownReport(report));

console.log(renderMarkdownReport(report));
console.log(`Artifacts: ${path.relative(projectRoot, reportDirectory)}`);

// Unverified is not success: a run nothing could check must not exit green.
// A medium-only failure is reported in full and does not block, which is the
// one case where the verdict and the exit code disagree.
process.exit(report.summary.blocking ? 1 : 0);

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
 * Runs one toolchain command under a hard time limit with stdin closed.
 *
 * Both matter: a Gradle daemon waiting on a lock, or any tool that prompts,
 * would otherwise block the run forever. A timeout is reported as `unverified`
 * — the toolchain never answered, which is not the same as the output failing
 * to compile.
 */
function runCommand(
  command: string,
  args: readonly string[],
  cwd: string
): Promise<CommandOutcome> {
  return new Promise((resolve) => {
    const child = spawn(command, [...args], {
      cwd,
      killSignal: 'SIGKILL',
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: compileTimeoutMs,
    });
    let output = '';

    child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()));
    // `ENOENT` here means the binary is absent; every other spawn error is an
    // environment fault, and reporting one as a compile failure would blame the
    // candidate for the machine.
    child.on('error', (error: NodeJS.ErrnoException) =>
      resolve({
        missing: error.code === 'ENOENT',
        output: error.message,
        status: error.code === 'ENOENT' ? 127 : null,
      })
    );
    child.on('close', (status, signal) =>
      resolve(
        signal === 'SIGKILL'
          ? {
              missing: false,
              output: `${output}\nTimed out after ${compileTimeoutMs}ms.`,
              status: null,
            }
          : { missing: false, output, status: status ?? 1 }
      )
    );
  });
}
