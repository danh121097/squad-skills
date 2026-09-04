import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

import { runChecks, type Check } from '../../evals/fixtures/gate-corpus/check.ts';

/**
 * The corpus states its own ground truth, and this is what verifies the claim.
 *
 * A seeded defect nobody can detect is not a defect, and a `defect.yml` that
 * drifts from the checks beside it turns the corpus into decoration. Both are
 * caught here rather than at the point a lane consumes them, because a lane run
 * costs a model invocation and this costs a millisecond.
 *
 * It runs inside `pnpm test` even though no evaluation lane consumes the corpus
 * yet. The corpus is the shared asset the QA and Code Review lanes are both
 * planned on: QA is graded on whether a produced test fails against `buggy.ts`
 * and passes against `fixed.ts`, Code Review on whether it names the defect
 * `defect.yml` records. Until then this check is what keeps it honest.
 */
const corpusRoot = path.join(process.cwd(), 'evals/fixtures/gate-corpus');

interface DefectRecord {
  class: string;
  detected_by: string[];
  file: string;
  id: string;
  summary: string;
  survives: string[];
  symbol: string;
}

async function listCases(): Promise<string[]> {
  const entries = await readdir(corpusRoot, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function loadCase(caseId: string): Promise<{
  buggy: Check[];
  defect: DefectRecord;
  fixed: Check[];
}> {
  const caseRoot = path.join(corpusRoot, caseId);
  const { defineChecks } = await import(path.join(caseRoot, 'reference-checks.ts'));
  const defect = parse(await readFile(path.join(caseRoot, 'defect.yml'), 'utf8')) as DefectRecord;

  return {
    buggy: defineChecks(await import(path.join(caseRoot, 'buggy.ts'))),
    defect,
    fixed: defineChecks(await import(path.join(caseRoot, 'fixed.ts'))),
  };
}

const caseIds = await listCases();

describe('gate corpus', () => {
  it('ships at least one case, so the corpus is not silently empty', () => {
    expect(caseIds.length).toBeGreaterThan(0);
  });

  describe.each(caseIds)('%s', (caseId) => {
    it('passes every reference check against the fixed source', async () => {
      const { fixed } = await loadCase(caseId);

      expect(await runChecks(fixed)).toEqual([]);
    });

    it('fails exactly the checks its defect record claims detect it', async () => {
      const { buggy, defect } = await loadCase(caseId);

      expect(await runChecks(buggy)).toEqual(defect.detected_by);
    });

    it('accounts for every reference check in the defect record', async () => {
      const { defect, fixed } = await loadCase(caseId);
      const accounted = [...defect.detected_by, ...defect.survives].sort();

      expect(accounted).toEqual(fixed.map((check) => check.name).sort());
    });

    it('names the case directory in its defect record', async () => {
      const { defect } = await loadCase(caseId);

      expect(defect.id).toBe(caseId);
    });

    it('carries a brief that states acceptance criteria', async () => {
      const brief = await readFile(path.join(corpusRoot, caseId, 'brief.md'), 'utf8');

      expect(brief).toContain('Acceptance criteria:');
    });
  });
});
