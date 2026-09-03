import { collectUsage, findResponse, rubricOutputSchema } from './judge-response-parser.ts';
import { unknownUsage, type JudgePacket, type JudgeRunOutcome } from './pairwise-judge.ts';

/**
 * The judge client for the Anthropic family, which is the pinned judge for this
 * cycle (plan decision 9) precisely because the subject is Codex.
 *
 * The Claude CLI has no `--output-schema` and no `-i`, so the two guarantees the
 * Codex contract gets from flags are carried in the prompt instead: the rubric
 * schema is stated inline, and the rendered PNGs are named as files to open with
 * a read-only tool allowance. What must not differ between clients is the
 * guarantee itself — evidence before score, pixels as well as code, and no write
 * access from a process that is grading this repository's own output.
 *
 * Because the schema is a request here rather than an enforced decode, the
 * reply arrives as free text: it may be fenced, prefixed, or both. The shared
 * reader handles that. What it will not do is accept a wrong-shaped answer.
 */
export interface ClaudeJudgeOptions {
  model: string;
  run: (argv: readonly string[]) => Promise<{ stdout: string; status: number | null }>;
}

export function buildClaudeJudgeArgv(options: { model: string; packet: JudgePacket }): string[] {
  const { model, packet } = options;

  return [
    '-p',
    '--model',
    model,
    '--output-format',
    'json',
    // The prompt is positional and must precede the tool allow-list. That flag
    // is variadic, so a prompt placed after it is consumed as another tool name
    // and the CLI exits asking for input it was already given.
    renderPrompt(packet),
    // The judge reads images and nothing else. A judge that can edit is a judge
    // that can change what it is grading. No permission-mode flag: `-p` with an
    // explicit allow-list already denies the rest, and every mode this CLI
    // accepts would only widen that.
    //
    // Spelled camelCase because that is the flag the CLI actually defines; the
    // kebab-case form is rejected outright as an unknown option.
    '--allowedTools',
    'Read',
  ];
}

export function createClaudeJudgeRunner(options: ClaudeJudgeOptions) {
  return async (packet: JudgePacket): Promise<JudgeRunOutcome> => {
    const started = Date.now();
    const outcome = await options.run(buildClaudeJudgeArgv({ model: options.model, packet }));
    const latencyMs = Date.now() - started;

    if (outcome.status !== 0) {
      return {
        error: `claude -p exited ${outcome.status ?? 'without a status'}.`,
        response: null,
        usage: { ...unknownUsage, latencyMs },
      };
    }

    let envelope: unknown;

    try {
      envelope = JSON.parse(outcome.stdout);
    } catch {
      envelope = outcome.stdout;
    }

    // Tokens sit under `usage`, cost sits at the top level, and the answer sits
    // inside `result` as text. Searching the whole envelope, rather than one
    // agreed path, is what keeps this honest when the CLI adds a field.
    const response = findResponse(envelope);
    const usage = collectUsage(envelope);

    return {
      error: response ? undefined : 'The judge output carried no schema-shaped response.',
      response,
      usage: { ...usage, latencyMs: usage.latencyMs ?? latencyMs },
    };
  };
}

function renderPrompt(packet: JudgePacket): string {
  return [
    packet.prompt,
    '',
    '## Rendered output',
    '',
    'Open each render named above with the Read tool before judging. Judge what',
    'renders, not only what the code says.',
    '',
    '## Required answer',
    '',
    'Reply with JSON only, matching this schema exactly:',
    '',
    '```json',
    JSON.stringify(rubricOutputSchema(packet.rubricIds), null, 2),
    '```',
  ].join('\n');
}
