/**
 * The approved dependency set, declared by the repository rather than by a run.
 *
 * `INV-DEP-001` asks whether the emitted output reached for a package it was
 * not given. Answering that needs a set the output cannot write, and a run
 * directory is written entirely by the candidate — so its `package.json` and
 * any marker inside its own source are both the candidate speaking about
 * itself. The set therefore lives in the case manifest, which is reviewed in
 * the diff like every other part of the contract.
 *
 * A platform with no entry reads as unknown, never as empty: an empty set makes
 * every framework import look like a new dependency, which would blame the
 * output for a gap in this file.
 */
export function approvedDependenciesFor(
  manifest: Record<string, unknown>,
  targetPlatform: string
): string[] | null {
  const declared = asRecord(manifest.approved_dependencies);
  const entry = declared?.[targetPlatform];

  if (!Array.isArray(entry)) return null;

  return entry.map((value) => String(value));
}

/** Checks the registry covers every platform a case targets, and nothing else. */
export function validateApprovedDependencies(options: {
  errors: string[];
  manifest: Record<string, unknown>;
  manifestPath: string;
  platforms: ReadonlySet<string>;
  targeted: ReadonlySet<string>;
}): void {
  const { errors, manifest, manifestPath, platforms, targeted } = options;
  const declared = asRecord(manifest.approved_dependencies);

  if (declared === null) {
    errors.push(
      `${manifestPath}: approved_dependencies is missing, so no case can be checked against a dependency set the run cannot write.`
    );

    return;
  }

  for (const [platform, value] of Object.entries(declared)) {
    if (!platforms.has(platform)) {
      errors.push(`${manifestPath}: approved_dependencies names unknown platform "${platform}".`);
      continue;
    }

    if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
      errors.push(
        `${manifestPath}: approved_dependencies for "${platform}" must be a list of package names.`
      );
    }
  }

  for (const platform of [...targeted].sort()) {
    if (!(platform in declared)) {
      errors.push(
        `${manifestPath}: a case targets "${platform}" but approved_dependencies declares no set for it.`
      );
    }
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
