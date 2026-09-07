/**
 * Version arithmetic for the publish preflight.
 *
 * It exists only to suggest the next versions when a publish is refused, and it
 * lives here rather than in the script so a test can reach it: the script runs
 * a registry query on import.
 *
 * Nothing here picks a version. A script cannot know whether a change is a
 * patch or a break, and one that guessed would eventually ship a major as a
 * minor, so the decision stays with the person editing `package.json`.
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
