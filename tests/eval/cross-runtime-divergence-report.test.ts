import { describe, expect, it } from 'vitest';

import {
  buildDivergenceReport,
  classifyDivergences,
  DivergenceReportError,
  renderDivergenceReport,
  reviewProposedFix,
  type RuntimeObservation,
} from '../../src/eval/cross-runtime-divergence-report.ts';
import { gateResult, type GateResult } from '../../src/eval/gate-result.ts';

const cleanGates = (): GateResult[] => [
  gateResult('INV-BUILD-001', 'critical', 'render-gated', 'pass', 'Built and observed.'),
  gateResult('INV-A11Y-001', 'critical', 'render-gated', 'pass', 'No serious violation.'),
  gateResult('INV-CONTRAST-001', 'critical', 'render-gated', 'pass', 'Contrast meets WCAG 2.2.'),
  gateResult('INV-SCOPE-001', 'high', 'static', 'pass', 'No data or routing access.'),
  gateResult('INV-SOURCE-001', 'critical', 'static', 'pass', 'No source page was bundled.'),
];

function observation(overrides: Partial<RuntimeObservation> = {}): RuntimeObservation {
  return {
    citedSources: ['https://www.w3.org/TR/WCAG22/'],
    effort: 'high',
    gates: cleanGates(),
    loadedReferences: ['platform-web-foundations-and-motion.md', 'anti-slop-quality-review.md'],
    model: 'gpt-5.6-sol',
    provider: 'codex',
    side: 'side-1',
    ...overrides,
  };
}

function other(overrides: Partial<RuntimeObservation> = {}): RuntimeObservation {
  return observation({
    model: 'claude-opus-5',
    provider: 'anthropic',
    side: 'side-2',
    ...overrides,
  });
}

const registeredSources = ['https://www.w3.org/TR/WCAG22/', 'https://m3.material.io/'];

