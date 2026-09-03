import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  armDirectoryId,
  budgetStopExceeded,
  heldOutCaseFile,
  OrchestrationError,
  parseEvalInvocation,
  readFlag,
  resolveArms,
  resolveHeldOutCase,
  resolveJudgeContract,
  resolveLengthControlCase,
  resolvePublicCase,
  resolveReportDirectory,
  resolveRuntimeReportDirectory,
  resolveRuntimeSides,
  selectCaseEntries,
  selectLane,
  type ResolvedCase,
  type RuntimeSide,
} from '../../src/eval/eval-run-orchestration.ts';
import { hashContent } from '../../src/eval/skill-payload-measurement.ts';

const cycleId = 'designer-presentational-code-2026-08-27';

const caseManifest = () => ({
  cases: [
    {
      category: 'web-screen-responsive',
      id: 'dev-web-pricing-page-established-brand',
      lane: 'development',
      qualitative_rubric: ['RUB-SLOP-001', 'RUB-COHERE-001'],
      seed: 3,
      target_platform: 'web',
    },
    { category: 'native-flutter', id: 'dev-flutter-stat-tile-grid', lane: 'development' },
    { content_hash: 'sha256:abc', id: 'acc-001', lane: 'acceptance' },
  ],
  cycle_id: cycleId,
  lanes: {
    acceptance: {
      frozen: true,
      paid_judging: true,
      source: 'cases/acceptance',
      visibility: 'private',
    },
    development: { frozen: false, paid_judging: false, visibility: 'public' },
  },
});

const baselineManifest = () => ({
  judging: {
    authoring_assistance: 'Maintainer plus interactive assistance.',
    budget: { hard_stop_usd: 150 },
    judge: { effort: 'default', model: 'claude-opus-5', provider: 'anthropic' },
    length_control: { acceptance: 'acc-001' },
    paid_lanes: ['acceptance', 'calibration'],
    subject: { effort: 'default', model: 'gpt-5.6-sol', provider: 'codex' },
    thresholds: { bootstrap_seed: 7 },
  },
});

describe('parseEvalInvocation', () => {
  it('defaults to a single-arm development run', () => {
    const invocation = parseEvalInvocation(['node', 'run.ts']);

    expect(invocation).toEqual({
      caseId: null,
      comparing: false,
      dualRuntime: false,
      judging: false,
      lane: 'development',
      runsRoot: null,
    });
  });

  it('reads lane, case, and runs-root overrides', () => {
    const invocation = parseEvalInvocation([
      '--lane',
      'acceptance',
      '--case',
      'acc-001',
      '--runs-root',
      '.eval-runs-alt',
      '--judge',
    ]);

    expect(invocation.lane).toBe('acceptance');
    expect(invocation.caseId).toBe('acc-001');
    expect(invocation.runsRoot).toBe('.eval-runs-alt');
    expect(invocation.judging).toBe(true);
  });

  it('refuses a flag whose value is missing or is another flag', () => {
    expect(() => parseEvalInvocation(['--case'])).toThrow(OrchestrationError);
    expect(() => parseEvalInvocation(['--case', '--judge'])).toThrow(/--case needs a value/);
  });

  it('refuses dual-runtime combined with a two-version comparison', () => {
    expect(() => parseEvalInvocation(['--dual-runtime', '--judge'])).toThrow(/cannot be combined/);
    expect(() => parseEvalInvocation(['--dual-runtime', '--compare'])).toThrow(
      /cannot be combined/
    );
  });

  it('reads a flag value that legitimately begins with a dash only when quoted apart', () => {
    expect(readFlag(['--lane', 'development'], '--lane')).toBe('development');
    expect(readFlag(['--lane', 'development'], '--case')).toBeNull();
  });
});

describe('selectLane', () => {
  it('reads visibility, freeze, paid judging, and source', () => {
    expect(selectLane(caseManifest(), 'acceptance')).toEqual({
      frozen: true,
      name: 'acceptance',
      paidJudging: true,
      source: 'cases/acceptance',
      visibility: 'private',
    });
  });

  it('refuses a lane the manifest never declared', () => {
    expect(() => selectLane(caseManifest(), 'staging')).toThrow(/declares no lane "staging"/);
  });
});

