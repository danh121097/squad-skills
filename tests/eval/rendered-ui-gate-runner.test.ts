import { describe, expect, it } from 'vitest';

import type { GateResult } from '../../src/eval/gate-result.ts';
import { runRenderedUiGates } from '../../src/eval/rendered-ui-gate-runner.ts';
import type { RenderedSnapshot, ViewportSnapshot } from '../../src/eval/rendered-ui-snapshot.ts';

/**
 * Fixture pages with known defects, captured as snapshots.
 *
 * The browser half of the harness is exercised by `pnpm eval:designer`; this
 * suite fixes the *decisions* so `pnpm test` stays offline and deterministic.
 * Every threshold below is a boundary value, because a gate that only fires on
 * obviously broken input proves nothing about the case that nearly passes.
 */
describe('runRenderedUiGates', () => {
  it('passes a clean render across every gate', () => {
    const results = runRenderedUiGates(snapshot());

    expect(results.map((result) => result.status)).toEqual(Array(8).fill('pass'));
  });

  it('fails the build gate when the page rendered no elements', () => {
    const results = runRenderedUiGates(snapshot({ renderedElementCount: 0 }));

    expect(gate(results, 'INV-BUILD-001').status).toBe('fail');
    expect(gate(results, 'INV-BUILD-001').detail).toContain('rendered no elements');
  });

  it('does not let an empty page pass the gates it gave nothing to measure', () => {
    const results = runRenderedUiGates(snapshot({ renderedElementCount: 0 }));

    expect(results.filter((result) => result.status === 'pass')).toEqual([]);
    expect(results.filter((result) => result.status === 'unverified')).toHaveLength(7);
  });

  it('refuses to read measurements from a page that replaced them', () => {
    const results = runRenderedUiGates(snapshot({ observationIntegrity: 'compromised' }));

    expect(gate(results, 'INV-BUILD-001').status).toBe('fail');
    expect(results.filter((result) => result.status === 'pass')).toEqual([]);
  });

  it('reports accessibility as unverified when axe-core never ran', () => {
    const results = runRenderedUiGates(snapshot({ axeStatus: 'unavailable' }));

    expect(gate(results, 'INV-A11Y-001').status).toBe('unverified');
    expect(gate(results, 'INV-A11Y-001').detail).toContain('did not run');
  });

  it('fails a full pixel over the overflow tolerance and passes one at it', () => {
    expect(
      gate(runRenderedUiGates(snapshot({ documentScrollWidth: 376 })), 'INV-OVERFLOW-001').status
    ).toBe('pass');
    expect(
      gate(runRenderedUiGates(snapshot({ documentScrollWidth: 377 })), 'INV-OVERFLOW-001').status
    ).toBe('fail');
  });

  it('holds the contrast cutoff at half of the last reported decimal', () => {
    const at = (ratio: number) =>
      gate(
        runRenderedUiGates(
          snapshot({
            contrastSamples: [{ bold: false, fontSizePx: 16, kind: 'text', ratio, selector: 'p' }],
          })
        ),
        'INV-CONTRAST-001'
      ).status;

    expect(at(4.495)).toBe('pass');
    expect(at(4.494)).toBe('fail');
  });

  it('treats 18.66px bold as large text at exactly the boundary', () => {
    const results = runRenderedUiGates(
      snapshot({
        contrastSamples: [
          { bold: true, fontSizePx: 18.66, kind: 'text', ratio: 3.0, selector: 'strong' },
        ],
      })
    );

    expect(gate(results, 'INV-CONTRAST-001').status).toBe('pass');
  });

  it('reports every render gate as unverified when the build failed', () => {
    const results = runRenderedUiGates({
      buildDetail: 'Build failed: unresolved import.',
      buildStatus: 'fail',
      platformMinimumTargetPx: 44,
      viewports: [],
    });

    expect(gate(results, 'INV-BUILD-001').status).toBe('fail');
    expect(results.filter((result) => result.status === 'unverified')).toHaveLength(7);
    expect(results.some((result) => result.status === 'pass')).toBe(false);
  });

  it('reports render gates as unverified when nothing was observed', () => {
    const results = runRenderedUiGates({ ...snapshot(), viewports: [] });

    expect(gate(results, 'INV-A11Y-001').detail).toContain('no viewport was rendered');
  });

  it.each([
    ['critical', true],
    ['serious', true],
    ['moderate', false],
    ['minor', false],
  ] as const)('treats a %s axe violation as blocking: %s', (impact, blocking) => {
    const results = runRenderedUiGates(
      snapshot({
        axeViolations: [{ help: 'Images need alt text', id: 'image-alt', impact, nodes: ['img'] }],
      })
    );

    expect(gate(results, 'INV-A11Y-001').status).toBe(blocking ? 'fail' : 'pass');
  });

  it.each([
    [4.49, 16, false, 'fail'],
    [4.5, 16, false, 'pass'],
    [3.0, 24, false, 'pass'],
    [2.99, 24, false, 'fail'],
    [3.0, 19, true, 'pass'],
    [3.0, 18, true, 'fail'],
  ])('holds %s:1 at %spx bold=%s to %s', (ratio, fontSizePx, bold, expected) => {
    const results = runRenderedUiGates(
      snapshot({ contrastSamples: [{ bold, fontSizePx, kind: 'text', ratio, selector: 'p' }] })
    );

    expect(gate(results, 'INV-CONTRAST-001').status).toBe(expected);
  });

  it('holds a UI boundary to 3:1 regardless of font size', () => {
    const results = runRenderedUiGates(
      snapshot({
        contrastSamples: [
          { bold: false, fontSizePx: 0, kind: 'ui', ratio: 2.9, selector: 'button' },
        ],
      })
    );

    const contrast = gate(results, 'INV-CONTRAST-001');

    expect(contrast.status).toBe('fail');
    expect(contrast.evidence[0]).toContain('measured 2.90:1, needs 3.0:1');
  });

  it('fails overflow at 320px and names the measured width', () => {
    const results = runRenderedUiGates(
      snapshot({ documentClientWidth: 320, documentScrollWidth: 932 })
    );

    const overflow = gate(results, 'INV-OVERFLOW-001');

    expect(overflow.status).toBe('fail');
    expect(overflow.evidence[0]).toContain('932px wide in a 320px viewport');
  });

  it('tolerates a single pixel of sub-pixel rounding', () => {
    const results = runRenderedUiGates(
      snapshot({ documentClientWidth: 320, documentScrollWidth: 321 })
    );

    expect(gate(results, 'INV-OVERFLOW-001').status).toBe('pass');
  });

  it('fails when an ancestor clips content', () => {
    const results = runRenderedUiGates(snapshot({ clippedElements: ['div.summary'] }));

    expect(gate(results, 'INV-OVERFLOW-001').evidence[0]).toContain('div.summary is clipped');
  });

  it('fails when motion survives the reduced-motion preference', () => {
    const results = runRenderedUiGates(
      snapshotWithReducedMotion({
        animations: [{ durationMs: 300, properties: ['transform'], selector: 'div.sheet' }],
      })
    );

    expect(gate(results, 'INV-MOTION-001').evidence[0]).toContain(
      'survives prefers-reduced-motion'
    );
  });

  it('accepts a cross-fade as the reduced-motion replacement', () => {
    const results = runRenderedUiGates(
      snapshotWithReducedMotion({
        animations: [{ durationMs: 200, properties: ['opacity'], selector: 'div.sheet' }],
      })
    );

    expect(gate(results, 'INV-MOTION-001').status).toBe('pass');
  });

  it('treats a transition on `all` as surviving reduced motion', () => {
    const results = runRenderedUiGates(
      snapshotWithReducedMotion({
        animations: [{ durationMs: 300, properties: ['all'], selector: 'div.sheet' }],
      })
    );

    expect(gate(results, 'INV-MOTION-001').status).toBe('fail');
  });

  it('reports reduced motion as unverified when no reduced render was captured', () => {
    const results = runRenderedUiGates(snapshot());
    const motion = gate(results, 'INV-MOTION-001');

    expect(motion.status).toBe('pass');
    expect(gate(runRenderedUiGates(withoutReducedMotion()), 'INV-MOTION-001').status).toBe(
      'unverified'
    );
  });

  it.each([
    [44, 44, 44, 'pass'],
    [43.9, 44, 44, 'fail'],
    [48, 48, 48, 'pass'],
    [44, 44, 48, 'fail'],
  ])('measures a %sx%s target against a %spx minimum', (width, height, minimum, expected) => {
    const results = runRenderedUiGates({
      ...snapshot({
        interactiveTargets: [{ focusable: true, height, selector: 'button', width }],
        tabOrder: ['button'],
      }),
      platformMinimumTargetPx: minimum,
    });

    expect(gate(results, 'INV-TOUCH-001').status).toBe(expected);
  });

  it('fails when a focusable element never receives focus', () => {
    const results = runRenderedUiGates(
      snapshot({
        interactiveTargets: [
          { focusable: true, height: 44, selector: 'button.hidden-action', width: 44 },
        ],
        tabOrder: [],
      })
    );

    expect(gate(results, 'INV-KEYBOARD-001').evidence[0]).toContain('button.hidden-action');
  });

  it('does not require focus for an explicitly non-focusable element', () => {
    const results = runRenderedUiGates(
      snapshot({
        interactiveTargets: [{ focusable: false, height: 44, selector: 'div.decor', width: 44 }],
        tabOrder: [],
      })
    );

    expect(gate(results, 'INV-KEYBOARD-001').status).toBe('pass');
  });

  it('fails an animation on the layout path', () => {
    const results = runRenderedUiGates(
      snapshot({
        animations: [{ durationMs: 200, properties: ['left', 'width'], selector: 'div.panel' }],
      })
    );

    const cost = gate(results, 'INV-ANIMCOST-001');

    expect(cost.status).toBe('fail');
    expect(cost.evidence[0]).toContain('animates left, width');
  });

  it('accepts compositor-only animation', () => {
    const results = runRenderedUiGates(
      snapshot({
        animations: [{ durationMs: 200, properties: ['transform', 'opacity'], selector: 'div' }],
      })
    );

    expect(gate(results, 'INV-ANIMCOST-001').status).toBe('pass');
  });

  it('ignores layout animation observed under reduced motion, which the motion gate owns', () => {
    const results = runRenderedUiGates(
      snapshotWithReducedMotion({
        animations: [{ durationMs: 20, properties: ['left'], selector: 'div' }],
      })
    );

    expect(gate(results, 'INV-ANIMCOST-001').status).toBe('pass');
  });
});

