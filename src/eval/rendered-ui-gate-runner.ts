import { gateResult, type GateResult } from './gate-result.ts';
import type {
  AnimationSample,
  ContrastSample,
  RenderedSnapshot,
  ViewportSnapshot,
} from './rendered-ui-snapshot.ts';

/** Impacts that block. `moderate` and `minor` are reported by the runner, not gated. */
const blockingAxeImpacts = new Set(['critical', 'serious']);
/** WCAG 2.2 large text: 24px, or 18.66px when bold. */
const largeTextPx = 24;
const largeBoldTextPx = 18.66;
/**
 * Browsers report `scrollWidth` and `clientWidth` as rounded integers, so a
 * single pixel of difference is rounding rather than overflow. More than one is
 * content the reader has to scroll sideways to reach.
 */
const overflowTolerancePx = 1;
/** Half of the last decimal place a ratio is reported to; see `checkContrast`. */
const reportedRatioEpsilon = 0.005;
/** Under this, a reduced-motion transition reads as instant rather than animated. */
const reducedMotionBudgetMs = 40;
/** Properties whose animation forces layout or paint on every frame. */
const layoutThrashingProperties = new Set([
  'bottom',
  'height',
  'left',
  'margin',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'margin-top',
  'padding',
  'right',
  'top',
  'width',
]);
/** Properties that stay meaningful when motion is reduced. */
const reducedMotionSafeProperties = new Set(['opacity', 'visibility']);

/**
 * Turns one rendered snapshot into the render-gated half of the invariant
 * registry.
 *
 * Every gate reports the measurement that decided it, not a verdict alone: a
 * failing run has to tell the author which selector, which ratio, and which
 * width, or the gate is a wall rather than feedback.
 */
export function runRenderedUiGates(snapshot: RenderedSnapshot): GateResult[] {
  if (snapshot.buildStatus !== 'pass') {
    // Nothing downstream is observable, so reporting the other gates as passing
    // would be the "clean report from gates that never ran" failure mode.
    return [buildGate(snapshot), ...unverifiedRenderGates('the build did not produce a page')];
  }

  if (snapshot.viewports.length === 0) {
    return [buildGate(snapshot), ...unverifiedRenderGates('no viewport was rendered')];
  }

  // Measurements taken inside a page that rewrote the measuring functions are
  // not measurements. Reporting them as passes is the failure this whole tier
  // is built to avoid, so the run stops at the build gate.
  const compromised = snapshot.viewports.filter(
    (viewport) => viewport.observationIntegrity === 'compromised'
  );

  if (compromised.length > 0) {
    return [
      gateResult(
        'INV-BUILD-001',
        'critical',
        'render-gated',
        'fail',
        'The page altered the functions the harness measures with, so nothing it reported can be trusted.',
        compromised.map((viewport) => `${label(viewport)} observation primitives were replaced`)
      ),
      ...unverifiedRenderGates('the page tampered with the measurement primitives'),
    ];
  }

  // A page that rendered nothing passes every counterexample search at once.
  // That is the shape of gate theater, so it fails the build gate rather than
  // scoring a perfect run.
  if (snapshot.viewports.every((viewport) => viewport.renderedElementCount === 0)) {
    return [
      gateResult(
        'INV-BUILD-001',
        'critical',
        'render-gated',
        'fail',
        'The page built and loaded but rendered no elements, so no gate had anything to measure.',
        snapshot.viewports.map((viewport) => `${label(viewport)} 0 elements in body`)
      ),
      ...unverifiedRenderGates('the page rendered no elements'),
    ];
  }

  return [
    buildGate(snapshot),
    checkAccessibility(snapshot.viewports),
    checkContrast(snapshot.viewports),
    checkOverflow(snapshot.viewports),
    checkReducedMotion(snapshot.viewports),
    checkTouchTargets(snapshot),
    checkKeyboardReachability(snapshot.viewports),
    checkAnimationCost(snapshot.viewports),
  ];
}

function buildGate(snapshot: RenderedSnapshot): GateResult {
  return gateResult(
    'INV-BUILD-001',
    'critical',
    'render-gated',
    snapshot.buildStatus,
    snapshot.buildDetail
  );
}

