import { describe, expect, it } from 'vitest';

import {
  buildEvalRunReport,
  renderMarkdownReport,
  type CaseRunResult,
  type EvalRunEnvironment,
} from '../../src/eval/eval-run-report.ts';
import { gateResult, summarizeGateResults, type GateResult } from '../../src/eval/gate-result.ts';

const environment: EvalRunEnvironment = {
  caseManifestHash: 'sha256:cases',
  cycleId: 'designer-presentational-code-2026-08-27',
  nodeVersion: '22.20.0',
  payloadHash: 'sha256:payload',
  renderer: 'chromium 151.0.7922.34',
};

const pass = (invariant: string): GateResult =>
  gateResult(invariant, 'critical', 'render-gated', 'pass', 'ok');
const fail = (invariant: string, severity: 'critical' | 'high' | 'medium'): GateResult =>
  gateResult(invariant, severity, 'render-gated', 'fail', 'measured below threshold', [
    '[mobile 375px] p: measured 1.92:1',
  ]);

describe('summarizeGateResults', () => {
  it('fails overall when one critical invariant fails among passes', () => {
    const summary = summarizeGateResults([
      pass('INV-BUILD-001'),
      pass('INV-A11Y-001'),
      pass('INV-OVERFLOW-001'),
      pass('INV-TOUCH-001'),
      fail('INV-CONTRAST-001', 'critical'),
    ]);

    expect(summary.status).toBe('fail');
    expect(summary.criticalFailures).toBe(1);
    expect(summary.passed).toBe(4);
  });

  it('counts high failures separately without softening the verdict', () => {
    const summary = summarizeGateResults([pass('INV-BUILD-001'), fail('INV-TOUCH-001', 'high')]);

    expect(summary).toMatchObject({ criticalFailures: 0, highFailures: 1, status: 'fail' });
  });

  it('degrades a clean run to unverified when a gate never ran', () => {
    const summary = summarizeGateResults([
      pass('INV-BUILD-001'),
      gateResult('INV-COMPILE-001', 'critical', 'compile-tier', 'unverified', 'no toolchain'),
    ]);

    expect(summary.status).toBe('unverified');
    expect(summary.unverified).toBe(1);
  });

  it('passes only when every gate passed', () => {
    expect(summarizeGateResults([pass('INV-BUILD-001')]).status).toBe('pass');
  });

  it('reports a medium failure without blocking promotion', () => {
    const summary = summarizeGateResults([
      pass('INV-BUILD-001'),
      gateResult('INV-TOKEN-001', 'medium', 'static', 'fail', 'raw literal'),
    ]);

    expect(summary).toMatchObject({ blocking: false, mediumFailures: 1, status: 'fail' });
  });

  it.each([
    ['critical', 'INV-CONTRAST-001'],
    ['high', 'INV-TOUCH-001'],
  ] as const)('blocks promotion on a %s failure', (severity, invariant) => {
    expect(summarizeGateResults([pass('INV-BUILD-001'), fail(invariant, severity)]).blocking).toBe(
      true
    );
  });

  it('blocks promotion when a gate never ran', () => {
    const summary = summarizeGateResults([
      pass('INV-BUILD-001'),
      gateResult('INV-COMPILE-001', 'critical', 'compile-tier', 'unverified', 'no toolchain'),
    ]);

    expect(summary.blocking).toBe(true);
  });

  it('treats a run with no gate results as unverified, never as a pass', () => {
    expect(summarizeGateResults([])).toMatchObject({ blocking: true, status: 'unverified' });
  });
});

describe('buildEvalRunReport', () => {
  it('produces an identical hash for the same artifact and config', () => {
    const first = buildEvalRunReport(environment, [caseResult()]);
    const second = buildEvalRunReport(environment, [caseResult()]);

    expect(first.reportHash).toBe(second.reportHash);
  });

  it('produces the same hash regardless of case order', () => {
    const a = caseResult({ caseId: 'dev-a' });
    const b = caseResult({ caseId: 'dev-b' });

    expect(buildEvalRunReport(environment, [a, b]).reportHash).toBe(
      buildEvalRunReport(environment, [b, a]).reportHash
    );
  });

  it('moves the hash when the skill payload changes', () => {
    const drifted = { ...environment, payloadHash: 'sha256:other' };

    expect(buildEvalRunReport(environment, [caseResult()]).reportHash).not.toBe(
      buildEvalRunReport(drifted, [caseResult()]).reportHash
    );
  });

  it('moves the hash when a gate result changes', () => {
    const failing = caseResult({ results: [fail('INV-CONTRAST-001', 'critical')] });

    expect(buildEvalRunReport(environment, [caseResult()]).reportHash).not.toBe(
      buildEvalRunReport(environment, [failing]).reportHash
    );
  });

  it('orders failures ahead of unverified and passing results', () => {
    const report = buildEvalRunReport(environment, [
      caseResult({
        results: [
          pass('INV-BUILD-001'),
          gateResult('INV-COMPILE-001', 'critical', 'compile-tier', 'unverified', 'no toolchain'),
          fail('INV-CONTRAST-001', 'critical'),
        ],
      }),
    ]);

    expect(report.cases[0]?.results.map((result) => result.status)).toEqual([
      'fail',
      'unverified',
      'pass',
    ]);
  });
});

describe('renderMarkdownReport', () => {
  it('records the environment, the verdict, and the failing measurements', () => {
    const markdown = renderMarkdownReport(
      buildEvalRunReport(environment, [
        caseResult({ results: [pass('INV-BUILD-001'), fail('INV-CONTRAST-001', 'critical')] }),
      ])
    );

    expect(markdown).toContain('chromium 151.0.7922.34');
    expect(markdown).toContain('sha256:payload');
    expect(markdown).toContain('**FAIL**');
    expect(markdown).toContain('`INV-CONTRAST-001`');
    expect(markdown).toContain('[mobile 375px] p: measured 1.92:1');
  });

  it('escapes a pipe so one detail cannot break the table', () => {
    const markdown = renderMarkdownReport(
      buildEvalRunReport(environment, [
        caseResult({
          results: [gateResult('INV-DEP-001', 'high', 'static', 'fail', 'a | b')],
        }),
      ])
    );

    expect(markdown).toContain('a \\| b');
  });
});

function caseResult(overrides: Partial<CaseRunResult> = {}): CaseRunResult {
  return {
    caseId: 'dev-web-pricing-page-established-brand',
    category: 'web-screen-responsive',
    lane: 'development',
    results: [pass('INV-BUILD-001')],
    runDirectory: '.eval-runs/cycle/case',
    targetPlatform: 'web',
    ...overrides,
  };
}
