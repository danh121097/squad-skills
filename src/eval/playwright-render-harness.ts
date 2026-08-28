import { access, mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { captureOriginalsScript } from './rendered-ui-integrity-script.ts';
import { collectObservationsScript } from './rendered-ui-page-script.ts';
import {
  defaultViewports,
  type AxeViolation,
  type RenderedSnapshot,
  type ViewportSnapshot,
  type ViewportSpec,
} from './rendered-ui-snapshot.ts';
import { serveDirectory } from './static-file-server.ts';

export interface RenderHarnessOptions {
  platformMinimumTargetPx: number;
  /** Viewport whose reduced-motion re-render answers `INV-MOTION-001`. */
  reducedMotionViewportLabel?: string;
  runDirectory: string;
  /**
   * Where to write one PNG per viewport. Judging needs rendered pixels — a
   * judge given only code is grading code — and the deterministic gates need
   * none of this, so capture stays opt-in and its failure never fails a gate.
   */
  screenshotDirectory?: string;
  viewports?: readonly ViewportSpec[];
}

export interface RenderHarnessOutcome {
  /** Pinned browser build, or `absent` when nothing rendered. */
  renderer: string;
  /** Captured PNG paths, empty unless `screenshotDirectory` was given. */
  screenshots: string[];
  snapshot: RenderedSnapshot;
}

/** Enough presses to traverse a component; a runaway focus trap stops here. */
const maxTabPresses = 60;
const harnessEntry = 'index.html';
const buildOutputDirectory = 'dist';

/**
 * Builds the candidate with Vite and observes it in headless Chromium.
 *
 * The run directory supplies its own `index.html` entry, so the harness stays
 * framework-agnostic: it never imports React, Vue, or Svelte, it builds
 * whatever the entry imports. A candidate that ships no entry fails
 * `INV-BUILD-001` rather than silently rendering nothing.
 *
 * A missing Vite, Playwright, or browser binary yields `absent` and an empty
 * viewport list, which the gate runner reports as unverified. Downloading a
 * browser mid-gate would make grading depend on the network the contract says
 * it must not touch.
 */
export async function renderCandidate(
  options: RenderHarnessOptions
): Promise<RenderHarnessOutcome> {
  const { runDirectory } = options;

  try {
    await access(path.join(runDirectory, harnessEntry));
  } catch {
    return absent(`No ${harnessEntry} in the run directory; nothing could be built.`, 'fail');
  }

  const buildError = await buildCandidate(runDirectory);

  if (buildError) return absent(buildError.detail, buildError.status);

  const server = await serveDirectory(path.join(runDirectory, buildOutputDirectory));

  try {
    return await observe(options, server.origin);
  } finally {
    await server.close();
  }
}

/**
 * A directory with no `.env` files, kept outside the candidate's reach.
 *
 * `envDir` has to point somewhere; pointing it at the run directory is what we
 * are avoiding, and pointing it at the repository would load the maintainer's
 * environment into a candidate build.
 */
const buildEnvironmentDirectory = tmpdir();

/** Any single in-page step that outlasts this is a candidate that will not stop. */
const pageTimeoutMs = 30_000;

async function buildCandidate(
  runDirectory: string
): Promise<{ detail: string; status: 'fail' | 'unverified' } | null> {
  let build: (config: Record<string, unknown>) => Promise<unknown>;

  try {
    ({ build } = (await import('vite')) as unknown as {
      build: (config: Record<string, unknown>) => Promise<unknown>;
    });
  } catch {
    return {
      detail: 'Vite is not installed, so the candidate was not built.',
      status: 'unverified',
    };
  }

  try {
    await build({
      build: { emptyOutDir: true, outDir: buildOutputDirectory },
      // `configFile: false` stops Vite reading `vite.config.*`, but Vite still
      // searches the root for a PostCSS config and imports it into this
      // process. The root is the candidate's own directory, so a candidate that
      // writes `postcss.config.js` executes arbitrary Node code with the
      // harness's privileges — including rewriting the gates about to grade it.
      // An inline `postcss` object is the documented way to disable that search.
      configFile: false,
      css: { postcss: {} },
      // Same reasoning for `.env` files: `envDir` defaults to the root, and
      // loading candidate-authored env into the build is a channel this harness
      // has no use for.
      envDir: buildEnvironmentDirectory,
      logLevel: 'silent',
      root: runDirectory,
    });

    return null;
  } catch (error) {
    return { detail: `Build failed: ${(error as Error).message.split('\n')[0]}`, status: 'fail' };
  }
}

async function observe(
  options: RenderHarnessOptions,
  origin: string
): Promise<RenderHarnessOutcome> {
  const viewports = options.viewports ?? defaultViewports;
  const reducedLabel = options.reducedMotionViewportLabel ?? viewports[0]?.label;

  let chromium: typeof import('playwright').chromium;

  try {
    ({ chromium } = await import('playwright'));
  } catch {
    return absent('Playwright is not installed, so the built page was not observed.', 'unverified');
  }

  let browser: Awaited<ReturnType<typeof chromium.launch>>;

  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    // `pass` next to "no browser could start" is the inversion this tier exists
    // to prevent, even though the zero-viewport path already blocks the run.
    return absent(
      `The build succeeded but no browser could start: ${(error as Error).message.split('\n')[0]}`,
      'unverified'
    );
  }

  const axeSource = await readAxeSource();
  const screenshotDirectory = options.screenshotDirectory ?? null;

  if (screenshotDirectory) await mkdir(screenshotDirectory, { recursive: true });

  const screenshots: string[] = [];
  const snapshots: ViewportSnapshot[] = [];
  // Read before the browser closes: the finally block runs before this
  // function's return expression is evaluated.
  const renderer = `chromium ${browser.version()}`;

  try {
    for (const viewport of viewports) {
      // Only the default-motion pass is captured: a reduced-motion still frame
      // of the same layout tells a judge nothing the first image did not.
      const screenshotPath = screenshotDirectory
        ? path.join(screenshotDirectory, `${viewport.label}.png`)
        : null;

      snapshots.push(
        await capture({
          axeSource,
          browser,
          origin,
          // Recorded only once the file exists. A path for a capture that threw
          // is a promise of a render nothing wrote, and the judging stager
          // downstream would fail the whole run copying it.
          onScreenshot: (written) => screenshots.push(written),
          reducedMotion: false,
          screenshotPath,
          viewport,
        })
      );

      if (viewport.label === reducedLabel) {
        snapshots.push(
          await capture({
            axeSource,
            browser,
            origin,
            reducedMotion: true,
            screenshotPath: null,
            viewport,
          })
        );
      }
    }
  } finally {
    await browser.close();
  }

  return {
    renderer,
    screenshots,
    snapshot: {
      buildDetail: `Built with Vite and observed at ${viewports.length} viewport(s).`,
      buildStatus: 'pass',
      platformMinimumTargetPx: options.platformMinimumTargetPx,
      viewports: snapshots,
    },
  };
}

