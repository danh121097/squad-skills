import { execFile } from 'node:child_process';
import { appendFile, cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createSkillPayloadReport,
  compareSkillPayloadReports,
} from '../../src/catalog/skill-payload-report.ts';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('payload baseline comparison', () => {
  it('measures both catalogs on the same named paths and exposes only affected deltas through the CLI', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'squad-payload-report-'));
    roots.push(root);
    await cp('skills', path.join(root, 'skills'), { recursive: true });
    const baseline = await createSkillPayloadReport(process.cwd());
    const reference = 'interactive-graphics-and-runtime-animation.md';
    await appendFile(
      path.join(root, 'skills/squad-frontend/references', reference),
      '\nFive additional words for comparison.\n'
    );
    const { stdout } = await promisify(execFile)(process.execPath, [
      'scripts/report-skill-payloads.ts',
      '--root',
      root,
      '--baseline-root',
      process.cwd(),
    ]);
    const report = JSON.parse(stdout) as Awaited<ReturnType<typeof createSkillPayloadReport>> & {
      comparison: { skills: ReturnType<typeof compareSkillPayloadReports> };
    };
    expect(report.readingPathsHash).toBe(baseline.readingPathsHash);
    const frontend = report.comparison.skills.find((item) => item.skill === 'squad-frontend')!;
    expect(frontend.entrypointWordsDelta).toBe(0);
    expect(frontend.candidatePayloadHash).not.toBe(frontend.baselinePayloadHash);
    for (const skill of report.comparison.skills) {
      for (const task of skill.taskLoads) {
        expect(task.deltaWords).toBe(
          skill.skill === 'squad-frontend' && task.references.includes(reference) ? 5 : 0
        );
      }
    }
    expect(frontend.taskLoads.find((task) => task.id === 'ui-motion')?.references).not.toContain(
      reference
    );
    expect(
      frontend.taskLoads.find((task) => task.id === 'interactive-graphics-and-games')?.deltaWords
    ).toBe(5);
  });

  it('refuses a changed path population and keeps workflow overlap distinct from fresh invocation cost', async () => {
    const report = await createSkillPayloadReport(process.cwd());
    expect(() =>
      compareSkillPayloadReports({ ...report, readingPathsHash: 'other-paths' }, report)
    ).toThrow('Reading paths differ');
    const shared = report.workflows.find((item) => item.id === 'greenfield-settled-stack')!;
    expect(shared.freshInvocationWords).toBeGreaterThan(shared.uniquePayloadWords);
    expect(report.workflows.find((item) => item.id === 'routing-git-question')).toMatchObject({
      uniquePayloadWords: 0,
      freshInvocationWords: 0,
    });
    expect(report.unit).toContain('not tokens');
  });
});
