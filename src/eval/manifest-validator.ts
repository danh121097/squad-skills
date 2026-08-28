import { readFile, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';

import { parseDocument } from 'yaml';

import { validateEvalBaseline } from './baseline-validator.ts';
import { validateEvalCases } from './case-validator.ts';
import { validateJudgingContract } from './judging-contract-validator.ts';
import { validateKnowledgeCards } from './knowledge-card-validator.ts';
import { validateWorkflowIsolation } from './workflow-isolation-check.ts';

export interface EvalValidationResult {
  directories: string[];
  errors: string[];
  notes: string[];
}

export interface ValidateEvalManifestsOptions {
  /** Defaults to `process.env.EVAL_PRIVATE_PATH`. Pass `null` to force it unset. */
  privatePath?: string | null;
}

/** Root holding one directory of fixtures per evaluated skill. */
export const evalsRoot = 'evals';

/**
 * Validates every evaluation contract under `evals/` with no network, no
 * credentials, and no model calls. Adding a contract for another skill means
 * adding `evals/<skill>/`; no code changes here.
 *
 * When `EVAL_PRIVATE_PATH` is set it also verifies that the held-out store sits
 * outside this repository and still matches what the manifests record.
 */
export async function validateEvalManifests(
  projectRoot: string,
  options: ValidateEvalManifestsOptions = {}
): Promise<EvalValidationResult> {
  const privatePath =
    options.privatePath === undefined
      ? (process.env.EVAL_PRIVATE_PATH ?? null)
      : options.privatePath;

  const errors: string[] = [];
  const notes: string[] = [];

  // Resolved before any manifest is read: a misplaced holdout is a setup fault
  // that must be reported even when a manifest fails to parse.
  const resolvedPrivatePath = await resolvePrivatePath(privatePath, projectRoot, errors, notes);
  const directories = await findEvalDirectories(projectRoot, notes);
  const privateStoreEnvVars = new Set<string>();

  for (const directory of directories) {
    await validateEvalDirectory({
      directory,
      errors,
      notes,
      privatePath: resolvedPrivatePath,
      privateStoreEnvVars,
      projectRoot,
    });
  }

  // Repository-level, and run even when a manifest failed to parse: the
  // contribution path is public, so "no CI job can reach the held-out set" has
  // to be asserted rather than assumed. An unreadable manifest leaves the set
  // empty, which still checks the trigger and secret rules.
  await validateWorkflowIsolation({ errors, notes, privateStoreEnvVars, projectRoot });

  return { directories, errors, notes };
}

/**
 * Reads registry ids out of the human-authored contract so the Markdown tables
 * stay the single authority for which invariants and rubrics exist.
 */
export function extractRegistryIds(source: string, prefix: 'INV' | 'RUB'): Set<string> {
  const pattern = new RegExp(`\`(${prefix}-[A-Z0-9]+-\\d+)\``, 'g');

  return new Set([...source.matchAll(pattern)].map((match) => match[1] as string));
}

async function validateEvalDirectory(options: {
  directory: string;
  errors: string[];
  notes: string[];
  privatePath: string | null;
  privateStoreEnvVars: Set<string>;
  projectRoot: string;
}): Promise<void> {
  const { directory, errors, notes, privatePath, privateStoreEnvVars, projectRoot } = options;
  const evalDirectory = path.join(evalsRoot, directory);

  const contract = await readText(
    projectRoot,
    path.join(evalDirectory, 'eval-contract.md'),
    errors
  );
  const baseline = await loadManifest(
    projectRoot,
    path.join(evalDirectory, 'baseline-manifest.yml'),
    errors
  );
  const cases = await loadManifest(
    projectRoot,
    path.join(evalDirectory, 'case-manifest.yml'),
    errors
  );

  const privateStoreEnvVar = readPrivateStoreEnvVar(baseline?.value);

  if (privateStoreEnvVar) privateStoreEnvVars.add(privateStoreEnvVar);

  if (baseline) {
    await validateEvalBaseline({
      errors,
      manifest: baseline.value,
      manifestPath: baseline.manifestPath,
      projectRoot,
    });
  }

  await validateKnowledgeCards({
    cardsDirectory: path.posix.join(evalsRoot, directory, 'knowledge'),
    errors,
    invariantIds: extractRegistryIds(contract ?? '', 'INV'),
    notes,
    projectRoot,
  });

  validateJudgingContract({
    baseline: baseline?.value ?? null,
    baselinePath: path.join(evalDirectory, 'baseline-manifest.yml'),
    cases: cases?.value ?? null,
    casesPath: path.join(evalDirectory, 'case-manifest.yml'),
    errors,
    notes,
  });

  if (cases) {
    await validateEvalCases({
      errors,
      expectedStoreCommit: readPrivateStoreCommit(baseline?.value),
      invariantIds: extractRegistryIds(contract ?? '', 'INV'),
      manifest: cases.value,
      manifestPath: cases.manifestPath,
      notes,
      privatePath,
      rubricIds: extractRegistryIds(contract ?? '', 'RUB'),
    });
  }
}

/**
 * A readable holdout is not a holdout. Symlinks are resolved and darwin/win32
 * paths are case-folded, because both otherwise let a store inside the working
 * tree pass as external.
 */
async function resolvePrivatePath(
  privatePath: string | null,
  projectRoot: string,
  errors: string[],
  notes: string[]
): Promise<string | null> {
  if (!privatePath || privatePath.trim().length === 0) {
    notes.push('private store: not checked (EVAL_PRIVATE_PATH is unset).');
    return null;
  }

  let resolvedStore: string;

  try {
    resolvedStore = await realpath(path.resolve(projectRoot, privatePath));
  } catch {
    errors.push(`EVAL_PRIVATE_PATH does not exist: "${privatePath}".`);
    return null;
  }

  let resolvedRoot: string;

  try {
    resolvedRoot = await realpath(projectRoot);
  } catch {
    resolvedRoot = path.resolve(projectRoot);
  }

  if (isInside(resolvedStore, resolvedRoot)) {
    errors.push(
      `EVAL_PRIVATE_PATH must resolve outside the repository; "${privatePath}" resolves to ${resolvedStore}.`
    );
    return null;
  }

  notes.push(`private store: checked against ${resolvedStore}.`);

  return resolvedStore;
}

function isInside(candidate: string, root: string): boolean {
  const relative = path.relative(fold(root), fold(candidate));

  if (path.isAbsolute(relative)) return false;
  if (relative === '..' || relative.startsWith(`..${path.sep}`)) return false;

  return true;
}

/** APFS and NTFS are case-insensitive by default, so a case variant is the same path. */
function fold(value: string): string {
  return process.platform === 'darwin' || process.platform === 'win32'
    ? value.toLowerCase()
    : value;
}

/** The variable a workflow would have to name to resolve the held-out store. */
function readPrivateStoreEnvVar(baseline: Record<string, unknown> | undefined): string | null {
  const store = baseline?.private_store;

  if (typeof store !== 'object' || store === null || Array.isArray(store)) return null;

  const envVar = (store as Record<string, unknown>).env_var;

  return typeof envVar === 'string' && envVar.trim().length > 0 ? envVar.trim() : null;
}

function readPrivateStoreCommit(baseline: Record<string, unknown> | undefined): string | null {
  const store = baseline?.private_store;

  if (typeof store !== 'object' || store === null || Array.isArray(store)) return null;

  const commit = (store as Record<string, unknown>).commit;

  return typeof commit === 'string' ? commit : null;
}

async function findEvalDirectories(projectRoot: string, notes: string[]): Promise<string[]> {
  let entries;

  try {
    entries = await readdir(path.join(projectRoot, evalsRoot), { withFileTypes: true });
  } catch {
    notes.push(`${evalsRoot}/: no evaluation contracts found.`);
    return [];
  }

  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (directories.length === 0) {
    notes.push(`${evalsRoot}/: no evaluation contracts found.`);
  }

  return directories;
}

async function readText(
  projectRoot: string,
  relativePath: string,
  errors: string[]
): Promise<string | null> {
  try {
    return await readFile(path.join(projectRoot, relativePath), 'utf8');
  } catch {
    errors.push(`${relativePath}: file is missing.`);
    return null;
  }
}

async function loadManifest(
  projectRoot: string,
  relativePath: string,
  errors: string[]
): Promise<{ manifestPath: string; value: Record<string, unknown> } | null> {
  const source = await readText(projectRoot, relativePath, errors);

  if (source === null) return null;

  const document = parseDocument(source);

  if (document.errors.length > 0) {
    for (const error of document.errors) {
      errors.push(`${relativePath}: invalid YAML: ${error.message.split('\n')[0]}`);
    }
    return null;
  }

  const value: unknown = document.toJS();

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    errors.push(`${relativePath}: manifest must be a YAML mapping.`);
    return null;
  }

  return { manifestPath: relativePath, value: value as Record<string, unknown> };
}