async function capture(options: {
  axeSource: string | null;
  browser: Awaited<ReturnType<typeof import('playwright').chromium.launch>>;
  onScreenshot?: (path: string) => void;
  origin: string;
  reducedMotion: boolean;
  screenshotPath: string | null;
  viewport: ViewportSpec;
}): Promise<ViewportSnapshot> {
  const { axeSource, browser, onScreenshot, origin, reducedMotion, screenshotPath, viewport } =
    options;
  const context = await browser.newContext({
    colorScheme: 'light',
    deviceScaleFactor: 1,
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
    viewport: { height: viewport.height, width: viewport.width },
  });

  const page = await context.newPage();

  // Candidate code is untrusted and unbounded: it can spin forever inside a
  // method the observation script calls, which pinned one run at four minutes
  // per viewport with no timeout to stop it.
  page.setDefaultTimeout(pageTimeoutMs);

  try {
    // Before any page script: this is what makes the measurements below the
    // browser's own rather than the candidate's.
    await page.addInitScript(captureOriginalsScript);
    await page.goto(origin, { waitUntil: 'load' });

    const observations = (await withTimeout(
      page.evaluate(collectObservationsScript),
      'observation script'
    )) as Omit<
      ViewportSnapshot,
      'axeStatus' | 'axeViolations' | 'reducedMotion' | 'tabOrder' | 'viewport'
    >;

    // Before axe injects its own script tag, so the image is the candidate's
    // page rather than the scanner's view of it. A capture failure is swallowed:
    // no gate reads a screenshot, and losing one must not turn a graded run into
    // an ungraded one.
    if (screenshotPath) {
      try {
        await page.screenshot({ fullPage: true, path: screenshotPath });
        onScreenshot?.(screenshotPath);
      } catch {
        // Reported by the absence of the path in the outcome, never by failing
        // a gate: nothing here reads a screenshot to decide anything.
      }
    }

    return {
      ...observations,
      axeStatus: axeSource === null ? 'unavailable' : 'ran',
      axeViolations: await runAxe(page, axeSource),
      reducedMotion,
      tabOrder: await traverseTabOrder(page),
      viewport,
    };
  } finally {
    await context.close();
  }
}

