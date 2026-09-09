import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Which contract a file in a written plan bundle answers to.
 *
 * The kind is derived from where the file sits, never from what it says about
 * itself: the whole point of the directory layout is that a reader learns a
 * file's role from its path before opening it.
 */
export type PlanDocumentKind = 'adr' | 'artifact' | 'index' | 'phase' | 'reference';

export interface PlanDocument {
  /** Markdown after the frontmatter block, for checkbox and link scanning. */
  body: string;
  /** Raw YAML frontmatter text, or null when the file states none. */
  frontMatter: string | null;
  kind: PlanDocumentKind;
  /** Zero-padded ordinal from the filename, for phases and ADRs only. */
  number: number | null;
  /** Bundle-relative POSIX path, which is also how every error names a file. */
  relativePath: string;
  source: string;
}

export interface PlanBundleLayout {
  documents: PlanDocument[];
  errors: string[];
}

/**
 * The four directories a plan bundle root may hold beside `plan.md`.
 *
 * `phases/` is the only one that carries order. The other three exist so that
 * ordering, decisions, produced evidence and shared background cannot be told
 * apart only by reading filenames at one flat root — which is what the previous
 * layout asked of a reader, and what a bundle of any size stopped delivering.
 */
export const planBundleDirectories = ['adr', 'artifacts', 'phases', 'references'] as const;

export const planIndexFile = 'plan.md';

const kebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const phaseFileName = /^phase-(\d{2,})-([a-z0-9-]+)\.md$/;
const adrFileName = /^adr-(\d{3,})-([a-z0-9-]+)\.md$/;
/** The prefix `phases/` reserves. Nothing outside it may open with one. */
const reservedPhasePrefix = /^phase-\d/;
const frontMatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

/**
 * Reads a written plan bundle from disk and reports every layout rule it breaks.
 *
 * Layout is checked before anything else because the later checks are stated in
 * terms of it: a gate artifact is found by being under `artifacts/`, and phase
 * order is read from `phases/` filenames. A bundle whose root is a flat pile of
 * Markdown has no place to hang those questions, so it fails here and stops.
 */
export async function readPlanBundle(bundleRoot: string): Promise<PlanBundleLayout> {
  const errors: string[] = [];
  const documents: PlanDocument[] = [];

  let rootEntries;

  try {
    rootEntries = await readdir(bundleRoot, { withFileTypes: true });
  } catch {
    return { documents, errors: [`${bundleRoot}: plan bundle directory could not be read.`] };
  }

  const directories = rootEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const files = rootEntries.filter((entry) => entry.isFile()).map((entry) => entry.name);

  if (!files.includes(planIndexFile)) {
    errors.push(`${planIndexFile} is missing; it is the bundle's only entrypoint and index.`);
  }

  for (const file of files.sort()) {
    if (file === planIndexFile) continue;
    errors.push(
      `${file}: the plan root holds only ${planIndexFile} and the ${planBundleDirectories.join('/, ')}/ directories. Move it into the directory that owns it.`
    );
  }

  for (const directory of directories.sort()) {
    if ((planBundleDirectories as readonly string[]).includes(directory)) continue;
    errors.push(
      `${directory}/: not a standard plan directory. Use one of ${planBundleDirectories.map((name) => `${name}/`).join(', ')}.`
    );
  }

  if (!directories.includes('phases')) {
    errors.push(
      'phases/ is missing; it is the only directory that expresses implementation order.'
    );
  }

  if (files.includes(planIndexFile)) {
    documents.push(await readDocument(bundleRoot, planIndexFile, 'index', null));
  }

  documents.push(...(await readPhases(bundleRoot, directories, errors)));
  documents.push(...(await readAdrs(bundleRoot, directories, errors)));
  documents.push(
    ...(await readFlatDirectory(bundleRoot, directories, 'artifacts', 'artifact', errors))
  );
  documents.push(
    ...(await readFlatDirectory(bundleRoot, directories, 'references', 'reference', errors))
  );

  return { documents, errors };
}

async function readPhases(
  bundleRoot: string,
  directories: string[],
  errors: string[]
): Promise<PlanDocument[]> {
  if (!directories.includes('phases')) return [];

  const entries = await listMarkdown(bundleRoot, 'phases', errors);
  const documents: PlanDocument[] = [];
  const numbers: number[] = [];

  for (const entry of entries) {
    const match = entry.match(phaseFileName);

    if (!match?.[1] || !match[2]) {
      errors.push(
        `phases/${entry}: a phase file is named phase-XX-<kebab-case-title>.md with a zero-padded number.`
      );
      continue;
    }

    if (!kebabCase.test(match[2])) {
      errors.push(`phases/${entry}: the title after the number must be kebab-case.`);
      continue;
    }

    const number = Number.parseInt(match[1], 10);

    numbers.push(number);
    documents.push(await readDocument(bundleRoot, `phases/${entry}`, 'phase', number));
  }

  reportPhaseNumbering(numbers, errors);

  return documents;
}