describe('selectCaseEntries', () => {
  it('returns every case in the lane', () => {
    expect(selectCaseEntries(caseManifest(), 'development', null)).toHaveLength(2);
  });

  it('narrows to one case when the operator names it', () => {
    const selected = selectCaseEntries(caseManifest(), 'development', 'dev-flutter-stat-tile-grid');

    expect(selected.map((entry) => entry.id)).toEqual(['dev-flutter-stat-tile-grid']);
  });

  it('refuses a lane with no cases and a case that is not in the lane', () => {
    expect(() => selectCaseEntries(caseManifest(), 'development', 'acc-001')).toThrow(
      /No "development" case "acc-001"/
    );
    expect(() => selectCaseEntries({ cases: [], lanes: {} }, 'development', null)).toThrow(
      /No cases in lane/
    );
  });
});

describe('resolveArms and armDirectoryId', () => {
  it('grades one unarmed directory by default', () => {
    expect(resolveArms({ comparing: false, judging: false })).toEqual([null]);
    expect(armDirectoryId('acc-001', null)).toBe('acc-001');
  });

  it('grades both arms for a judged or unjudged comparison', () => {
    expect(resolveArms({ comparing: false, judging: true })).toEqual(['baseline', 'candidate']);
    expect(resolveArms({ comparing: true, judging: false })).toEqual(['baseline', 'candidate']);
    expect(armDirectoryId('acc-001', 'candidate')).toBe('acc-001.candidate');
  });
});

describe('case resolution', () => {
  it('reads a public case from the manifest body', () => {
    const [entry] = selectCaseEntries(
      caseManifest(),
      'development',
      'dev-web-pricing-page-established-brand'
    );

    expect(resolvePublicCase(entry!)).toEqual<ResolvedCase>({
      category: 'web-screen-responsive',
      id: 'dev-web-pricing-page-established-brand',
      rubricIds: ['RUB-SLOP-001', 'RUB-COHERE-001'],
      seed: 3,
      targetPlatform: 'web',
    });
  });

  it('accepts a held-out body whose hash matches the manifest', () => {
    const body = 'category: web-screen-responsive\ntarget_platform: web\nseed: 5\n';

    expect(
      resolveHeldOutCase({
        body,
        id: 'acc-001',
        parsed: { category: 'web-screen-responsive', seed: 5, target_platform: 'web' },
        recordedHash: hashContent(body),
      })
    ).toMatchObject({ id: 'acc-001', seed: 5, targetPlatform: 'web' });
  });

  it('invalidates the cycle when the held-out store drifted', () => {
    expect(() =>
      resolveHeldOutCase({
        body: 'category: web\n',
        id: 'acc-001',
        parsed: {},
        recordedHash: 'sha256:0000',
      })
    ).toThrow(/Held-out case "acc-001" changed/);
  });

  it('addresses a held-out body inside the private store clone', () => {
    expect(
      heldOutCaseFile({ id: 'acc-001', laneSource: 'cases/acceptance', privatePath: '/store' })
    ).toBe(path.join('/store', 'cases/acceptance', 'acc-001.yml'));
  });
});

describe('resolveLengthControlCase', () => {
  const cases: ResolvedCase[] = [
    {
      category: 'web-screen-responsive',
      id: 'acc-001',
      rubricIds: ['RUB-SLOP-001'],
      seed: 2,
      targetPlatform: 'web',
    },
  ];

  it('reuses the referenced case platform and rubrics under the control id', () => {
    expect(
      resolveLengthControlCase({
        baselineManifest: baselineManifest(),
        cases,
        controlId: 'length-control',
        laneName: 'acceptance',
      })
    ).toEqual({
      category: 'web-screen-responsive',
      id: 'length-control',
      rubricIds: ['RUB-SLOP-001'],
      seed: 2,
      targetPlatform: 'web',
    });
  });

  it('is absent when the lane declares no control', () => {
    expect(
      resolveLengthControlCase({
        baselineManifest: baselineManifest(),
        cases,
        controlId: 'length-control',
        laneName: 'development',
      })
    ).toBeNull();
  });

  it('refuses a control naming a case outside the lane', () => {
    const manifest = baselineManifest();

    manifest.judging.length_control.acceptance = 'acc-999';

    expect(() =>
      resolveLengthControlCase({
        baselineManifest: manifest,
        cases,
        controlId: 'length-control',
        laneName: 'acceptance',
      })
    ).toThrow(/names "acc-999"/);
  });
});

