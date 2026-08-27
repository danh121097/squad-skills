import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * A named task type and the reference paths a run of that task loads, relative
 * to the skill's `references/` directory. Routing is declared in a baseline
 * manifest and reviewed by a human, because progressive disclosure means the
 * loaded set — not the total payload — is the governing budget.
 */
export interface TaskTypeDefinition {
  id: string;
  references: string[];
}

export interface ReferenceMeasurement {
  file: string;
  words: number;
}

export interface TaskLoadMeasurement {
  id: string;
  loadedWords: number;
  references: string[];
}

export interface SkillPayloadMeasurement {
  entrypointWords: number;
  medianLoadedWords: number;
  payloadHash: string;
  referenceCount: number;
  references: ReferenceMeasurement[];
  referenceWords: number;
  taskLoads: TaskLoadMeasurement[];
  totalPayloadWords: number;
}

export interface MeasureSkillPayloadOptions {
  skillRoot: string;
  taskTypes?: TaskTypeDefinition[];
}

const entrypointName = 'SKILL.md';
const referencesDirectoryName = 'references';
// `wc -w` in the C locale splits on ASCII whitespace only. JavaScript's \s also
// matches U+00A0 and U+2028, which would silently break the by-hand check.
const asciiWhitespace = /[ \t\n\r\f\v]+/;

/** Counts whitespace-delimited words, matching `wc -w`. */
export function countWords(source: string): number {
  return normalize(source)
    .split(asciiWhitespace)
    .filter((word) => word.length > 0).length;
}

/** Returns a `sha256:<hex>` digest of line-ending-normalized text. */
export function hashContent(source: string): string {
  return `sha256:${createHash('sha256').update(normalize(source), 'utf8').digest('hex')}`;
}

/**
 * Extracts one Markdown section body by heading, exclusive of the heading line
 * and stopping at the next heading of the same or higher level. Fenced blocks
 * are skipped so a `# comment` inside code cannot truncate the section. Used to
 * capture role-boundary statements so later phases can detect drift.
 */
export function extractSection(source: string, heading: string): string | null {
  const lines = normalize(source).split('\n');
  const headingLevel = heading.match(/^#+/)?.[0].length ?? 0;

  if (headingLevel === 0) return null;

  const startIndex = lines.findIndex((line) => line.trim() === heading);

  if (startIndex === -1) return null;

  const body: string[] = [];
  let insideFence = false;

  for (const line of lines.slice(startIndex + 1)) {
    if (/^\s*(?:```|~~~)/.test(line)) insideFence = !insideFence;

    if (!insideFence) {
      const level = line.match(/^(#+)\s/)?.[1]?.length;

      if (level !== undefined && level <= headingLevel) break;
    }

    body.push(line);
  }

  return body.join('\n').trim();
}

/**
 * Measures a skill's entrypoint, its bundled references, and the words loaded
 * per declared task type. Deterministic: the same tree always yields the same
 * numbers and hash.
 *
 * The payload hash covers every bundled file, not only Markdown, because the
 * Skills CLI copies the whole skill directory during installation — a bundled
 * asset changes the shipped product even though it has no word count.
 */
export async function measureSkillPayload(
  options: MeasureSkillPayloadOptions
): Promise<SkillPayloadMeasurement> {
  const { skillRoot, taskTypes = [] } = options;
  const bundledFiles = await findFiles(skillRoot, skillRoot);

  if (!bundledFiles.includes(entrypointName)) {
    throw new Error(`Skill at "${skillRoot}" has no ${entrypointName}.`);
  }

  const references: ReferenceMeasurement[] = [];
  const wordsByReference = new Map<string, number>();
  const hashInput: string[] = [];
  let entrypointWords = 0;

  for (const file of bundledFiles) {
    const source = await readFile(path.join(skillRoot, file), 'utf8');

    hashInput.push(`${file} ${hashContent(source)}`);

    if (file === entrypointName) {
      entrypointWords = countWords(source);
      continue;
    }

    const referencePath = toReferencePath(file);

    if (referencePath === null) continue;

    const words = countWords(source);

    references.push({ file: referencePath, words });
    wordsByReference.set(referencePath, words);
  }

  const referenceWords = references.reduce((total, reference) => total + reference.words, 0);
  const taskLoads = taskTypes.map((taskType) =>
    measureTaskLoad(taskType, entrypointWords, wordsByReference)
  );

  return {
    entrypointWords,
    medianLoadedWords: median(taskLoads.map((taskLoad) => taskLoad.loadedWords)),
    payloadHash: hashContent(hashInput.join('\n')),
    referenceCount: references.length,
    references,
    referenceWords,
    taskLoads,
    totalPayloadWords: entrypointWords + referenceWords,
  };
}

/** Reference paths that no declared task type loads. */
export function findUnroutedReferences(
  measurement: SkillPayloadMeasurement,
  taskTypes: TaskTypeDefinition[]
): string[] {
  const routed = new Set(taskTypes.flatMap((taskType) => taskType.references));

  return measurement.references
    .map((reference) => reference.file)
    .filter((file) => !routed.has(file));
}

function measureTaskLoad(
  taskType: TaskTypeDefinition,
  entrypointWords: number,
  wordsByReference: Map<string, number>
): TaskLoadMeasurement {
  const references = [...taskType.references].sort();
  const seen = new Set<string>();
  let loadedWords = entrypointWords;

  for (const reference of references) {
    // A repeated reference would inflate the loaded count without loading twice.
    if (seen.has(reference)) {
      throw new Error(`Task type "${taskType.id}" lists reference "${reference}" twice.`);
    }

    const words = wordsByReference.get(reference);

    if (words === undefined) {
      throw new Error(`Task type "${taskType.id}" routes to unknown reference "${reference}".`);
    }

    seen.add(reference);
    loadedWords += words;
  }

  return { id: taskType.id, loadedWords, references };
}

/** Median with even-length inputs averaged and rounded half-up to stay integral. */
function median(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle] ?? 0;

  if (sorted.length % 2 === 1) return upper;

  const lower = sorted[middle - 1] ?? 0;

  return Math.round((lower + upper) / 2);
}

/** Markdown under `references/`, as a POSIX path relative to that directory. */
function toReferencePath(bundledFile: string): string | null {
  const prefix = `${referencesDirectoryName}/`;

  if (!bundledFile.startsWith(prefix) || !bundledFile.endsWith('.md')) return null;

  return bundledFile.slice(prefix.length);
}

/** Every file under the skill, as sorted POSIX paths relative to its root. */
async function findFiles(directory: string, skillRoot: string): Promise<string[]> {
  let entries;

  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findFiles(entryPath, skillRoot)));
    } else if (entry.isFile()) {
      files.push(path.relative(skillRoot, entryPath).split(path.sep).join('/'));
    }
  }

  return files.sort();
}

function normalize(source: string): string {
  return source.replace(/\r\n/g, '\n');
}
