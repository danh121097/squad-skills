import { describe, expect, it, vi } from 'vitest';

import {
  assertBlind,
  assertCrossProvider,
  buildJudgePackets,
  evaluateLengthControl,
  judgePair,
  JudgeContractError,
  providerFamily,
  redactIdentity,
  unknownUsage,
  type JudgePacket,
  type JudgeResponse,
  type JudgeRunner,
  type PairwiseCase,
} from '../../src/eval/pairwise-judge.ts';

/**
 * The bias controls, fixed as behavior rather than as intent.
 *
 * Every assertion here is about something a careless caller could otherwise
 * lose silently: which arm the judge can identify, whether both orders ran, and
 * whether a disagreement is reported as a weak win.
 */
const rubricIds = ['RUB-HIER-001', 'RUB-SLOP-001'];

const pair = (): PairwiseCase => ({
  baseline: {
    files: [{ path: 'panel.tsx', source: 'export const Panel = () => <div>old</div>;' }],
    screenshots: ['/runs/x.baseline/screenshots/mobile.png'],
  },
  candidate: {
    files: [{ path: 'panel.tsx', source: 'export const Panel = () => <div>new</div>;' }],
    screenshots: ['/runs/x.candidate/screenshots/mobile.png'],
  },
  caseId: 'dev-web-panel',
  rubricIds,
  seed: 1,
});

const packets = (entry = pair()) =>
  buildJudgePackets(entry, {
    screenshotPaths: (order, side, index) => `/staged/${order}/${side}-${index + 1}.png`,
  });

const answer = (overall: 'entry-a' | 'entry-b' | 'tie'): JudgeResponse => ({
  criteria: rubricIds.map((rubric) => ({
    evidence: 'observed spacing and hierarchy',
    rubric,
    winner: overall,
  })),
  overall,
});

const runnerReturning = (...responses: Array<JudgeResponse | null>): JudgeRunner => {
  let call = 0;

  return async () => {
    const response = responses[call] ?? null;
    call += 1;

    return {
      error: response ? undefined : 'provider unavailable',
      response,
      usage: { ...unknownUsage, inputTokens: 100, outputTokens: 20 },
    };
  };
};

describe('assertCrossProvider', () => {
  it('refuses a judge in the subject provider family, including through a different CLI', () => {
    expect(() => assertCrossProvider('codex', 'openai')).toThrow(JudgeContractError);
    expect(() => assertCrossProvider('anthropic', 'claude')).toThrow(/same family/);
  });

  it('accepts the pinned cross-provider pairing', () => {
    expect(() => assertCrossProvider('codex', 'anthropic')).not.toThrow();
    expect(providerFamily('Codex')).toBe('openai');
  });
});

describe('blinding', () => {
  it('hides arm identity and pinned model names from the prompt', () => {
    const [first] = packets();

    expect(first.prompt).not.toMatch(/candidate|baseline/i);
    expect(first.prompt).toContain('entry-a');
  });

  it('redacts model names the caller names as identifying', () => {
    expect(redactIdentity('built by gpt-5.6-sol for the candidate', ['gpt-5.6-sol'])).toBe(
      'built by [redacted] for the [redacted]'
    );
  });

  it('catches arm words that a word boundary would miss', () => {
    const leaked = redactIdentity('runs/baseline_v2/App.tsx isCandidateArm=true CANDIDATE_ID');

    expect(leaked).not.toMatch(/baseline|candidate/i);
  });

  it('refuses a pinned model name in an image path', () => {
    const packet: JudgePacket = {
      assignment: { 'entry-a': 'baseline', 'entry-b': 'candidate' },
      caseId: 'dev-web-panel',
      order: 'ab',
      prompt: 'clean prompt',
      rubricIds,
      screenshots: {
        'entry-a': ['/runs/gpt-5.6-sol/judge/dev/ab/entry-a-1.png'],
        'entry-b': ['/staged/ab/entry-b-1.png'],
      },
    };

    expect(() => assertBlind(packet, ['gpt-5.6-sol'])).toThrow(JudgeContractError);
  });

  it("names each entry's renders so the judge can attribute them", () => {
    const [first] = packets();

    expect(first.prompt).toContain('Rendered output for entry-a');
    expect(first.prompt).toContain(first.screenshots['entry-a'][0] as string);
  });

  it('fails loudly when an image path names an arm', () => {
    const packet: JudgePacket = {
      ...(packets()[0] as JudgePacket),
      screenshots: { 'entry-a': ['/runs/x.candidate/mobile.png'], 'entry-b': [] },
    };

    expect(() => assertBlind(packet)).toThrow(JudgeContractError);
  });

  it('never puts the same arm on the same side in both packets', () => {
    const [first, second] = packets();

    expect(first.assignment['entry-a']).not.toBe(second.assignment['entry-a']);
    expect(new Set([first.order, second.order])).toEqual(new Set(['ab', 'ba']));
  });

  it('varies which arm is read first by case, not by argument position', () => {
    const first = packets({ ...pair(), caseId: 'dev-web-panel', seed: 1 })[0];
    const other = packets({ ...pair(), caseId: 'dev-motion-sheet', seed: 1 })[0];

    expect([first.assignment['entry-a'], other.assignment['entry-a']]).toEqual([
      'baseline',
      'candidate',
    ]);
  });
});

