import { describe, expect, it } from 'vitest';

import {
  buildClaudeJudgeArgv,
  createClaudeJudgeRunner,
} from '../../src/eval/claude-judge-client.ts';
import { buildJudgeArgv, createCodexJudgeRunner } from '../../src/eval/codex-judge-client.ts';
import {
  collectUsage,
  findResponse,
  rubricOutputSchema,
} from '../../src/eval/judge-response-parser.ts';
import type { JudgePacket } from '../../src/eval/pairwise-judge.ts';

/**
 * The two clients answer to one contract and to two different CLIs, and the
 * gap between those is where this phase's first real defect lived: the pinned
 * judge was invoked with a flag its CLI rejects, and parsed with a reader
 * written for the other provider's stream.
 */
const packet = (): JudgePacket => ({
  assignment: { 'entry-a': 'baseline', 'entry-b': 'candidate' },
  caseId: 'dev-one',
  order: 'ab',
  prompt: 'Compare entry-a and entry-b.',
  rubricIds: ['RUB-HIER-001', 'RUB-SLOP-001'],
  screenshots: {
    'entry-a': ['judge/dev-one/ab/entry-a-1.png'],
    'entry-b': ['judge/dev-one/ab/entry-b-1.png'],
  },
});

const answer = {
  criteria: [
    { evidence: 'Heading order is flat in entry-b.', rubric: 'RUB-HIER-001', winner: 'entry-a' },
    { evidence: 'entry-a avoids gradient filler.', rubric: 'RUB-SLOP-001', winner: 'entry-a' },
  ],
  overall: 'entry-a',
};

/** A Codex JSONL stream: banner lines, an answer, and two usage events. */
const codexStream = (body: unknown) =>
  [
    'Codex banner line',
    JSON.stringify({ msg: { output: JSON.stringify(body) } }),
    JSON.stringify({
      msg: {
        last_token_usage: { input_tokens: 5, output_tokens: 2, total_tokens: 7 },
        total_token_usage: { input_tokens: 5000, output_tokens: 900, total_tokens: 5900 },
      },
    }),
  ].join('\n');

/** The shape `claude -p --output-format json` actually returns. */
const claudeEnvelope = (result: string) =>
  JSON.stringify({
    duration_ms: 4210,
    result,
    subtype: 'success',
    total_cost_usd: 0.0123,
    type: 'result',
    usage: { cache_read_input_tokens: 40, input_tokens: 120, output_tokens: 60 },
  });

describe('codex judge client', () => {
  it('passes every screenshot and pins the read-only sandbox', () => {
    const argv = buildJudgeArgv({
      model: 'gpt-5.6-sol',
      packet: packet(),
      schemaPath: 'rubric-schema.json',
    });

    expect(argv.slice(0, 3)).toEqual(['exec', '-m', 'gpt-5.6-sol']);
    expect(argv.filter((entry) => entry === '-i')).toHaveLength(2);
    expect(argv[argv.indexOf('--output-schema') + 1]).toBe('rubric-schema.json');
    expect(argv).toContain('--json');
    // A judge that can write is a judge that can edit what it grades.
    expect(argv[argv.indexOf('-s') + 1]).toBe('read-only');
    expect(argv.at(-1)).toBe('Compare entry-a and entry-b.');
  });

  it('asks for a schema covering this case only', async () => {
    const seen: string[] = [];
    const runner = createCodexJudgeRunner({
      model: 'gpt-5.6-sol',
      run: async (argv) => {
        seen.push(argv[argv.indexOf('--output-schema') + 1] as string);
        return { status: 0, stdout: codexStream(answer) };
      },
      schemaPath: (entry) => `schema/${entry.caseId}.json`,
    });

    await runner(packet());

    expect(seen).toEqual(['schema/dev-one.json']);
  });

  it('records cumulative usage regardless of key order', async () => {
    const runner = createCodexJudgeRunner({
      model: 'gpt-5.6-sol',
      run: async () => ({ status: 0, stdout: codexStream(answer) }),
      schemaPath: () => 'schema.json',
    });

    const outcome = await runner(packet());

    expect(outcome.response?.overall).toBe('entry-a');
    expect(outcome.usage.totalTokens).toBe(5900);
    // Subscription auth reports no cost, and unknown never becomes zero.
    expect(outcome.usage.costUsd).toBeNull();
  });

  it('reports a non-zero exit as a failure rather than a tie', async () => {
    const runner = createCodexJudgeRunner({
      model: 'gpt-5.6-sol',
      run: async () => ({ status: 1, stdout: '' }),
      schemaPath: () => 'schema.json',
    });

    const outcome = await runner(packet());

    expect(outcome.response).toBeNull();
    expect(outcome.error).toContain('exited 1');
  });
});