/**
 * Phase numbers are the plan's running order, so a gap or a repeat is not a
 * cosmetic problem: it either hides a phase that was deleted without its
 * dependents being re-sequenced, or gives two files the same position.
 */
function reportPhaseNumbering(numbers: number[], errors: string[]): void {
  if (numbers.length === 0) {
    errors.push('phases/: a plan bundle has at least one phase file, including a one-phase plan.');
    return;
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const seen = new Set<number>();

  for (const number of sorted) {
    if (seen.has(number)) errors.push(`phases/: phase ${pad(number)} is numbered twice.`);
    seen.add(number);
  }

  for (const [index, number] of [...seen].entries()) {
    const expected = index + 1;

    if (number !== expected) {
      errors.push(
        `phases/: phase numbering must run continuously from 01; expected phase-${pad(expected)}- and found phase-${pad(number)}-.`
      );

      return;
    }
  }
}

async function readAdrs(
  bundleRoot: string,
  directories: string[],
  errors: string[]
): Promise<PlanDocument[]> {
  if (!directories.includes('adr')) return [];

  const entries = await listMarkdown(bundleRoot, 'adr', errors);
  const documents: PlanDocument[] = [];
  const seen = new Set<number>();

  for (const entry of entries) {
    if (reservedPhasePrefix.test(entry)) {
      errors.push(`adr/${entry}: the phase-XX- prefix belongs to phases/ alone.`);
      continue;
    }

    const match = entry.match(adrFileName);

    if (!match?.[1] || !match[2] || !kebabCase.test(match[2])) {
      errors.push(`adr/${entry}: an ADR is named adr-NNN-<kebab-case-title>.md.`);
      continue;
    }

    const number = Number.parseInt(match[1], 10);

    // Deliberately not a continuity check. An ADR number is an identity a phase
    // and a later ADR cite; renumbering to close a gap would break those
    // citations, and the number never claimed to state implementation order.
    if (seen.has(number)) errors.push(`adr/: ADR number ${match[1]} is used twice.`);
    seen.add(number);

    documents.push(await readDocument(bundleRoot, `adr/${entry}`, 'adr', number));
  }

  return documents;
}

async function readFlatDirectory(
  bundleRoot: string,
  directories: string[],
  directory: 'artifacts' | 'references',
  kind: PlanDocumentKind,
  errors: string[]
): Promise<PlanDocument[]> {
  if (!directories.includes(directory)) return [];

  const entries = await listMarkdown(bundleRoot, directory, errors);
  const documents: PlanDocument[] = [];

  for (const entry of entries) {
    if (reservedPhasePrefix.test(entry)) {
      errors.push(
        `${directory}/${entry}: the phase-XX- prefix belongs to phases/ alone, because only phases/ states order. Record the owning phase in frontmatter and name a handoff handoff-to-phase-XX.md.`
      );
      continue;
    }

    if (!kebabCase.test(entry.slice(0, -'.md'.length))) {
      errors.push(`${directory}/${entry}: use a kebab-case filename.`);
      continue;
    }

    documents.push(await readDocument(bundleRoot, `${directory}/${entry}`, kind, null));
  }

  return documents;
}

/**
 * Markdown files directly inside `directory`.
 *
 * Nested directories under `artifacts/` are left alone so a phase can drop a
 * folder of evidence beside its report, but only top-level `.md` files are
 * artifact documents that must carry the metadata contract. A non-Markdown file
 * is evidence and is checked only for the reserved prefix.
 */
async function listMarkdown(
  bundleRoot: string,
  directory: string,
  errors: string[]
): Promise<string[]> {
  let entries;

  try {
    entries = await readdir(path.join(bundleRoot, directory), { withFileTypes: true });
  } catch {
    errors.push(`${directory}/: directory could not be read.`);
    return [];
  }

  const markdown: string[] = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (directory !== 'phases' && !entry.isFile() && reservedPhasePrefix.test(entry.name)) {
      errors.push(`${directory}/${entry.name}: the phase-XX- prefix belongs to phases/ alone.`);
      continue;
    }

    if (!entry.isFile()) continue;

    if (entry.name.endsWith('.md')) {
      markdown.push(entry.name);
      continue;
    }

    if (directory !== 'phases' && reservedPhasePrefix.test(entry.name)) {
      errors.push(`${directory}/${entry.name}: the phase-XX- prefix belongs to phases/ alone.`);
    }
  }

  return markdown;
}

async function readDocument(
  bundleRoot: string,
  relativePath: string,
  kind: PlanDocumentKind,
  number: number | null
): Promise<PlanDocument> {
  const source = await readFile(path.join(bundleRoot, relativePath), 'utf8');
  const match = source.match(frontMatterPattern);

  return {
    body: match ? source.slice(match[0].length) : source,
    frontMatter: match?.[1] ?? null,
    kind,
    number,
    relativePath,
    source,
  };
}

export function pad(value: number): string {
  return String(value).padStart(2, '0');
}
