import { describe, expect, it, vi } from 'vitest';

import { runJudging, type JudgingCaseInput } from '../../src/eval/judging-orchestrator.ts';
import {
  unknownUsage,
  type JudgeResponse,
  type JudgeRunner,
} from '../../src/eval/pairwise-judge.ts';

/**
 * The orchestration decisions, none of which the pure modules can hold on their
 * own: what is never sent to a judge, what order staging and packet building
 * happen in, and what stops a run that is spending money.
 */
const rubricIds = ['RUB-HIER-001'];

const arm = (blocking: boolean, source: string) => ({
  blocking,
  files: [{ path: 'panel.tsx', source }],
  screenshots: ['/runs/panel.png'],
});

const input = (caseId: string, blocking = false): JudgingCaseInput => ({
  baseline: arm(blocking, 'old'),
  candidate: arm(false, 'new'),
  caseId,
  rubricIds,
  seed: 1,
});

const answer: JudgeResponse = {
  criteria: [{ evidence: 'clearer hierarchy', rubric: 'RUB-HIER-001', winner: 'entry-b' }],
  overall: 'entry-b',
};

const models = {
  authoringAssistance: 'maintainer',
  judge: 'anthropic/claude-opus-5',
  subject: 'codex/gpt-5.6-sol',
};

const runner = (costUsd: number | null = null): JudgeRunner =>
  vi.fn(async (packet) => ({
    response:
      packet.order === 'ab'
        ? answer
        : {
            ...answer,
            criteria: [{ ...answer.criteria[0]!, winner: 'entry-a' as const }],
            overall: 'entry-a' as const,
          },
    usage: { ...unknownUsage, costUsd },
  }));

const options = (overrides: Partial<Parameters<typeof runJudging>[0]> = {}) => ({
  cases: [input('dev-one')],
  cycleId: 'cycle-1',
  lane: 'calibration',
  models,
  regressions: [],
  run: runner(),
  seed: 1,
  skill: 'example-skill',
  stageScreenshot: async ({ index, order, side }: { index: number; order: string; side: string }) =>
    `/staged/${order}/${side}-${index + 1}.png`,
  ...overrides,
});

describe('runJudging', () => {
  it('never sends a case whose gates block, and says why', async () => {
    const run = runner();
    const report = await runJudging(options({ cases: [input('dev-one', true)], run }));

    expect(run).not.toHaveBeenCalled();
    expect(report.outcomes[0]).toMatchObject({ reason: 'gates-blocked', verdict: 'inconclusive' });
  });

  it('stages every render before the first judge call', async () => {
    const events: string[] = [];
    const run: JudgeRunner = vi.fn(async () => {
      events.push('judge');
      return { response: answer, usage: { ...unknownUsage } };
    });

    await runJudging(
      options({
        run,
        stageScreenshot: async ({ order, side }) => {
          events.push('stage');
          return `/staged/${order}/${side}.png`;
        },
      })
    );

    expect(events.indexOf('judge')).toBeGreaterThan(events.lastIndexOf('stage'));
  });

  it('redacts the pinned model names it was given', async () => {
    const prompts: string[] = [];
    const run: JudgeRunner = vi.fn(async (packet) => {
      prompts.push(packet.prompt);
      return { response: answer, usage: { ...unknownUsage } };
    });

    await runJudging(
      options({
        cases: [
          {
            ...input('dev-one'),
            candidate: { ...arm(false, '// produced by gpt-5.6-sol'), screenshots: ['/x.png'] },
          },
        ],
        run,
      })
    );

    expect(prompts.join(' ')).not.toContain('gpt-5.6-sol');
  });

  it('costs one case, not the run, when a render cannot be staged', async () => {
    const report = await runJudging(
      options({
        cases: [input('dev-one'), input('dev-two')],
        stageScreenshot: async ({ caseId, order, side }) => {
          if (caseId === 'dev-one') throw new Error('ENOENT: mobile.png');

          return `/staged/${order}/${side}.png`;
        },
      })
    );

    expect(report.outcomes[0]).toMatchObject({ caseId: 'dev-one', reason: 'staging-failed' });
    expect(report.outcomes[1]?.reason).toBe('judged');
  });

  it('stops judging once known spend passes the hard stop', async () => {
    const run = runner(30);
    const report = await runJudging(
      options({ cases: [input('a'), input('b'), input('c')], hardStopUsd: 40, run })
    );

    // Two calls for the first case take spend to 60, so nothing after it runs.
    expect(run).toHaveBeenCalledTimes(2);
    expect(report.outcomes.slice(1).map((outcome) => outcome.reason)).toEqual([
      'budget-stop',
      'budget-stop',
    ]);
  });

  it('scores calibration only against pairs this run actually judged', async () => {
    const report = await runJudging(
      options({
        calibrationLabels: new Map([
          ['dev-one', 'candidate' as const],
          ['not-in-this-run', 'baseline' as const],
        ]),
        run: runner(),
      })
    );

    expect(report.calibration?.compared).toBe(1);
  });

  it('reports unknown cost as unknown when nothing was judged', async () => {
    const report = await runJudging(options({ cases: [input('dev-one', true)] }));

    expect(report.usage.costUsd).toBeNull();
    expect(report.judgeCalls).toBe(0);
  });
});
