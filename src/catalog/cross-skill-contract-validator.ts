import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { boundaryClauses, retiredPhrases } from './cross-skill-contract-clauses.ts';

/**
 * One sentence that must read the same way in every file that describes the
 * shared designer/build-role handoff. A handoff contract has two ends, so a
 * clause is declared once and required verbatim on both of them; editing one
 * side alone is the drift this validator exists to catch.
 */
export interface BoundaryClause {
  files: string[];
  id: string;
  statement: string;
}

/** Wording the current contract retired. Its survival means a stale file. */
export interface RetiredPhrase {
  files: string[];
  id: string;
  phrase: string;
}

export interface CrossSkillContractResult {
  checkedFiles: string[];
  errors: string[];
}

export interface ValidateCrossSkillContractOptions {
  /** Defaults to the shipped contract; tests substitute fixtures. */
  clauses?: BoundaryClause[];
  retiredPhrases?: RetiredPhrase[];
}

/**
 * Flattens Markdown prose to comparable text: line wrapping, emphasis markers,
 * and code spans are presentation, so a clause stays satisfied when a file
 * rewraps or bolds part of it, and fails only when the wording itself changes.
 *
 * Two limits bind whoever writes the next clause. Emphasis stripping is
 * character-level, so `snake_case` flattens to `snakecase` and link syntax
 * survives — keep clause text free of underscores and links. Matching is plain
 * substring, so a clause is satisfied by any occurrence, including one inside a
 * negation or a quoted changelog entry; state clauses as the live rule.
 */
export function normalizeProse(source: string): string {
  return source
    .replace(/\r\n/g, '\n')
    .replace(/[*_`]/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Fails when the shared role boundary is stated in one skill but not its
 * counterpart. Deterministic and offline: it reads the working tree only, so it
 * runs inside `pnpm validate` alongside the catalog contract.
 */
export async function validateCrossSkillContract(
  projectRoot: string,
  options: ValidateCrossSkillContractOptions = {}
): Promise<CrossSkillContractResult> {
  const clauses = options.clauses ?? boundaryClauses;
  const phrases = options.retiredPhrases ?? retiredPhrases;
  const errors: string[] = [];
  const sources = new Map<string, string | null>();

  const checkedFiles = [
    ...new Set([...clauses.flatMap((clause) => clause.files), ...phrases.flatMap((p) => p.files)]),
  ].sort();

  for (const file of checkedFiles) {
    sources.set(file, await readProse(projectRoot, file));
  }

  for (const clause of clauses) {
    validateClause(clause, sources, errors);
  }

  for (const phrase of phrases) {
    validateRetiredPhrase(phrase, sources, errors);
  }

  return { checkedFiles, errors };
}

function validateClause(
  clause: BoundaryClause,
  sources: Map<string, string | null>,
  errors: string[]
): void {
  if (clause.files.length < 2) {
    errors.push(`${clause.id}: a boundary clause must bind at least two files.`);
    return;
  }

  const needle = normalizeProse(clause.statement);
  const carrying: string[] = [];
  const missing: string[] = [];

  for (const file of clause.files) {
    const source = sources.get(file);

    if (source === null || source === undefined) {
      errors.push(`${clause.id}: ${file} could not be read.`);
      continue;
    }

    if (source.includes(needle)) carrying.push(file);
    else missing.push(file);
  }

  if (missing.length === 0) return;

  // Name both ends: the file that lost the clause is only half the fix, because
  // the reviewer has to decide which side is now correct.
  const held = carrying.length > 0 ? carrying.join(', ') : 'no other bound file';

  errors.push(
    `${clause.id}: "${clause.statement}" is missing from ${missing.join(', ')} but stated in ${held}. Update every bound file together.`
  );
}

function validateRetiredPhrase(
  phrase: RetiredPhrase,
  sources: Map<string, string | null>,
  errors: string[]
): void {
  const needle = normalizeProse(phrase.phrase);

  for (const file of phrase.files) {
    const source = sources.get(file);

    if (source === null || source === undefined) {
      errors.push(`${phrase.id}: ${file} could not be read.`);
      continue;
    }

    if (source.includes(needle)) {
      errors.push(
        `${phrase.id}: ${file} still says "${phrase.phrase}", which the current role boundary retired.`
      );
    }
  }
}

async function readProse(projectRoot: string, file: string): Promise<string | null> {
  try {
    return normalizeProse(await readFile(path.join(projectRoot, file), 'utf8'));
  } catch {
    return null;
  }
}