/**
 * The baseline is a page that actually rendered something and passes on its
 * merits, not an empty snapshot. An empty page satisfies every
 * counterexample search at once, so a suite built on one would still pass if
 * every gate returned `pass` unconditionally — it would prove nothing.
 */
function viewport(overrides: Partial<ViewportSnapshot> = {}): ViewportSnapshot {
  return {
    animations: [{ durationMs: 160, properties: ['opacity'], selector: 'button.save' }],
    axeStatus: 'ran',
    axeViolations: [],
    clippedElements: [],
    contrastSamples: [
      { bold: false, fontSizePx: 16, kind: 'text', ratio: 12.4, selector: 'p.summary' },
      { bold: false, fontSizePx: 0, kind: 'ui', ratio: 4.1, selector: 'button.save' },
    ],
    documentClientWidth: 375,
    documentScrollWidth: 375,
    interactiveTargets: [{ focusable: true, height: 44, selector: 'button.save', width: 96 }],
    observationIntegrity: 'intact',
    reducedMotion: false,
    renderedElementCount: 24,
    tabOrder: ['button.save'],
    viewport: { height: 812, label: 'mobile', width: 375 },
    ...overrides,
  };
}

/** A clean render plus the reduced-motion pass every case captures. */
function snapshot(overrides: Partial<ViewportSnapshot> = {}): RenderedSnapshot {
  return {
    buildDetail: 'Built and observed.',
    buildStatus: 'pass',
    platformMinimumTargetPx: 44,
    // Overrides land on both passes: the reduced-motion capture is the same
    // page at the same width, so a defect present in one is present in both.
    viewports: [viewport(overrides), viewport({ ...overrides, reducedMotion: true })],
  };
}

function snapshotWithReducedMotion(overrides: Partial<ViewportSnapshot>): RenderedSnapshot {
  return {
    ...snapshot(),
    viewports: [viewport(), viewport({ ...overrides, reducedMotion: true })],
  };
}

function withoutReducedMotion(): RenderedSnapshot {
  return { ...snapshot(), viewports: [viewport()] };
}

function gate(results: GateResult[], invariant: string): GateResult {
  const result = results.find((entry) => entry.invariant === invariant);

  if (!result) throw new Error(`No result for ${invariant}.`);

  return result;
}
