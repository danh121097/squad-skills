import { gateResult, type GateResult } from './gate-result.ts';
import { executableLines } from './source-comment-scanner.ts';
import {
  defaultTokenFilePatterns,
  rawStyleLiteralRules,
  scopeRules,
  type ScopeRule,
} from './presentational-scope-rules.ts';

export interface CandidateFile {
  /** POSIX path relative to the run directory. */
  path: string;
  source: string;
}

export interface StaticGateOptions {
  /**
   * Package roots the evidence packet already contains. Anything else is a new
   * dependency, which the designer boundary forbids without approval.
   */
  approvedDependencies?: readonly string[];
  files: readonly CandidateFile[];
  /** Words above which a bundled document counts as a copied source page. */
  maxBundledDocumentWords?: number;
  tokenFilePatterns?: readonly RegExp[];
}

/** Explicit escape hatch a reviewer grants in the diff, not something a run can assume. */
const approvalMarker = /eval-approved-dependency\s*:\s*\S+/;
const importPattern =
  /(?:from\s+|import\s+|require\s*\(\s*|import\s*\(\s*)['"]([^'"\n]+)['"]|^\s*(?:import|export)\s+['"]([^'"\n]+)['"]/gm;
const documentExtensions = ['.md', '.mdx', '.html', '.htm', '.txt', '.rst'];
const urlPattern = /https?:\/\/[^\s)"'<>]+/g;

/**
 * Runs the static half of the invariant registry over candidate output.
 *
 * Static because these four facts are decidable from the text: what the code
 * imports, what capability it reaches for, whether it shipped a copy of a
 * source page, and whether it styles through tokens. Everything about how the
 * result looks or behaves belongs to the rendered tier.
 *
 * Comments and string-only lines are stripped before matching so a rule named
 * in prose ("never call fetch here") cannot fail a correct component.
 */
export function runPresentationalStaticGates(options: StaticGateOptions): GateResult[] {
  const { files } = options;

  // Every static invariant reports, even with nothing to scan. Dropping three
  // of the four would make a run where nothing was checked look like a run with
  // a narrower registry, and the rendered tier already emits all seven.
  if (files.length === 0) {
    const nothingScanned = 'No candidate files were produced, so nothing could be scanned.';

    return [
      gateResult('INV-SCOPE-001', 'high', 'static', 'unverified', nothingScanned),
      gateResult('INV-DEP-001', 'high', 'static', 'unverified', nothingScanned),
      gateResult('INV-SOURCE-001', 'critical', 'static', 'unverified', nothingScanned),
      gateResult('INV-TOKEN-001', 'medium', 'static', 'unverified', nothingScanned),
    ];
  }

  return [
    checkForbiddenCapabilities(files),
    checkDependencies(files, options.approvedDependencies ?? []),
    checkBundledSources(files, options.maxBundledDocumentWords ?? 200),
    checkTokenUsage(files, options.tokenFilePatterns ?? defaultTokenFilePatterns),
  ];
}

/** `INV-SCOPE-001`: the emitted component must be inert. */
function checkForbiddenCapabilities(files: readonly CandidateFile[]): GateResult {
  const evidence: string[] = [];

  for (const file of files) {
    for (const { line, text } of executableLines(file.source)) {
      for (const rule of scopeRules) {
        if (!rule.pattern.test(text)) continue;

        evidence.push(`${file.path}:${line} ${describe(rule)} — ${text.trim().slice(0, 120)}`);
      }
    }
  }

  return evidence.length === 0
    ? gateResult(
        'INV-SCOPE-001',
        'high',
        'static',
        'pass',
        'No data, routing, store, persistence, analytics, or credential access in emitted output.'
      )
    : gateResult(
        'INV-SCOPE-001',
        'high',
        'static',
        'fail',
        `${evidence.length} forbidden capability use(s); state, data, routing, and lifecycle belong to the build role.`,
        evidence
      );
}

/** `INV-DEP-001`: a new package is a material change, so it needs an approval marker. */
function checkDependencies(
  files: readonly CandidateFile[],
  approved: readonly string[]
): GateResult {
  const approvedRoots = new Set(approved);
  const evidence: string[] = [];

  for (const file of files) {
    const lines = file.source.split('\n');

    for (const { line, text } of executableLines(file.source)) {
      for (const specifier of readImportSpecifiers(text)) {
        const root = packageRoot(specifier);

        if (root === null || approvedRoots.has(root)) continue;
        // The marker may sit on the import line or the line above it, which is
        // where a reviewer naturally writes the reason.
        if (hasApprovalMarker(lines, line)) continue;

        evidence.push(`${file.path}:${line} imports unapproved package "${root}"`);
      }
    }
  }

  return evidence.length === 0
    ? gateResult(
        'INV-DEP-001',
        'high',
        'static',
        'pass',
        'No unapproved dependency was introduced.'
      )
    : gateResult(
        'INV-DEP-001',
        'high',
        'static',
        'fail',
        `${evidence.length} import(s) reach outside the approved dependency set without an approval marker.`,
        evidence
      );
}

/**
 * `INV-SOURCE-001`: sources are fetched from the registry at the moment of use,
 * never copied into output. A long prose document carrying source URLs is what
 * a copied page looks like once it lands in a run directory.
 */
function checkBundledSources(files: readonly CandidateFile[], maxWords: number): GateResult {
  const evidence: string[] = [];

  for (const file of files) {
    if (!documentExtensions.some((extension) => file.path.toLowerCase().endsWith(extension))) {
      continue;
    }

    const words = file.source.split(/[ \t\n\r\f\v]+/).filter((word) => word.length > 0).length;

    if (words <= maxWords) continue;

    const urls = [...new Set(file.source.match(urlPattern) ?? [])];

    if (urls.length === 0) continue;

    evidence.push(
      `${file.path}: ${words} words carrying ${urls.length} source URL(s), first ${urls[0]}`
    );
  }

  return evidence.length === 0
    ? gateResult(
        'INV-SOURCE-001',
        'critical',
        'static',
        'pass',
        'No source page content was bundled into the output.'
      )
    : gateResult(
        'INV-SOURCE-001',
        'critical',
        'static',
        'fail',
        `${evidence.length} document(s) look like copied source pages; register the source instead of bundling it.`,
        evidence
      );
}

/** `INV-TOKEN-001`: styling resolves to semantic tokens rather than raw literals. */
function checkTokenUsage(
  files: readonly CandidateFile[],
  tokenFilePatterns: readonly RegExp[]
): GateResult {
  const evidence: string[] = [];

  for (const file of files) {
    if (tokenFilePatterns.some((pattern) => pattern.test(file.path))) continue;

    for (const { line, text } of executableLines(file.source)) {
      for (const rule of rawStyleLiteralRules) {
        const matches = [...text.matchAll(rule.pattern)].map((match) => match[0]);

        if (matches.length === 0) continue;

        evidence.push(`${file.path}:${line} ${rule.id}: ${matches.join(', ')}`);
      }
    }
  }

  return evidence.length === 0
    ? gateResult(
        'INV-TOKEN-001',
        'medium',
        'static',
        'pass',
        'Styling resolves through tokens outside declared token files.'
      )
    : gateResult(
        'INV-TOKEN-001',
        'medium',
        'static',
        'fail',
        `${evidence.length} raw styling literal(s) outside a token or theme file.`,
        evidence
      );
}

function readImportSpecifiers(text: string): string[] {
  return [...text.matchAll(importPattern)]
    .map((match) => match[1] ?? match[2])
    .filter((specifier): specifier is string => specifier !== undefined);
}

/** Relative and absolute specifiers are project files, not dependencies. */
function packageRoot(specifier: string): string | null {
  if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('~')) {
    return null;
  }

  const segments = specifier.split('/');

  return specifier.startsWith('@') ? segments.slice(0, 2).join('/') : (segments[0] ?? null) || null;
}

function hasApprovalMarker(lines: readonly string[], line: number): boolean {
  return [lines[line - 1], lines[line - 2]].some(
    (candidate) => candidate !== undefined && approvalMarker.test(candidate)
  );
}

function describe(rule: ScopeRule): string {
  return `${rule.capability} (${rule.id}, ${rule.platforms})`;
}
