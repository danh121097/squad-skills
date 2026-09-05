import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { parseDocument } from 'yaml';

import { generatedArtifactDirectories } from './candidate-artifact-hash.ts';
import { gateResult, type GateResult } from './gate-result.ts';

/** Result of attempting one toolchain invocation. */
export interface CommandOutcome {
  /** True when the toolchain itself is not installed, as opposed to failing. */
  missing: boolean;
  /** Merged streams, for a human reading a compile failure. */
  output: string;
  /**
   * stdout alone, for a caller that parses it. A compiler's diagnostics read
   * better merged; a JSONL answer stream does not survive a stderr write
   * landing mid-line.
   */
  stdout?: string;
  /**
   * Exit status, or `null` when the toolchain never produced one — it timed
   * out, or the machine refused to run it. That is an environment fault, and
   * blaming the candidate's code for it would be a false failure.
   */
  status: number | null;
}

export type CommandRunner = (
  command: string,
  args: readonly string[],
  cwd: string
) => Promise<CommandOutcome>;

export interface NativeCompileOptions {
  /** Injected so the gate is exercised without any toolchain present. */
  run: CommandRunner;
  runDirectory: string;
  targetPlatform: string;
}

interface ToolchainSpec {
  args: string[];
  command: string;
  /** Whether the contract additionally requires a human to read the result. */
  humanReview: boolean;
}

/**
 * Per-platform verification depth, transcribed from the tiers in
 * `evals/squad-designer/eval-contract.md` that are built — for React Native and
 * Flutter the contract also states a partial render this gate does not run, and
 * records that gap itself. Web and adaptive are absent on purpose: they are
 * render-gated, and routing them here would report a weaker tier than the one
 * that actually ran.
 */
const toolchains: Record<string, ToolchainSpec> = {
  compose: { args: ['compileDebugKotlin', '--offline'], command: 'gradle', humanReview: true },
  flutter: { args: ['analyze', '--no-pub'], command: 'flutter', humanReview: false },
  'react-native': { args: ['--noEmit'], command: 'tsc', humanReview: false },
  swiftui: {
    args: ['-typecheck', '-parse-as-library'],
    command: 'swiftc',
    humanReview: true,
  },
};

const manualReviewFile = 'manual-review.yml';
const manualReviewFields = ['reviewer', 'reviewed_on', 'verdict', 'notes'];
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The SwiftUI cases are written for iOS, and `swiftc` with no `-sdk`/`-target`
 * type-checks against the host macOS SDK. A plain screen using
 * `navigationBarTitleDisplayMode` or `UIKit` then reports `'…' is unavailable
 * in macOS` — correct output graded as a critical compile failure. The SDK is
 * named here so the report says which platform the tier actually asserted.
 */
const swiftSdkName = 'iphonesimulator';
const swiftTargetTriple = 'arm64-apple-ios17.0-simulator';

/**
 * Compiles native output where a toolchain exists and records the limit where
 * it does not.
 *
 * The one rule this gate exists to hold: an absent toolchain is reported as
 * unverified, never as passing. A native run that nothing could check has to
 * look different in the report from one that compiled, or the tiered
 * verification the contract states becomes a claim nobody can audit.
 */
export async function runNativeCompileGate(options: NativeCompileOptions): Promise<GateResult[]> {
  const { run, runDirectory, targetPlatform } = options;
  const toolchain = toolchains[targetPlatform];

  if (!toolchain) {
    return [
      gateResult(
        'INV-COMPILE-001',
        'critical',
        'compile-tier',
        'unverified',
        `Target platform "${targetPlatform}" has no compile tier; it is render-gated instead.`
      ),
    ];
  }

  const resolved = await resolveToolchain(toolchain, targetPlatform, runDirectory, run);
  const results = [
    Array.isArray(resolved)
      ? await compile({ ...toolchain, args: resolved }, targetPlatform, runDirectory, run)
      : resolved,
  ];

  if (toolchain.humanReview) {
    results.push(await readManualReview(runDirectory, targetPlatform));
  }

  return results;
}

