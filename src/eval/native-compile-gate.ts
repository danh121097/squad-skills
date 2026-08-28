import { readFile } from 'node:fs/promises';
import path from 'node:path';

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
  /** Whether decision 10 additionally requires a human to look at the result. */
  humanReview: boolean;
}

/**
 * Per-platform verification depth, transcribed from plan decision 10. Web and
 * adaptive are absent on purpose: they are render-gated, and routing them here
 * would report a weaker tier than the one that actually ran.
 */
const toolchains: Record<string, ToolchainSpec> = {
  compose: { args: ['compileDebugKotlin', '--offline'], command: 'gradle', humanReview: true },
  flutter: { args: ['analyze', '--no-pub'], command: 'flutter', humanReview: false },
  'react-native': { args: ['--noEmit'], command: 'tsc', humanReview: false },
  swiftui: { args: ['-typecheck'], command: 'swiftc', humanReview: true },
};

const manualReviewFile = 'manual-review.yml';
const manualReviewFields = ['reviewer', 'reviewed_on', 'verdict', 'notes'];

/**
 * Compiles native output where a toolchain exists and records the limit where
 * it does not.
 *
 * The one rule this gate exists to hold: an absent toolchain is reported as
 * unverified, never as passing. A native run that nothing could check has to
 * look different in the report from one that compiled, or the tiered
 * verification the plan accepted becomes a claim nobody can audit.
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

  const results = [await compile(toolchain, targetPlatform, runDirectory, run)];

  if (toolchain.humanReview) {
    results.push(await readManualReview(runDirectory, targetPlatform));
  }

  return results;
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

  const missing = manualReviewFields.filter(
    (field) => !new RegExp(`^${field}\\s*:\\s*\\S`, 'm').test(source)
  );

  if (missing.length > 0) {
    return gateResult(
      'INV-COMPILE-001',
      'critical',
      'human-review',
      'unverified',
      `${manualReviewFile} is incomplete; missing ${missing.join(', ')}.`
    );
  }

  const rejected = /^verdict\s*:\s*(?:reject|fail)/m.test(source);

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

/** Compiler output is long; the last lines carry the error, the first carry banners. */
function tail(output: string, lines = 12): string[] {
  return output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .slice(-lines);
}