describe('artifact layout', () => {
  it('scopes the report directory to the lane so one lane cannot overwrite another', () => {
    expect(
      resolveReportDirectory({ cycleId, laneName: 'acceptance', runsRoot: '.eval-runs' })
    ).toBe(path.join('.eval-runs', cycleId, 'acceptance'));
    expect(
      resolveReportDirectory({ cycleId, laneName: 'calibration', runsRoot: '.eval-runs' })
    ).not.toBe(resolveReportDirectory({ cycleId, laneName: 'acceptance', runsRoot: '.eval-runs' }));
  });

  it('keeps each runtime side apart under the lane directory', () => {
    const [subject, judge] = resolveRuntimeSides({ baselineManifest: baselineManifest() }) as [
      RuntimeSide,
      RuntimeSide,
    ];

    expect(
      resolveRuntimeReportDirectory({
        cycleId,
        laneName: 'acceptance',
        runsRoot: '.eval-runs',
        side: subject,
      })
    ).not.toBe(
      resolveRuntimeReportDirectory({
        cycleId,
        laneName: 'acceptance',
        runsRoot: '.eval-runs',
        side: judge,
      })
    );
  });
});

describe('resolveJudgeContract', () => {
  it('reads the pinned models, hard stop, and seed', () => {
    expect(
      resolveJudgeContract({ baselineManifest: baselineManifest(), laneName: 'acceptance' })
    ).toEqual({
      hardStopUsd: 150,
      judge: { effort: 'default', model: 'claude-opus-5', provider: 'anthropic' },
      models: {
        authoringAssistance: 'Maintainer plus interactive assistance.',
        judge: 'anthropic/claude-opus-5',
        subject: 'codex/gpt-5.6-sol',
      },
      seed: 7,
    });
  });

  it('refuses a lane the contract does not pay to judge', () => {
    expect(() =>
      resolveJudgeContract({ baselineManifest: baselineManifest(), laneName: 'development' })
    ).toThrow(/not a paid judging lane/);
  });

  it('refuses a judge in the subject provider family before any call is made', () => {
    const manifest = baselineManifest();

    manifest.judging.subject.provider = 'anthropic';

    expect(() =>
      resolveJudgeContract({ baselineManifest: manifest, laneName: 'acceptance' })
    ).toThrow(/same family/);
  });

  it('refuses a manifest that pins no judging contract', () => {
    expect(() => resolveJudgeContract({ baselineManifest: {}, laneName: 'acceptance' })).toThrow(
      /pins no judging contract/
    );
  });
});

describe('resolveRuntimeSides', () => {
  it('pins both sides by exact model at high reasoning effort', () => {
    expect(resolveRuntimeSides({ baselineManifest: baselineManifest() })).toEqual([
      { effort: 'high', id: 'codex-gpt-5-6-sol', model: 'gpt-5.6-sol', provider: 'codex' },
      {
        effort: 'high',
        id: 'anthropic-claude-opus-5',
        model: 'claude-opus-5',
        provider: 'anthropic',
      },
    ]);
  });

  it('records a lower effort verbatim when the operator asks for a tier check', () => {
    const sides = resolveRuntimeSides({ baselineManifest: baselineManifest(), effort: 'medium' });

    expect(sides.map((side) => side.effort)).toEqual(['medium', 'medium']);
  });

  it('refuses two sides in the same provider family', () => {
    const manifest = baselineManifest();

    manifest.judging.judge.provider = 'openai';

    expect(() => resolveRuntimeSides({ baselineManifest: manifest })).toThrow(/same family/);
  });

  it('refuses a manifest that pins only one runtime', () => {
    expect(() =>
      resolveRuntimeSides({ baselineManifest: { judging: { subject: { model: 'a' } } } })
    ).toThrow(/needs judging.subject and judging.judge/);
  });
});

describe('budgetStopExceeded', () => {
  it('fires only above the hard stop', () => {
    expect(budgetStopExceeded(151, 150)).toBe(true);
    expect(budgetStopExceeded(150, 150)).toBe(false);
  });

  it('never reads an unmeasured cost as a free run', () => {
    expect(budgetStopExceeded(null, 150)).toBe(false);
    expect(budgetStopExceeded(null, 0)).toBe(false);
  });
});