describe('claude judge client', () => {
  it('carries the schema in the prompt and allows no tool but Read', () => {
    const argv = buildClaudeJudgeArgv({ model: 'claude-opus-5', packet: packet() });
    const toolsFlag = argv.indexOf('--allowedTools');
    const prompt = argv.find((entry) => entry.includes('"RUB-SLOP-001"')) ?? '';

    expect(argv.slice(0, 5)).toEqual(['-p', '--model', 'claude-opus-5', '--output-format', 'json']);
    expect(argv[toolsFlag + 1]).toBe('Read');
    // The kebab-case spelling is not a synonym; the CLI rejects it as an unknown
    // option before it reads anything else.
    expect(argv).not.toContain('--allowed-tools');
    // `--allowedTools` is variadic, so a prompt after it is swallowed as another
    // tool name and the CLI exits asking for input it was already handed. The
    // ordering is the contract, not an accident of construction.
    expect(prompt).not.toBe('');
    expect(argv.indexOf(prompt)).toBeLessThan(toolsFlag);
    // Rejected by the installed CLI, and every mode it does accept would only
    // widen the allow-list this contract deliberately keeps at one tool.
    expect(argv).not.toContain('--permission-mode');
  });

  it('reads a fenced answer out of the real envelope', async () => {
    const runner = createClaudeJudgeRunner({
      model: 'claude-opus-5',
      run: async () => ({
        status: 0,
        stdout: claudeEnvelope(
          `Here is my judgement:\n\n\`\`\`json\n${JSON.stringify(answer)}\n\`\`\`\n`
        ),
      }),
    });

    const outcome = await runner(packet());

    expect(outcome.response?.criteria).toHaveLength(2);
    expect(outcome.usage.inputTokens).toBe(120);
    expect(outcome.usage.outputTokens).toBe(60);
    expect(outcome.usage.cachedTokens).toBe(40);
    expect(outcome.usage.costUsd).toBe(0.0123);
  });

  it('keeps tokens even though cost sits at a shallower level', () => {
    const usage = collectUsage(JSON.parse(claudeEnvelope('{}')));

    expect(usage.totalTokens).toBeNull();
    expect(usage.inputTokens).toBe(120);
    expect(usage.costUsd).toBe(0.0123);
  });
});

describe('judge response reader', () => {
  it('requires evidence for every rubric before a preference', () => {
    const schema = rubricOutputSchema(['RUB-HIER-001', 'RUB-SLOP-001']) as any;

    expect(schema.required).toEqual(['criteria', 'overall']);
    expect(schema.properties.criteria.minItems).toBe(2);
    expect(schema.properties.criteria.items.required).toEqual(['rubric', 'evidence', 'winner']);
  });

  it('refuses coerced evidence rather than stringifying it into a pass', () => {
    const numericEvidence = {
      criteria: [{ evidence: 0.5, rubric: 'RUB-HIER-001', winner: 'entry-a' }],
      overall: 'entry-a',
    };

    expect(findResponse(numericEvidence)).toBeNull();
  });

  it('refuses an unknown winner label', () => {
    expect(
      findResponse({
        criteria: [{ evidence: 'clear', rubric: 'RUB-HIER-001', winner: 'candidate' }],
        overall: 'entry-a',
      })
    ).toBeNull();
  });
});
