import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { skillEvaluationCases } from './skill-evaluation-cases.ts';
import { measureSkillPayload } from './skill-payload-measurement.ts';
import { skillTaskTypes } from './skill-task-types.ts';

/** Creates a fresh, reviewable packet; never launches a model or overwrites a workspace. */
export async function prepareSkillEvaluation(projectRoot: string, id: string, destination: string) {
  const scenario = skillEvaluationCases.find((item) => item.id === id);
  if (!scenario) throw new Error(`Unknown scenario: ${id}`);
  const root = path.resolve(destination);
  const readme = await readFile(path.join(projectRoot, 'README.md'), 'utf8');
  const catalog = await Promise.all(
    Object.keys(skillTaskTypes)
      .sort()
      .map(async (skill) => {
        const measured = await measureSkillPayload({
          skillRoot: path.join(projectRoot, 'skills', skill),
        });
        return [skill, measured.payloadHash];
      })
  );
  const digest = (value: unknown) =>
    createHash('sha256').update(JSON.stringify(value)).digest('hex');
  const metadata = {
    scenario: id,
    fixtureHash: digest({
      prompt: scenario.prompt,
      files: scenario.files,
      criteria: scenario.criteria,
      ...(scenario.setup === undefined ? {} : { setup: scenario.setup }),
    }),
    catalogHash: digest({ skills: catalog, readme }),
  };
  // mkdir without recursive refuses an existing target, including one containing user files.
  await mkdir(root);
  const workspace = path.join(root, 'workspace');
  await mkdir(workspace);
  for (const [file, content] of Object.entries(scenario.files)) {
    const target = path.join(workspace, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  const skills = id === 'missing-peer' ? ['squads-team'] : Object.keys(skillTaskTypes);
  for (const skill of skills) {
    await cp(path.join(projectRoot, 'skills', skill), path.join(root, 'skills', skill), {
      recursive: true,
    });
  }
  if (scenario.setup) await writeFile(path.join(root, 'setup.txt'), scenario.setup + '\n');
  await writeFile(path.join(root, 'prompt.txt'), scenario.prompt + '\n');
  await writeFile(path.join(root, 'README.md'), readme);
  // Keep grading criteria outside the worker's workspace and prompt.
  await writeFile(
    path.join(root, 'rubric.json'),
    JSON.stringify(scenario.criteria, null, 2) + '\n'
  );
  await writeFile(path.join(root, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
  return metadata;
}

export interface EvaluationRecord {
  scenario: string;
  fixtureHash: string;
  catalogHash: string;
  runtime: 'claude' | 'codex';
  model: string;
  effort: string;
  sample: number;
  elapsedMs: number;
  /** Runtime-reported total; null means unavailable, never zero. */
  totalTokens: number | null;
  checks: Record<string, { passed: boolean; evidence: string }>;
}

/** Validate recorded observations, not model claims. Missing evidence is not a passing run. */
export function summarizeSkillEvaluations(input: unknown) {
  if (!Array.isArray(input) || input.length === 0)
    throw new Error('Expected non-empty result array.');
  const groups = new Map<string, EvaluationRecord[]>();
  const seen = new Set<string>();
  const fixtures = new Map<string, string>();
  for (const raw of input) {
    const row = raw as EvaluationRecord;
    const scenario = skillEvaluationCases.find((item) => item.id === row?.scenario);
    if (!scenario || !['claude', 'codex'].includes(row.runtime))
      throw new Error('Unknown scenario/runtime.');
    for (const field of ['fixtureHash', 'catalogHash', 'model', 'effort'] as const) {
      if (typeof row[field] !== 'string' || !row[field].trim())
        throw new Error(`Missing ${field}.`);
    }
    if (
      !Number.isInteger(row.sample) ||
      row.sample < 1 ||
      !Number.isFinite(row.elapsedMs) ||
      row.elapsedMs < 0
    ) {
      throw new Error('Invalid sample or elapsedMs.');
    }
    if (row.totalTokens !== null && (!Number.isInteger(row.totalTokens) || row.totalTokens < 0)) {
      throw new Error('totalTokens must be a non-negative integer or null.');
    }
    const expectedKeys = Object.keys(scenario.criteria);
    const actualKeys = row.checks ? Object.keys(row.checks) : [];
    if (
      !row.checks ||
      actualKeys.length !== expectedKeys.length ||
      expectedKeys.some((key) => !Object.hasOwn(row.checks, key))
    ) {
      throw new Error(`Incomplete criteria for ${row.scenario}.`);
    }
    for (const check of Object.values(row.checks)) {
      if (
        !check ||
        typeof check.passed !== 'boolean' ||
        typeof check.evidence !== 'string' ||
        !check.evidence.trim()
      ) {
        throw new Error('Every criterion needs an observed result and evidence.');
      }
    }
    const fixture = fixtures.get(row.scenario);
    if (fixture !== undefined && fixture !== row.fixtureHash)
      throw new Error('Cannot compare different fixtures.');
    fixtures.set(row.scenario, row.fixtureHash);
    const key = JSON.stringify([row.scenario, row.runtime, row.model, row.effort, row.catalogHash]);
    const sampleKey = `${key}:${row.sample}`;
    if (seen.has(sampleKey)) throw new Error('Duplicate sample.');
    seen.add(sampleKey);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.values()].map((rows) => {
    const first = rows[0]!;
    const passed = rows.filter((row) =>
      Object.values(row.checks).every((check) => check.passed)
    ).length;
    const known = rows.every((row) => row.totalTokens !== null);
    const tokens = known ? rows.reduce((sum, row) => sum + row.totalTokens!, 0) : null;
    return {
      scenario: first.scenario,
      runtime: first.runtime,
      model: first.model,
      effort: first.effort,
      catalogHash: first.catalogHash,
      fixtureHash: first.fixtureHash,
      samples: rows.length,
      passed,
      passRate: passed / rows.length,
      meanElapsedMs: rows.reduce((sum, row) => sum + row.elapsedMs, 0) / rows.length,
      totalTokens: tokens,
      tokensPerPassingTask: tokens === null || passed === 0 ? null : tokens / passed,
    };
  });
}

export async function readEvaluationResults(file: string) {
  return summarizeSkillEvaluations(JSON.parse(await readFile(file, 'utf8')) as unknown);
}
