/**
 * Version arithmetic for release selection and the publish preflight.
 *
 * Automatic release selection defaults to a patch bump because it is the
 * narrowest safe change. Callers can request a minor or major bump explicitly;
 * this module never infers a breaking change from the files being published.
 */

export const releaseTypes = ['major', 'minor', 'patch'] as const;

export type ReleaseType = (typeof releaseTypes)[number];

const releaseVersionPattern = /^(\d+)\.(\d+)\.(\d+)$/;

export function parseVersion(value: string): [number, number, number] {
  const match = releaseVersionPattern.exec(value.trim());

  if (match === null) throw new Error(`"${value}" is not a major.minor.patch version.`);

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** The version one `type` step above `current`. */
export function nextVersion(current: string, type: ReleaseType): string {
  const [major, minor, patch] = parseVersion(current);

  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;

  return `${major}.${minor}.${patch + 1}`;
}

/** Compare two numeric major.minor.patch versions. */
export function compareVersions(left: string, right: string): number {
  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);

  for (let index = 0; index < leftParts.length; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;
    if (leftPart !== rightPart) return leftPart > rightPart ? 1 : -1;
  }

  return 0;
}

/**
 * Select the next publishable version from the manifest and npm's latest.
 *
 * A manifest ahead of npm is preserved so a failed publish can be retried
 * without skipping another version. Otherwise the latest published version is
 * bumped by the requested release type. An unpublished package keeps its
 * manifest version for its first release.
 */
export function selectReleaseVersion(
  manifestVersion: string,
  latestPublishedVersion: string | undefined,
  type: ReleaseType = 'patch'
): string {
  parseVersion(manifestVersion);
  if (latestPublishedVersion === undefined) return manifestVersion;

  const relation = compareVersions(manifestVersion, latestPublishedVersion);
  if (relation > 0) return manifestVersion;

  return nextVersion(latestPublishedVersion, type);
}