function unverifiedRenderGates(reason: string): GateResult[] {
  const gates: Array<[string, 'critical' | 'high']> = [
    ['INV-A11Y-001', 'critical'],
    ['INV-CONTRAST-001', 'critical'],
    ['INV-OVERFLOW-001', 'critical'],
    ['INV-MOTION-001', 'critical'],
    ['INV-TOUCH-001', 'high'],
    ['INV-KEYBOARD-001', 'high'],
    ['INV-ANIMCOST-001', 'high'],
  ];

  return gates.map(([invariant, severity]) =>
    gateResult(invariant, severity, 'render-gated', 'unverified', `Not checked: ${reason}.`)
  );
}

/** `INV-A11Y-001`: axe-core reports no critical or serious violation. */
function checkAccessibility(viewports: readonly ViewportSnapshot[]): GateResult {
  const evidence: string[] = [];
  const unavailable = viewports.filter((snapshot) => snapshot.axeStatus === 'unavailable');

  // An absent scanner reports no violations, which is indistinguishable from a
  // clean page unless the gate refuses to read it as one.
  if (unavailable.length > 0) {
    return gateResult(
      'INV-A11Y-001',
      'critical',
      'render-gated',
      'unverified',
      'axe-core did not run, so no accessibility claim can be made.',
      unavailable.map((snapshot) => `${label(snapshot)} axe-core unavailable`)
    );
  }

  for (const snapshot of viewports) {
    for (const violation of snapshot.axeViolations) {
      if (violation.impact === null || !blockingAxeImpacts.has(violation.impact)) continue;

      evidence.push(
        `${label(snapshot)} ${violation.id} (${violation.impact}): ${violation.help} — ${violation.nodes.join(', ')}`
      );
    }
  }

  return verdict('INV-A11Y-001', 'critical', evidence, 'No critical or serious axe violation.');
}

/** `INV-CONTRAST-001`: measured pixel contrast against the WCAG 2.2 thresholds. */
function checkContrast(viewports: readonly ViewportSnapshot[]): GateResult {
  const evidence: string[] = [];

  for (const snapshot of viewports) {
    for (const sample of snapshot.contrastSamples) {
      const required = requiredContrast(sample);

      // Ratios are reported to two decimals, so a measurement that prints as
      // exactly 4.50 must not fail on a hidden 4.4996. This widens the gate by
      // half of the last reported digit and no further.
      if (sample.ratio + reportedRatioEpsilon >= required) continue;

      evidence.push(
        `${label(snapshot)} ${sample.selector}: measured ${sample.ratio.toFixed(2)}:1, needs ${required.toFixed(1)}:1 (${sample.kind}, ${sample.fontSizePx}px${sample.bold ? ' bold' : ''})`
      );
    }
  }

  return verdict(
    'INV-CONTRAST-001',
    'critical',
    evidence,
    'Rendered contrast meets WCAG 2.2 at every sampled pair.'
  );
}

function requiredContrast(sample: ContrastSample): number {
  if (sample.kind === 'ui') return 3;

  const isLarge =
    sample.fontSizePx >= largeTextPx || (sample.bold && sample.fontSizePx >= largeBoldTextPx);

  return isLarge ? 3 : 4.5;
}

/** `INV-OVERFLOW-001`: no horizontal overflow or clipping at any declared width. */
function checkOverflow(viewports: readonly ViewportSnapshot[]): GateResult {
  const evidence: string[] = [];

  for (const snapshot of viewports) {
    const overflow = snapshot.documentScrollWidth - snapshot.documentClientWidth;

    if (overflow > overflowTolerancePx) {
      evidence.push(
        `${label(snapshot)}: content is ${snapshot.documentScrollWidth}px wide in a ${snapshot.documentClientWidth}px viewport (+${overflow}px)`
      );
    }

    for (const selector of snapshot.clippedElements) {
      evidence.push(`${label(snapshot)}: ${selector} is clipped by an ancestor`);
    }
  }

  return verdict(
    'INV-OVERFLOW-001',
    'critical',
    evidence,
    'No horizontal overflow or clipping at the declared viewports.'
  );
}

/**
 * `INV-MOTION-001`: with `prefers-reduced-motion: reduce`, motion is removed or
 * replaced. A fade is a replacement; a 300ms slide is the same animation.
 */