describe('classifyDivergences', () => {
  it('reports nothing when both runtimes agree on every signal', () => {
    expect(
      classifyDivergences({ observations: [observation(), other()], registeredSources })
    ).toEqual([]);
  });

  it('classifies a boundary divergence when one runtime leaves the presentational scope', () => {
    const gates = cleanGates().map((gate) =>
      gate.invariant === 'INV-SCOPE-001'
        ? gateResult('INV-SCOPE-001', 'high', 'static', 'fail', 'Emitted a fetch call.')
        : gate
    );

    const [divergence] = classifyDivergences({
      observations: [observation({ gates }), other()],
      registeredSources,
    });

    expect(divergence!.class).toBe('boundary');
    expect(divergence!.severity).toBe('high');
    expect(divergence!.suggestedResponse).toMatch(/forbidden-import gate/);
    expect(divergence!.evidence.join(' ')).toContain('Emitted a fetch call.');
  });

  it('classifies a platform divergence when the runtimes route to different platform references', () => {
    const [divergence] = classifyDivergences({
      observations: [
        observation(),
        other({
          loadedReferences: ['platform-native-cross-platform.md', 'anti-slop-quality-review.md'],
        }),
      ],
      registeredSources,
    });

    expect(divergence!.class).toBe('platform');
    expect(divergence!.evidence).toEqual([
      'side-1 only: platform-web-foundations-and-motion.md',
      'side-2 only: platform-native-cross-platform.md',
    ]);
  });

  it('classifies a routing divergence when a non-platform reference differs', () => {
    const [divergence] = classifyDivergences({
      observations: [
        observation(),
        other({
          loadedReferences: [
            'platform-web-foundations-and-motion.md',
            'codebase-first-examples.md',
          ],
        }),
      ],
      registeredSources,
    });

    expect(divergence!.class).toBe('routing');
    expect(divergence!.suggestedResponse).toMatch(/routing condition/);
  });

  it('classifies a source divergence when a runtime cites an unregistered source', () => {
    const [divergence] = classifyDivergences({
      observations: [
        observation(),
        other({ citedSources: ['https://www.w3.org/TR/WCAG22/', 'https://dribbble.com/shots/1'] }),
      ],
      registeredSources,
    });

    expect(divergence!.class).toBe('source');
    expect(divergence!.evidence).toEqual(['side-2 adopted: https://dribbble.com/shots/1']);
  });

  it('classifies a gate divergence with both measured statuses', () => {
    const gates = cleanGates().map((gate) =>
      gate.invariant === 'INV-CONTRAST-001'
        ? gateResult(
            'INV-CONTRAST-001',
            'critical',
            'render-gated',
            'fail',
            'Measured 3.1:1 against a 4.5:1 minimum.'
          )
        : gate
    );

    const [divergence] = classifyDivergences({
      observations: [observation({ gates }), other()],
      registeredSources,
    });

    expect(divergence!.class).toBe('gate');
    expect(divergence!.severity).toBe('critical');
    expect(divergence!.evidence).toEqual([
      'side-1: fail — Measured 3.1:1 against a 4.5:1 minimum.',
      'side-2: pass — Contrast meets WCAG 2.2.',
    ]);
  });

  it('classifies the same model at two efforts as tier robustness, not portability', () => {
    const gates = cleanGates().map((gate) =>
      gate.invariant === 'INV-A11Y-001'
        ? gateResult('INV-A11Y-001', 'critical', 'render-gated', 'fail', 'Serious violation.')
        : gate
    );

    const [divergence] = classifyDivergences({
      observations: [
        observation({ effort: 'low', gates, side: 'low-effort' }),
        observation({ effort: 'high', side: 'high-effort' }),
      ],
      registeredSources,
    });

    expect(divergence!.class).toBe('effort');
    expect(divergence!.suggestedResponse).toMatch(/tier-robustness/);
  });

  it('records a taste divergence only where every objective signal agreed', () => {
    const agreeing = classifyDivergences({
      observations: [observation(), other()],
      registeredSources,
      tasteNotes: ['One page reads as an editorial journey; the other reads as a template.'],
    });

    expect(agreeing).toHaveLength(1);
    expect(agreeing[0]!.class).toBe('taste');
    expect(agreeing[0]!.severity).toBeNull();

    const gates = cleanGates().map((gate) =>
      gate.invariant === 'INV-A11Y-001'
        ? gateResult('INV-A11Y-001', 'critical', 'render-gated', 'fail', 'Serious violation.')
        : gate
    );
    const disagreeing = classifyDivergences({
      observations: [observation({ gates }), other()],
      registeredSources,
      tasteNotes: ['One page reads as an editorial journey.'],
    });

    expect(disagreeing.map((entry) => entry.class)).toEqual(['gate']);
  });

  it('ranks a boundary divergence above a gate divergence', () => {
    const gates = cleanGates().map((gate) => {
      if (gate.invariant === 'INV-SCOPE-001') {
        return gateResult('INV-SCOPE-001', 'high', 'static', 'fail', 'Emitted a router import.');
      }

      if (gate.invariant === 'INV-CONTRAST-001') {
        return gateResult('INV-CONTRAST-001', 'critical', 'render-gated', 'fail', '3.1:1.');
      }

      return gate;
    });

    expect(
      classifyDivergences({
        observations: [observation({ gates }), other()],
        registeredSources,
      }).map((entry) => entry.class)
    ).toEqual(['boundary', 'gate']);
  });

  it('reports every invariant the other runtime never reported', () => {
    const divergences = classifyDivergences({
      observations: [observation(), other({ gates: [] })],
      registeredSources,
    });

    expect(divergences.map((entry) => entry.class)).toEqual([
      'boundary',
      'source',
      'gate',
      'gate',
      'gate',
    ]);
    expect(divergences[0]!.evidence).toEqual([
      'side-1: pass — No data or routing access.',
      'side-2: not reported',
    ]);
  });
});

