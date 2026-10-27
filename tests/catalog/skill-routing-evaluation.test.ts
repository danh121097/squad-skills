import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { routingEvaluationCases } from '../../src/catalog/skill-routing-evaluation-cases.ts';
import { skillEvaluationCases } from '../../src/catalog/skill-evaluation-cases.ts';
import {
  prepareSkillEvaluation,
  summarizeSkillEvaluations,
} from '../../src/catalog/skill-evaluation.ts';

describe('routing evaluation packets and evidence', () => {
  it('keeps balanced fixed splits, near-miss pairs and no-skill cases reachable', async () => {
    expect(new Set(skillEvaluationCases.map((item) => item.id)).size).toBe(
      skillEvaluationCases.length
    );
    expect(new Set(routingEvaluationCases.map((item) => item.prompt)).size).toBe(
      routingEvaluationCases.length
    );
    for (const split of ['train', 'validation']) {
      const cases = routingEvaluationCases.filter((item) => item.split === split);
      expect(cases).toHaveLength(10);
      expect(cases.every((item) => !item.id.includes(split))).toBe(true);
      expect(cases.filter((item) => item.reading!.required.length === 0)).toHaveLength(2);
      const roles = cases.flatMap((item) => item.reading!.required);
      expect(new Set(roles).size).toBe(8);
      for (const role of roles) expect(await readFile(role, 'utf8')).not.toBe('');
    }
  });

  it.each(routingEvaluationCases)(
    '$id rejects the wrong activation even when output checks claim success',
    (scenario) => {
      const read = (file: string) => ({
        path: file,
        context: 'trial',
        reason: 'initial',
        evidence: 'test transcript: entrypoint read',
      });
      const record = {
        scenario: scenario.id,
        fixtureHash: 'fixture',
        catalogHash: 'catalog',
        runtime: 'codex',
        model: 'test-model',
        effort: 'medium',
        sample: 1,
        elapsedMs: 100,
        totalTokens: null,
        checks: Object.fromEntries(
          Object.keys(scenario.criteria).map((key) => [
            key,
            { passed: true, evidence: 'test transcript' },
          ])
        ),
        reads: scenario.reading!.required.map(read),
      };
      expect(summarizeSkillEvaluations([record])[0]).toMatchObject({
        passed: 1,
        split: scenario.split,
      });
      const wrong = { ...record, reads: [read(scenario.reading!.forbidden[0]!)] };
      expect(summarizeSkillEvaluations([wrong])[0]).toMatchObject({
        passed: 0,
        tokensPerPassingTask: null,
      });
    }
  );

  it('keeps the held-out label and expected route outside worker input', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'squad-routing-eval-'));
    try {
      const scenario = routingEvaluationCases.find((item) => item.split === 'validation')!;
      const destination = path.join(root, 'packet');
      const metadata = await prepareSkillEvaluation(process.cwd(), scenario.id, destination);
      expect(metadata.split).toBe('validation');
      const fixture = {
        prompt: scenario.prompt,
        files: scenario.files,
        criteria: scenario.criteria,
        reading: scenario.reading,
        setup: scenario.setup,
      };
      const digest = (value: unknown) =>
        createHash('sha256').update(JSON.stringify(value)).digest('hex');
      expect(metadata.fixtureHash).toBe(digest({ ...fixture, split: scenario.split }));
      expect(metadata.fixtureHash).not.toBe(digest(fixture));
      expect(await readFile(path.join(destination, 'prompt.txt'), 'utf8')).toBe(
        scenario.prompt + '\n'
      );
      expect(
        JSON.parse(await readFile(path.join(destination, 'reading-rubric.json'), 'utf8'))
      ).toEqual(scenario.reading);
      await expect(
        readFile(path.join(destination, 'workspace/metadata.json'))
      ).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