function checkReducedMotion(viewports: readonly ViewportSnapshot[]): GateResult {
  const reduced = viewports.filter((snapshot) => snapshot.reducedMotion);

  if (reduced.length === 0) {
    return gateResult(
      'INV-MOTION-001',
      'critical',
      'render-gated',
      'unverified',
      'Not checked: no reduced-motion render was captured.'
    );
  }

  const evidence: string[] = [];

  for (const snapshot of reduced) {
    for (const animation of snapshot.animations) {
      if (animation.durationMs <= reducedMotionBudgetMs) continue;

      const unsafe = animation.properties.filter(
        (property) => !reducedMotionSafeProperties.has(property)
      );

      if (unsafe.length === 0) continue;

      evidence.push(
        `${label(snapshot)} ${animation.selector}: ${animation.durationMs}ms on ${unsafe.join(', ')} survives prefers-reduced-motion`
      );
    }
  }

  return verdict(
    'INV-MOTION-001',
    'critical',
    evidence,
    'Motion is removed or replaced under prefers-reduced-motion.'
  );
}

/** `INV-TOUCH-001`: measured hit areas against the platform minimum. */
function checkTouchTargets(snapshot: RenderedSnapshot): GateResult {
  const minimum = snapshot.platformMinimumTargetPx;
  const evidence: string[] = [];

  for (const viewport of snapshot.viewports) {
    for (const target of viewport.interactiveTargets) {
      if (target.width >= minimum && target.height >= minimum) continue;

      evidence.push(
        `${label(viewport)} ${target.selector}: ${round(target.width)}x${round(target.height)}px, minimum ${minimum}x${minimum}px`
      );
    }
  }

  return verdict(
    'INV-TOUCH-001',
    'high',
    evidence,
    `Every interactive target meets the ${minimum}px minimum.`
  );
}

/** `INV-KEYBOARD-001`: every focusable interactive element is reachable by Tab. */
function checkKeyboardReachability(viewports: readonly ViewportSnapshot[]): GateResult {
  const evidence: string[] = [];

  for (const snapshot of viewports) {
    const reachable = new Set(snapshot.tabOrder);

    for (const target of snapshot.interactiveTargets) {
      if (!target.focusable || reachable.has(target.selector)) continue;

      evidence.push(
        `${label(snapshot)} ${target.selector} is interactive but never receives focus`
      );
    }
  }

  return verdict(
    'INV-KEYBOARD-001',
    'high',
    evidence,
    'Tab traversal reaches every interactive element.'
  );
}

/**
 * `INV-ANIMCOST-001`: transitions stay off the layout path.
 *
 * Two signals, because either alone misleads: animating `width` is wrong even
 * when the machine is fast enough to hide it, and a compositor-only animation
 * can still drop frames when too much runs at once.
 */
function checkAnimationCost(viewports: readonly ViewportSnapshot[]): GateResult {
  const evidence: string[] = [];

  for (const snapshot of viewports) {
    if (snapshot.reducedMotion) continue;

    for (const animation of snapshot.animations) {
      const thrashing = thrashingProperties(animation);

      if (thrashing.length === 0) continue;

      evidence.push(
        `${label(snapshot)} ${animation.selector}: animates ${thrashing.join(', ')}, which forces layout each frame`
      );
    }
  }

  // Layout-path detection only. Frame timing is not measured anywhere in this
  // phase: a wall-clock budget is machine-dependent, and carrying a field that
  // is always zero let the gate's pass text claim a budget check that never
  // happened. What this gate proves is stated exactly.
  return verdict(
    'INV-ANIMCOST-001',
    'high',
    evidence,
    'No animated property forces layout on every frame.'
  );
}

function thrashingProperties(animation: AnimationSample): string[] {
  return animation.properties.filter((property) => layoutThrashingProperties.has(property));
}

/**
 * `note` carries a measurement that is reported at both verdicts and gates at
 * neither, so a reported-only signal cannot reach `evidence` and silently
 * become blocking.
 */
function verdict(
  invariant: string,
  severity: 'critical' | 'high',
  evidence: string[],
  passDetail: string,
  note = ''
): GateResult {
  return evidence.length === 0
    ? gateResult(invariant, severity, 'render-gated', 'pass', passDetail)
    : gateResult(
        invariant,
        severity,
        'render-gated',
        'fail',
        `${evidence.length} failing measurement(s).${note}`,
        evidence
      );
}

function label(snapshot: ViewportSnapshot): string {
  const motion = snapshot.reducedMotion ? ', reduced-motion' : '';

  return `[${snapshot.viewport.label} ${snapshot.viewport.width}px${motion}]`;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
