import { collectUsage, findResponse, readJsonValues } from './judge-response-parser.ts';
import { unknownUsage, type JudgePacket, type JudgeRunOutcome } from './pairwise-judge.ts';

/**
 * The Codex invocation contract for judging, as data plus a stream reader.
 *
 * Every flag here is part of the contract rather than a convenience. `-i` puts
 * rendered pixels in front of the judge instead of only code; `--output-schema`
 * forces criterion evidence to precede any preference; `--json` is the only way
 * usage and latency reach the report; and `-s read-only` overrides a local
 * `danger-full-access` default, because a judge that can write is a judge that
 * can edit the thing it is grading.
 */
export interface CodexJudgeOptions {
  /** Pinned judge model, recorded in the manifest and in the report. */
  model: string;
  /** Injected process runner, so tests never spawn anything. */
  run: (argv: readonly string[]) => Promise<{ stdout: string; status: number | null }>;
  /**
   * Schema path for this packet's rubric ids. Per packet, not per run: a single
   * union schema would force a case to answer rubrics it never declared, and an
   * invented answer is worse than a missing one.
   */
  schemaPath: (packet: JudgePacket) => Promise<string> | string;
}

export function buildJudgeArgv(options: {
  model: string;
  packet: JudgePacket;
  schemaPath: string;
}): string[] {
  const { model, packet, schemaPath } = options;
  const images = [...packet.screenshots['entry-a'], ...packet.screenshots['entry-b']];

  return [
    'exec',
    '-m',
    model,
    ...images.flatMap((image) => ['-i', image]),
    '--output-schema',
    schemaPath,
    '--json',
    '-s',
    'read-only',
    packet.prompt,
  ];
}

export function createCodexJudgeRunner(options: CodexJudgeOptions) {
  return async (packet: JudgePacket): Promise<JudgeRunOutcome> => {
    const argv = buildJudgeArgv({
      model: options.model,
      packet,
      schemaPath: await options.schemaPath(packet),
    });

    const started = Date.now();
    const outcome = await options.run(argv);
    const latencyMs = Date.now() - started;

    if (outcome.status !== 0) {
      return {
        error: `codex exec exited ${outcome.status ?? 'without a status'}.`,
        response: null,
        usage: { ...unknownUsage, latencyMs },
      };
    }

    const values = readJsonValues(outcome.stdout);
    const response = findResponse(values);
    const usage = collectUsage(values);

    return {
      error: response ? undefined : 'The judge stream carried no schema-shaped response.',
      response,
      // Wall-clock latency is ours to measure; cost stays whatever the provider
      // reported, which under subscription auth is nothing at all.
      usage: { ...usage, latencyMs: usage.latencyMs ?? latencyMs },
    };
  };
}
