import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

/**
 * Where a candidate run may write. Generated runs are ignored by git and live
 * outside `skills/`, because a run that can write into the shipped catalog can
 * make its own gates pass by editing the product it is measuring.
 */
export const runsRootName = '.eval-runs';

/** Paths a run may never write into, relative to the repository root. */
const protectedRoots = ['skills', 'evals', 'src', 'scripts', 'tests', '.github'];

export interface ResolveRunDirectoryOptions {
  caseId: string;
  cycleId: string;
  projectRoot: string;
  /** Overrides `<projectRoot>/.eval-runs`; must still sit outside protected roots. */
  runsRoot?: string;
}

export class RunDirectoryError extends Error {}

/**
 * Resolves and creates the isolated directory for one case run.
 *
 * Identity is `<runsRoot>/<cycleId>/<caseId>`: stable, so a rerun of the same
 * case overwrites its own artifacts rather than accumulating, and reproducible,
 * so the report can name a path a reader can open.
 */
export async function createRunDirectory(options: ResolveRunDirectoryOptions): Promise<string> {
  const runDirectory = resolveRunDirectory(options);

  await rm(runDirectory, { force: true, recursive: true });
  await mkdir(runDirectory, { recursive: true });

  return runDirectory;
}

/**
 * The same guarded path, without creating or clearing anything.
 *
 * Grading *reads* a run directory that already holds candidate output, so it
 * must not go through `createRunDirectory` — that clears the directory, which
 * would delete the artifact about to be measured. Both entry points share every
 * check, so the guards cannot hold on one path and be skipped on the other.
 */
export function resolveRunDirectory(options: ResolveRunDirectoryOptions): string {
  const { caseId, cycleId, projectRoot } = options;

  assertSegment('cycleId', cycleId);
  assertSegment('caseId', caseId);

  const runsRoot = path.resolve(projectRoot, options.runsRoot ?? runsRootName);

  assertWritable(runsRoot, projectRoot);

  return path.join(runsRoot, cycleId, caseId);
}

/**
 * Rejects a candidate write that leaves its run directory.
 *
 * The check is on the resolved path, not on the string: `../../skills/x` and an
 * absolute path both normalize into the same escape.
 *
 * It is lexical, so it does not follow symlinks — a link *inside* the run
 * directory still resolves through this check. Anything that reads a run
 * directory has to compare real paths itself, which is what
 * `static-file-server.ts` does before serving a built file.
 */
export function assertInsideRunDirectory(runDirectory: string, candidatePath: string): string {
  const resolvedRun = path.resolve(runDirectory);
  const resolved = path.resolve(resolvedRun, candidatePath);
  const relative = path.relative(resolvedRun, resolved);

  if (relative.length === 0 || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new RunDirectoryError(
      `Candidate output "${candidatePath}" resolves outside its run directory ${resolvedRun}; runs may not write to the repository.`
    );
  }

  return resolved;
}

/** A run root inside a shipped or tooling directory is refused before anything is created. */
export function assertWritable(runsRoot: string, projectRoot: string): void {
  const resolvedProject = path.resolve(projectRoot);
  const fromProject = path.relative(resolvedProject, runsRoot);

  // Outside the project entirely is not "safe by default": the guarded list
  // below only describes this repository, so an absolute root elsewhere would
  // clear every check and still be `rm -rf`'d by `createRunDirectory`.
  if (fromProject.startsWith('..') || path.isAbsolute(fromProject)) {
    throw new RunDirectoryError(
      `Run root ${runsRoot} is outside the project; runs are written under the repository so they stay ignored and reviewable.`
    );
  }

  for (const protectedRoot of protectedRoots) {
    const guarded = path.join(resolvedProject, protectedRoot);
    const relative = path.relative(guarded, runsRoot);

    if (relative.length === 0 || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
      throw new RunDirectoryError(
        `Run root ${runsRoot} is inside ${protectedRoot}/; a run may not write into the repository's own files.`
      );
    }
  }
}

/** Path segments come from manifests, so a traversing id must fail loudly, not join silently. */
function assertSegment(field: string, value: string): void {
  if (!/^[a-z0-9]+(?:[-.][a-z0-9]+)*$/.test(value)) {
    throw new RunDirectoryError(
      `${field} "${value}" is not a safe path segment; use lowercase kebab-case.`
    );
  }
}