/**
 * `swiftc` does not discover source files from cwd; every input must be
 * explicit, and the platform it type-checks against must be stated rather than
 * inherited from whichever machine ran the gate.
 */
async function resolveToolchain(
  toolchain: ToolchainSpec,
  targetPlatform: string,
  runDirectory: string,
  run: CommandRunner
): Promise<string[] | GateResult> {
  if (targetPlatform !== 'swiftui') return toolchain.args;

  const sources = await findSwiftSources(runDirectory);

  if (sources.length === 0) {
    return gateResult(
      'INV-COMPILE-001',
      'critical',
      'compile-tier',
      'unverified',
      'The SwiftUI candidate contains no .swift source files, so swiftc had no input to type-check.'
    );
  }

  const sdkPath = await resolveSwiftSdk(runDirectory, run);

  if (typeof sdkPath !== 'string') return sdkPath;

  return [
    ...toolchain.args,
    '-sdk',
    sdkPath,
    '-target',
    swiftTargetTriple,
    // `./` keeps a candidate-named file read as an input. The run directory is
    // written by the subject under evaluation, so a source called
    // `-Xlinker.swift` would otherwise reach the compiler as an argument and
    // report "unknown argument" as if the candidate's code did not compile.
    ...sources.map((source) => `./${source}`),
  ];
}

/**
 * An absent iOS SDK is an environment fact, not a candidate failure, so it
 * reports `unverified` for the same reason an absent toolchain does. Falling
 * back to the host SDK would be worse than not compiling: it fails correct
 * output while looking like a real result.
 */
async function resolveSwiftSdk(
  runDirectory: string,
  run: CommandRunner
): Promise<string | GateResult> {
  const args = ['--sdk', swiftSdkName, '--show-sdk-path'];
  const outcome = await run('xcrun', args, runDirectory);
  const sdkPath = (outcome.stdout ?? outcome.output).trim();

  if (outcome.missing || outcome.status !== 0 || sdkPath.length === 0) {
    return gateResult(
      'INV-COMPILE-001',
      'critical',
      'compile-tier',
      'unverified',
      `No ${swiftSdkName} SDK on this machine, so the SwiftUI output was not type-checked against the platform its case targets.`,
      [`attempted: xcrun ${args.join(' ')}`]
    );
  }

  return sdkPath;
}

async function findSwiftSources(runDirectory: string): Promise<string[]> {
  const sources: string[] = [];

  const walk = async (directory: string): Promise<void> => {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        if (!generatedArtifactDirectories.has(entry.name)) await walk(entryPath);
      } else if (entry.isFile() && entry.name.endsWith('.swift')) {
        sources.push(path.relative(runDirectory, entryPath).split(path.sep).join('/'));
      }
    }
  };

  await walk(runDirectory);

  return sources.sort();
}

async function compile(
  toolchain: ToolchainSpec,
  targetPlatform: string,
  runDirectory: string,
  run: CommandRunner
): Promise<GateResult> {
  const invocation = `${toolchain.command} ${toolchain.args.join(' ')}`;
  const outcome = await run(toolchain.command, toolchain.args, runDirectory);

  if (outcome.missing) {
    return gateResult(
      'INV-COMPILE-001',
      'critical',
      'compile-tier',
      'unverified',
      `No ${targetPlatform} toolchain on this machine: "${toolchain.command}" is not installed, so the output was not compiled.`,
      [`attempted: ${invocation}`]
    );
  }

  if (outcome.status === null) {
    return gateResult(
      'INV-COMPILE-001',
      'critical',
      'compile-tier',
      'unverified',
      `The ${targetPlatform} toolchain did not complete, so the output was not compiled.`,
      [`attempted: ${invocation}`, ...tail(outcome.output)]
    );
  }

  return outcome.status === 0
    ? gateResult(
        'INV-COMPILE-001',
        'critical',
        'compile-tier',
        'pass',
        `${targetPlatform} output compiles.`,
        [`ran: ${invocation}`]
      )
    : gateResult(
        'INV-COMPILE-001',
        'critical',
        'compile-tier',
        'fail',
        `${targetPlatform} output does not compile (exit ${outcome.status}).`,
        [`ran: ${invocation}`, ...tail(outcome.output)]
      );
}