describe('buildDivergenceReport', () => {
  it('reports a partial review honestly when a runtime never answered', () => {
    const report = buildDivergenceReport({ caseId: 'acc-001', observations: [observation()] });

    expect(report.partial).toBe(true);
    expect(report.divergences).toEqual([]);
    expect(renderDivergenceReport(report)).toContain('**PARTIAL**');
  });

  it('refuses a review with no observation at all', () => {
    expect(() => buildDivergenceReport({ caseId: 'acc-001', observations: [] })).toThrow(
      DivergenceReportError
    );
  });

  it('refuses more than two runtimes in one review', () => {
    expect(() =>
      buildDivergenceReport({
        caseId: 'acc-001',
        observations: [observation(), other(), observation({ side: 'side-3' })],
      })
    ).toThrow(/exactly two runtimes/);
  });

  it('names the signal families no side reported, so silence is not read as agreement', () => {
    const report = buildDivergenceReport({
      caseId: 'acc-001',
      observations: [
        observation({ citedSources: [], loadedReferences: [] }),
        other({ citedSources: [], loadedReferences: [] }),
      ],
      registeredSources,
    });

    expect(report.unobservedSignals).toEqual([
      'loaded references (`routing`, `platform`)',
      'cited sources (`source`)',
    ]);

    const rendered = renderDivergenceReport(report);

    expect(rendered).toContain('**NO DIVERGENCE**');
    expect(rendered).toContain('**Not compared**');
    expect(rendered).toContain('unmeasured, not agreement');
  });

  it('reports nothing unobserved when both signal families were supplied', () => {
    const report = buildDivergenceReport({
      caseId: 'acc-001',
      observations: [observation(), other()],
      registeredSources,
    });

    expect(report.unobservedSignals).toEqual([]);
    expect(renderDivergenceReport(report)).not.toContain('**Not compared**');
  });

  it('still names unobserved signals on a partial review', () => {
    const report = buildDivergenceReport({
      caseId: 'acc-001',
      observations: [observation({ citedSources: [], loadedReferences: [] })],
    });

    expect(report.partial).toBe(true);
    expect(report.unobservedSignals).toHaveLength(2);
  });

  it('names which runtime produced which output only after the findings', () => {
    const gates = cleanGates().map((gate) =>
      gate.invariant === 'INV-SCOPE-001'
        ? gateResult('INV-SCOPE-001', 'high', 'static', 'fail', 'Emitted a fetch call.')
        : gate
    );
    const rendered = renderDivergenceReport(
      buildDivergenceReport({
        caseId: 'acc-001',
        observations: [observation({ gates }), other()],
        registeredSources,
      })
    );

    expect(rendered.indexOf('`boundary`')).toBeLessThan(rendered.indexOf('## Runtimes'));
    expect(rendered.indexOf('gpt-5.6-sol')).toBeGreaterThan(rendered.indexOf('## Runtimes'));
    expect(rendered).toContain('| `side-1` | codex | `gpt-5.6-sol` | high |');
  });
});

describe('reviewProposedFix', () => {
  it('accepts an instruction-level fix outside the shipped skill', () => {
    expect(
      reviewProposedFix({
        divergenceClass: 'routing',
        file: 'evals/squad-designer/case-manifest.yml',
        justification: 'ambiguous-instruction',
        rationale: 'The routing condition admits both the web and adaptive reference.',
      })
    ).toEqual({ accepted: true, refusal: null });
  });

  it('refuses a fix that edits the shipped skill from inside the review', () => {
    const review = reviewProposedFix({
      divergenceClass: 'platform',
      file: 'skills/squad-designer/SKILL.md',
      justification: 'ambiguous-instruction',
      rationale: 'Make the platform router explicit.',
    });

    expect(review.accepted).toBe(false);
    expect(review.refusal).toMatch(/next cycle as a failing development case/);
  });

  it('refuses a fix justified by which runtime performed better', () => {
    const review = reviewProposedFix({
      divergenceClass: 'taste',
      file: 'evals/squad-designer/case-manifest.yml',
      justification: 'preferred-runtime',
      rationale: 'The output on the preferred runtime scored higher.',
    });

    expect(review.accepted).toBe(false);
    expect(review.refusal).toMatch(/tunes the skill toward one runtime/);
  });

  it('refuses a shipped-skill edit on a Windows-style or dot-prefixed path', () => {
    for (const file of ['skills\\squad-designer\\SKILL.md', './skills/squad-designer/SKILL.md']) {
      expect(
        reviewProposedFix({
          divergenceClass: 'routing',
          file,
          justification: 'ambiguous-instruction',
          rationale: 'Sharpen the condition.',
        }).accepted
      ).toBe(false);
    }
  });
});