/**
 * Returns violations only. Whether the scanner ran at all is carried separately
 * by `axeStatus`, because an empty list here means either a clean page or no
 * scanner, and the gate must not read the second as the first.
 */
async function runAxe(
  page: import('playwright').Page,
  axeSource: string | null
): Promise<AxeViolation[]> {
  if (axeSource === null) return [];

  await page.addScriptTag({ content: axeSource });

  const violations = (await withTimeout(
    page.evaluate(
      `window.axe.run(document, { resultTypes: ['violations'] }).then((r) =>
       r.violations.map((v) => ({ help: v.help, id: v.id, impact: v.impact ?? null,
         nodes: v.nodes.map((n) => n.target.join(' ')) })))`
    ),
    'axe-core'
  )) as AxeViolation[];

  return violations;
}

/**
 * Bounds any in-page promise. `page.setDefaultTimeout` covers navigation and
 * actions but not `evaluate`, which is where candidate code runs.
 */
function withTimeout<T>(work: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    work,
    new Promise<never>((_resolve, reject) =>
      setTimeout(
        () => reject(new Error(`${label} exceeded ${pageTimeoutMs}ms`)),
        pageTimeoutMs
      ).unref()
    ),
  ]);
}

/** Real Tab traversal, not a DOM guess: it is the only way a focus trap shows up. */
async function traverseTabOrder(page: import('playwright').Page): Promise<string[]> {
  const order: string[] = [];

  await withTimeout(page.evaluate('document.body.focus()'), 'focus');

  for (let press = 0; press < maxTabPresses; press += 1) {
    await page.keyboard.press('Tab');

    const selector = (await withTimeout(
      page.evaluate(
        'document.activeElement && window.__evalOriginals ? window.__evalOriginals.selectorFor(document.activeElement) : null'
      ),
      'tab traversal'
    )) as string | null;

    if (selector === null || selector === 'body') break;
    if (order.includes(selector)) break;

    order.push(selector);
  }

  return order;
}

async function readAxeSource(): Promise<string | null> {
  try {
    const entry = import.meta.resolve('axe-core');

    return await readFile(new URL(entry), 'utf8');
  } catch {
    return null;
  }
}

function absent(detail: string, status: 'fail' | 'pass' | 'unverified'): RenderHarnessOutcome {
  return {
    renderer: 'absent',
    screenshots: [],
    snapshot: {
      buildDetail: detail,
      buildStatus: status,
      platformMinimumTargetPx: 0,
      viewports: [],
    },
  };
}