/**
 * SwiftUI and Compose stop at compile plus human review, so the review record
 * is part of the result rather than a process step outside it. No record means
 * unverified: an uninspected run must not read as a reviewed one.
 */
async function readManualReview(runDirectory: string, targetPlatform: string): Promise<GateResult> {
  const recordPath = path.join(runDirectory, manualReviewFile);

  let source: string;

  try {
    source = await readFile(recordPath, 'utf8');
  } catch {
    return gateResult(
      'INV-COMPILE-001',
      'critical',
      'human-review',
      'unverified',
      `${targetPlatform} stops at compile plus human review, and ${manualReviewFile} is absent, so no human has signed off.`
    );
  }

  const document = parseDocument(source);

  if (document.errors.length > 0) {
    return unverifiedReview(targetPlatform, `${manualReviewFile} is not valid YAML.`);
  }

  const value: unknown = document.toJS();

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return unverifiedReview(targetPlatform, `${manualReviewFile} must be a YAML mapping.`);
  }

  const record = value as Record<string, unknown>;
  const unknown = Object.keys(record).filter((field) => !manualReviewFields.includes(field));

  if (unknown.length > 0) {
    return unverifiedReview(
      targetPlatform,
      `${manualReviewFile} has unknown field(s): ${unknown.join(', ')}.`
    );
  }

  const missing = manualReviewFields.filter((field) => {
    const fieldValue = record[field];

    return (
      fieldValue === undefined ||
      fieldValue === null ||
      (typeof fieldValue === 'string' && fieldValue.trim().length === 0)
    );
  });

  if (missing.length > 0) {
    return unverifiedReview(
      targetPlatform,
      `${manualReviewFile} is incomplete; missing ${missing.join(', ')}.`
    );
  }

  const invalid = manualReviewFields.filter((field) => typeof record[field] !== 'string');

  if (invalid.length > 0) {
    return unverifiedReview(
      targetPlatform,
      `${manualReviewFile} has invalid field type(s): ${invalid.join(', ')}.`
    );
  }

  if (!isIsoCalendarDate(String(record.reviewed_on).trim())) {
    return unverifiedReview(
      targetPlatform,
      `${manualReviewFile} needs reviewed_on as an ISO date.`
    );
  }

  const verdict = String(record.verdict).trim().toLowerCase();
  const acceptedVerdicts = new Set(['accept', 'pass']);
  const rejectedVerdicts = new Set(['reject', 'fail']);

  if (!acceptedVerdicts.has(verdict) && !rejectedVerdicts.has(verdict)) {
    return unverifiedReview(
      targetPlatform,
      `${manualReviewFile} has unknown verdict "${String(record.verdict)}"; expected accept, pass, reject, or fail.`
    );
  }

  const rejected = rejectedVerdicts.has(verdict);

  // Critical, matching the registry row: a human rejection is the strongest
  // signal this tier can produce, and counting it as `high` would let a
  // promotion policy keyed on critical failures read it as a lesser one.
  return gateResult(
    'INV-COMPILE-001',
    'critical',
    'human-review',
    rejected ? 'fail' : 'pass',
    rejected
      ? `A human reviewed the ${targetPlatform} output and rejected it.`
      : `A human reviewed the ${targetPlatform} output and accepted it.`,
    [`record: ${manualReviewFile}`]
  );
}

function isIsoCalendarDate(value: string): boolean {
  if (!isoDatePattern.test(value)) return false;

  const timestamp = Date.parse(`${value}T00:00:00Z`);

  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

function unverifiedReview(targetPlatform: string, detail: string): GateResult {
  return gateResult(
    'INV-COMPILE-001',
    'critical',
    'human-review',
    'unverified',
    `${targetPlatform} human review is unverified: ${detail}`
  );
}

/** Compiler output is long; the last lines carry the error, the first carry banners. */
function tail(output: string, lines = 12): string[] {
  return output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .slice(-lines);
}
