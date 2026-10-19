import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { skillEvaluationCases } from '../../src/catalog/skill-evaluation-cases.ts';
import {
  prepareSkillEvaluation,
  summarizeSkillEvaluations,
} from '../../src/catalog/skill-evaluation.ts';

const scenario = skillEvaluationCases.find((item) => item.id === 'subagent-without-worktree')!;
const read = (file: string, context = 'lead', reason = 'initial') => ({
  path: file,
  context,
  reason,
  evidence: 'transcript: observed file read',
});
const row = () => ({
  scenario: scenario.id,
  fixtureHash: 'fixture',
  catalogHash: 'catalog',
  runtime: 'codex',
  model: 'observed-model',
  effort: 'medium',
  sample: 1,
  elapsedMs: 100,
  totalTokens: 100,
  checks: Object.fromEntries(
    Object.keys(scenario.criteria).map((key) => [
      key,
      { passed: true, evidence: 'transcript: verified artifact' },
    ])
  ),
  reads: scenario.reading!.required.map((file) => read(file)),
});

describe('observed skill reading', () => {
  it('rejects missing traces and counts omitted or unrelated files as failed trials', () => {
    expect(() => summarizeSkillEvaluations([{ ...row(), reads: undefined }])).toThrow(
      'Missing reading evidence'
    );
    const missing = summarizeSkillEvaluations([{ ...row(), reads: [] }])[0]!;
    expect(missing.passed).toBe(0);
    expect(missing.reading?.missingRequired).toBe(3);
    const unrelated = summarizeSkillEvaluations([
      { ...row(), reads: [...row().reads, read(scenario.reading!.forbidden[0]!)] },
    ])[0]!;
    expect(unrelated.passed).toBe(0);
    expect(unrelated.reading?.forbiddenReads).toBe(1);
    expect(unrelated.tokensPerPassingTask).toBeNull();
  });

  it('distinguishes repeated reads from fresh worker context and justified recovery', () => {
    const first = row().reads[0]!;
    const repeated = summarizeSkillEvaluations([{ ...row(), reads: [...row().reads, first] }])[0]!;
    expect(repeated.passed).toBe(0);
    expect(repeated.reading).toMatchObject({ repeatedReads: 1, unjustifiedRereads: 1 });
    const recovered = summarizeSkillEvaluations([
      {
        ...row(),
        reads: [
          ...row().reads,
          read(first.path, 'worker'),
          read(first.path, 'lead', 'context-recovery'),
        ],
      },
    ])[0]!;
    expect(recovered.passed).toBe(1);
    expect(recovered.reading).toMatchObject({ repeatedReads: 1, unjustifiedRereads: 0 });
  });

  it.each([
    { path: 'skills/../secret' },
    { path: 'skills//role/SKILL.md' },
    { path: '/absolute/skills/role/SKILL.md' },
    { context: '' },
    { evidence: '' },
    { reason: 'because' },
  ])('rejects invalid read evidence %j', (override) => {
    expect(() =>
      summarizeSkillEvaluations([{ ...row(), reads: [{ ...row().reads[0], ...override }] }])
    ).toThrow('Each skill read');
  });

  it('keeps reading rubrics outside worker input and includes them in fixture identity', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'squad-reading-eval-'));
    try {
      const metadata = await prepareSkillEvaluation(
        process.cwd(),
        scenario.id,
        path.join(root, 'packet')
      );
      const rubric = JSON.parse(
        await readFile(path.join(root, 'packet/reading-rubric.json'), 'utf8')
      );
      expect(rubric).toEqual(scenario.reading);
      expect(await readFile(path.join(root, 'packet/prompt.txt'), 'utf8')).toBe(
        scenario.prompt + '\n'
      );
      const { createHash } = await import('node:crypto');
      const digest = (value: unknown) =>
        createHash('sha256').update(JSON.stringify(value)).digest('hex');
      expect(metadata.fixtureHash).toBe(
        digest({
          prompt: scenario.prompt,
          files: scenario.files,
          criteria: scenario.criteria,
          reading: scenario.reading,
          setup: scenario.setup,
        })
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
