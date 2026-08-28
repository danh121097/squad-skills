/**
 * What one rendered observation of a candidate component contains.
 *
 * The snapshot is the seam between "drive a browser" and "decide whether the
 * output passed". Keeping it a plain data structure means the gate logic is
 * exercised deterministically in `pnpm test` against fixtures with known
 * defects, while the browser stays behind `pnpm eval:designer` where a missing
 * binary is reported as unverified rather than downloaded mid-gate.
 */
export interface ViewportSpec {
  height: number;
  label: string;
  width: number;
}

export interface AxeViolation {
  help: string;
  id: string;
  impact: 'critical' | 'minor' | 'moderate' | 'serious' | null;
  nodes: string[];
}

/** One measured contrast pair, computed from rendered pixels rather than tokens. */
export interface ContrastSample {
  bold: boolean;
  fontSizePx: number;
  /** `text` uses the 4.5:1 / 3:1 split; `ui` is non-text contrast at 3:1. */
  kind: 'text' | 'ui';
  ratio: number;
  selector: string;
}

export interface InteractiveTarget {
  focusable: boolean;
  height: number;
  selector: string;
  width: number;
}

export interface AnimationSample {
  durationMs: number;
  /** Animated CSS properties or their platform equivalents. */
  properties: string[];
  selector: string;
}

export interface ViewportSnapshot {
  animations: AnimationSample[];
  /**
   * Whether axe-core actually executed. An empty violation list means two
   * opposite things — a clean page, or a scanner that never loaded — and only
   * this field separates them.
   */
  axeStatus: 'ran' | 'unavailable';
  axeViolations: AxeViolation[];
  /** Selectors whose content is cut off by an ancestor at this width. */
  clippedElements: string[];
  contrastSamples: ContrastSample[];
  documentClientWidth: number;
  documentScrollWidth: number;
  interactiveTargets: InteractiveTarget[];
  /**
   * Whether the page left the measurement primitives alone. `compromised` means
   * the numbers in this snapshot cannot be trusted, so they are reported as
   * unverified rather than read as results.
   */
  observationIntegrity: 'compromised' | 'intact';
  reducedMotion: boolean;
  /**
   * Elements rendered inside `body`. Every rendered gate is a search for a
   * counterexample, so a page that renders nothing satisfies all of them at
   * once; this is what tells a real pass from an empty one.
   */
  renderedElementCount: number;
  /** Selectors in document tab order, as traversed by pressing Tab. */
  tabOrder: string[];
  viewport: ViewportSpec;
}

export interface RenderedSnapshot {
  buildDetail: string;
  buildStatus: 'fail' | 'pass' | 'unverified';
  /** 44 for web and Apple targets, 48 for Android/Compose. */
  platformMinimumTargetPx: number;
  viewports: ViewportSnapshot[];
}

/**
 * The five widths the contract's overflow gate names. Fixed rather than
 * per-case so an author cannot pick widths their layout already survives.
 */
export const defaultViewports: ViewportSpec[] = [
  { height: 720, label: 'mobile-min', width: 320 },
  { height: 812, label: 'mobile', width: 375 },
  { height: 1024, label: 'tablet', width: 768 },
  { height: 800, label: 'laptop', width: 1024 },
  { height: 900, label: 'desktop', width: 1440 },
];

/**
 * Platform minimum hit area in CSS pixels, per the platform's own guidance.
 *
 * Only render-gated platforms reach this today — web and adaptive, both 44 —
 * so the Compose row records the rule rather than enforcing it. Compose stops
 * at compile plus human review, where no hit area is measured at all.
 */
export function minimumTargetSize(platform: string): number {
  return platform === 'compose' ? 48 : 44;
}
