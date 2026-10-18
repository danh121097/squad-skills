import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import {
  prepareSkillEvaluation,
  summarizeSkillEvaluations,
} from '../../src/catalog/skill-evaluation.ts';
import { skillEvaluationCases } from '../../src/catalog/skill-evaluation-cases.ts';
import { skillTaskTypes } from '../../src/catalog/skill-task-types.ts';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
const scenario = skillEvaluationCases.find((item) => item.id === 'proven-regression')!;
const record = (sample: number, totalTokens: number | null = 100) => ({
  scenario: scenario.id,
  fixtureHash: 'same-fixture',
  catalogHash: 'candidate',
  runtime: 'codex',
  model: 'unchanged-model',
  effort: 'unchanged-effort',
  sample,
  elapsedMs: 1000,
  totalTokens,
  checks: Object.fromEntries(
    Object.keys(scenario.criteria).map((key) => [
      key,
      { passed: true, evidence: 'transcript: command and observed artifact' },
    ])
  ),
});

describe('skill evaluation evidence', () => {
  it.each(['proven-regression', 'ambiguous-regression'])(
    '%s fixture goes red on the defect and green on its repair',
    async (id) => {
      const root = await mkdtemp(path.join(tmpdir(), 'skill-eval-repro-'));
      roots.push(root);
      await prepareSkillEvaluation(process.cwd(), id, path.join(root, 'packet'));
      const cwd = path.join(root, 'packet/workspace');
      const run = () => promisify(execFile)(process.execPath, ['--test'], { cwd });
      await expect(run()).rejects.toMatchObject({
        code: 1,
        stdout: expect.stringContaining('ERR_ASSERTION'),
      });
      const file = path.join(cwd, 'counter.mjs');
      const source = await readFile(file, 'utf8');
      await writeFile(
        file,
        source
          .replace('value + 2', 'value + 1')
          .replace(' target.addEventListener("click", () => increment());', '')
      );
      expect((await run()).stdout).toContain('pass 1');
    }
  );

  it('includes failed-run cost and keeps unknown usage distinct from zero', () => {
    const failed = record(2, 200);
    failed.checks.repair = { passed: false, evidence: 'counter remains wrong' };
    const [summary] = summarizeSkillEvaluations([record(1), failed]);
    expect(summary).toMatchObject({
      samples: 2,
      passed: 1,
      passRate: 0.5,
      totalTokens: 300,
      tokensPerPassingTask: 300,
    });
    expect(summarizeSkillEvaluations([record(1, null)])[0]?.totalTokens).toBeNull();
    expect(summarizeSkillEvaluations([failed])[0]?.tokensPerPassingTask).toBeNull();
  });

  it('refuses incomplete or incomparable evidence instead of reporting a pass', () => {
    expect(() => summarizeSkillEvaluations([{ ...record(1), checks: {} }])).toThrow(
      'Incomplete criteria'
    );
    expect(() => summarizeSkillEvaluations([record(1), record(1)])).toThrow('Duplicate sample');
    expect(() =>
      summarizeSkillEvaluations([record(1), { ...record(2), fixtureHash: 'different' }])
    ).toThrow('different fixtures');
    expect(() => summarizeSkillEvaluations([{ ...record(1), totalTokens: undefined }])).toThrow(
      'totalTokens'
    );
    const noEvidence = record(1);
    noEvidence.checks.repair = { passed: true, evidence: '' };
    expect(() => summarizeSkillEvaluations([noEvidence])).toThrow('evidence');
  });

  it('rejects one joined key in place of the individual rubric criteria', () => {
    const joinedKey = Object.keys(scenario.criteria).sort().join(',');
    const malformed = {
      ...record(1),
      checks: {
        [joinedKey]: { passed: true, evidence: 'Only one combined criterion was graded.' },
      },
    };

    expect(() => summarizeSkillEvaluations([malformed])).toThrow('Incomplete criteria');
  });

  it('keeps model, runtime and catalog comparisons in separate groups', () => {
    const rows = [
      record(1),
      { ...record(1), catalogHash: 'baseline' },
      { ...record(1), runtime: 'claude' },
    ];
    expect(summarizeSkillEvaluations(rows)).toHaveLength(3);
  });

  it('prepares repeatable packets without overwriting files or exposing the rubric in the prompt', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'skill-eval-'));
    roots.push(root);
    const first = await prepareSkillEvaluation(
      process.cwd(),
      scenario.id,
      path.join(root, 'first')
    );
    const second = await prepareSkillEvaluation(
      process.cwd(),
      scenario.id,
      path.join(root, 'second')
    );
    expect(first).toEqual(second);
    expect(await readFile(path.join(root, 'first/workspace/counter.mjs'), 'utf8')).toBe(
      scenario.files['counter.mjs']
    );
    expect(await readFile(path.join(root, 'first/prompt.txt'), 'utf8')).toBe(
      scenario.prompt + '\n'
    );
    await expect(
      prepareSkillEvaluation(process.cwd(), scenario.id, path.join(root, 'first'))
    ).rejects.toThrow();
    await prepareSkillEvaluation(process.cwd(), 'missing-peer', path.join(root, 'missing'));
    expect(await readdir(path.join(root, 'missing/skills'))).toEqual(['squads-team']);
  });

  it('accounts for real routed references in each scenario and complete repair path', () => {
    for (const { loads } of skillEvaluationCases) {
      for (const { skill, task } of loads)
        expect(skillTaskTypes[skill]?.some((item) => item.id === task)).toBe(true);
    }
    for (const task of skillTaskTypes['squad-fix']!) {
      expect(task.references).toEqual(
        expect.arrayContaining([
          'bug-routing-and-ownership.md',
          'diagnosis-root-cause-and-fix-loop.md',
          'quality-bar-and-preflight.md',
          'verification-qa-review-and-reporting.md',
        ])
      );
    }
    const adaptive = skillTaskTypes['squad-designer']!.find(
      (task) => task.id === 'adaptive-web-split-view'
    )!;
    expect(adaptive.references).toContain('platform-web-foundations-and-motion.md');
    expect(adaptive.references).toContain('design-system-ux-accessibility-and-handoff.md');
  });
});
