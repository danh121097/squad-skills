import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { boundaryClauses } from './cross-skill-contract-clauses.ts';

/**
 * One sentence that must read the same way in every file that states it.
 *
 * The name is narrower than what it now carries. Alongside the designer and
 * build-role artifact boundary it began as, a clause here binds the
 * squad-pipeline handoffs — what shape crosses a stage
 * boundary, who owns a mandatory gate when its peer skill is absent, which
 * verdict closes a stage, what a role does when a named peer is missing — and
 * the pre-flight line every role with a quality bar states.
 *
 * What all of them share is that a clause is declared once and then required
 * verbatim in every file the clause lists, so editing one of those files alone
 * is the drift this validator exists to catch. How many files a clause reaches
 * is the clause's own business: two for most stage boundaries, eight for the
 * solo-fallback sentence.
 */
export interface BoundaryClause {
  files: string[];
  id: string;
  statement: string;
}

export interface CrossSkillContractResult {
  checkedFiles: string[];
  errors: string[];
}

export interface ValidateCrossSkillContractOptions {
  /** Defaults to the shipped contract; tests substitute fixtures. */
  clauses?: BoundaryClause[];
}

/**
 * Flattens Markdown prose to comparable text: line wrapping, emphasis markers,
 * and code spans are presentation, so a clause stays satisfied when a file
 * rewraps or bolds part of it, and fails only when the wording itself changes.
 *
 * Three narrowings, each carried from a review that caught this matcher
 * reaching the wrong verdict on a real file:
 *
 * - Fenced blocks and HTML comments are removed first. A boundary clause is a
 *   claim the skill makes to its reader; one that survives only inside a code
 *   sample or a comment is not stated, and would otherwise satisfy the check.
 * - Markdown links collapse to their label, so a clause whose subject is linked
 *   still matches the clause text. Before this, `[squad-frontend](...)` kept its
 *   target and silently failed a correctly stated boundary.
 * - Emphasis stripping stays character-level, so `snake_case` flattens to
 *   `snakecase`. Keep clause text free of underscores.
 */
/**
 * Fences are matched by their own run length, so a four-backtick block that
 * contains a three-backtick one closes where it actually closes. The previous
 * pattern paired the first three backticks it saw with the next three, which
 * swallowed the prose between two adjacent blocks — enough to delete a boundary
 * clause from a file that states it correctly.
 */
const fencedBlock = /^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\2[^\n]*$/gm;

export function normalizeProse(source: string): string {
  return source
    .replace(/\r\n/g, '\n')
    .replace(fencedBlock, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
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
  const errors: string[] = [];
  const sources = new Map<string, string | null>();

  const checkedFiles = [...new Set(clauses.flatMap((clause) => clause.files))].sort();

  for (const file of checkedFiles) {
    sources.set(file, await readSource(projectRoot, file));
  }

  for (const clause of clauses) {
    validateClause(clause, sources, errors);
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

    if (normalizeProse(source).includes(needle)) carrying.push(file);
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

async function readSource(projectRoot: string, file: string): Promise<string | null> {
  try {
    return await readFile(path.join(projectRoot, file), 'utf8');
  } catch {
    return null;
  }
}