describe('judgePair', () => {
  it('refuses to call one order an agreement between two', async () => {
    const [first] = packets();

    await expect(
      judgePair({ pair: pair(), packets: [first, first], run: runnerReturning(answer('entry-a')) })
    ).rejects.toThrow(JudgeContractError);
  });

  it('refuses packets built for another case', async () => {
    const [first, second] = packets();
    const foreign = { ...second, caseId: 'dev-other' };

    await expect(
      judgePair({ pair: pair(), packets: [first, foreign], run: runnerReturning(answer('tie')) })
    ).rejects.toThrow(JudgeContractError);
  });

  it('reports the winner when both orders agree, resolved back to arms', async () => {
    const built = packets();
    const responses = built.map((packet) =>
      answer(packet.assignment['entry-a'] === 'candidate' ? 'entry-a' : 'entry-b')
    );

    const outcome = await judgePair({
      pair: pair(),
      packets: built,
      run: runnerReturning(...responses),
    });

    expect(outcome.verdict).toBe('candidate');
    expect(outcome.orders).toHaveLength(2);
  });

  it('is inconclusive when the winner flips between orders', async () => {
    const outcome = await judgePair({
      pair: pair(),
      packets: packets(),
      // Both orders name the first entry, which is a different arm each time.
      run: runnerReturning(answer('entry-a'), answer('entry-a')),
    });

    expect(outcome.verdict).toBe('inconclusive');
    expect(outcome.detail).toContain('Order-dependent');
  });

  it('is inconclusive when the provider never answered', async () => {
    const outcome = await judgePair({
      pair: pair(),
      packets: packets(),
      run: runnerReturning(answer('entry-a'), null),
    });

    expect(outcome.verdict).toBe('inconclusive');
    expect(outcome.detail).toContain('provider unavailable');
  });

  it('refuses a preference that skips a declared rubric row', async () => {
    const outcome = await judgePair({
      pair: pair(),
      packets: packets(),
      run: runnerReturning(
        {
          criteria: [{ evidence: 'looked at it', rubric: 'RUB-HIER-001', winner: 'entry-a' }],
          overall: 'entry-a',
        },
        answer('entry-b')
      ),
    });

    expect(outcome.verdict).toBe('inconclusive');
    expect(outcome.detail).toContain('RUB-SLOP-001');
  });

  it('refuses a rubric answered more than once', async () => {
    const outcome = await judgePair({
      pair: pair(),
      packets: packets(),
      run: runnerReturning(
        {
          // Every declared id is present, so a check that only asks "did each
          // one appear" passes this and counts the row twice.
          criteria: [
            ...rubricIds.map((rubric) => ({
              evidence: 'looked at it',
              rubric,
              winner: 'entry-a' as const,
            })),
            { evidence: 'looked again', rubric: 'RUB-SLOP-001', winner: 'entry-a' as const },
          ],
          overall: 'entry-a',
        },
        answer('entry-b')
      ),
    });

    expect(outcome.verdict).toBe('inconclusive');
    expect(outcome.detail).toContain('more than once');
  });

  it('refuses a rubric nobody declared', async () => {
    const outcome = await judgePair({
      pair: pair(),
      packets: packets(),
      run: runnerReturning(
        {
          criteria: [
            ...rubricIds.map((rubric) => ({
              evidence: 'looked at it',
              rubric,
              winner: 'entry-a' as const,
            })),
            { evidence: 'invented', rubric: 'RUB-MADE-UP-001', winner: 'entry-a' as const },
          ],
          overall: 'entry-a',
        },
        answer('entry-b')
      ),
    });

    expect(outcome.verdict).toBe('inconclusive');
    expect(outcome.detail).toContain('RUB-MADE-UP-001');
  });

  it('refuses a score whose evidence is blank', async () => {
    const outcome = await judgePair({
      pair: pair(),
      packets: packets(),
      run: runnerReturning(
        {
          criteria: rubricIds.map((rubric) => ({
            evidence: '   ',
            rubric,
            winner: 'entry-a' as const,
          })),
          overall: 'entry-a',
        },
        answer('entry-b')
      ),
    });

    expect(outcome.verdict).toBe('inconclusive');
    expect(outcome.detail).toContain('Empty evidence');
  });

  it('runs both orders even when the first is decisive', async () => {
    const run = vi.fn(runnerReturning(answer('entry-a'), answer('entry-b')));

    await judgePair({ pair: pair(), packets: packets(), run });

    expect(run).toHaveBeenCalledTimes(2);
  });
});

describe('evaluateLengthControl', () => {
  it('accepts a tie and flags anything else', () => {
    expect(
      evaluateLengthControl({
        caseId: 'length-control',
        detail: '',
        orders: [],
        reason: 'judged',
        verdict: 'tie',
      }).biased
    ).toBe(false);
    expect(
      evaluateLengthControl({
        caseId: 'length-control',
        detail: '',
        orders: [],
        reason: 'judged',
        verdict: 'candidate',
      }).biased
    ).toBe(true);
  });

  it('treats an unrun control as unmeasured bias rather than as no bias', () => {
    expect(evaluateLengthControl(null)).toMatchObject({ biased: true });
  });
});
