/**
 * Version arithmetic for the release script.
 *
 * It lives here rather than inside `scripts/release.ts` because that script
 * starts a release the moment it is imported: a test reaching into it for this
 * function would publish. Keeping the arithmetic pure is the only thing that
 * makes the one decision nobody can take back — which version gets burned on
 * the registry — testable at all.
 */

export const releaseTypes = ['major', 'minor', 'patch'] as const;

export type ReleaseType = (typeof releaseTypes)[number];

/** `major.minor.patch` and nothing else; `nextVersion` says why. */
const releaseVersionPattern = /^(\d+)\.(\d+)\.(\d+)$/;

export function parseVersion(value: string): [number, number, number] {
  const match = releaseVersionPattern.exec(value.trim());

  if (match === null) throw new Error(`"${value}" is not a major.minor.patch version.`);

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Negative when `a` precedes `b`, positive when it follows, zero when equal. */
export function compareVersions(a: string, b: string): number {
  const [aMajor, aMinor, aPatch] = parseVersion(a);
  const [bMajor, bMinor, bPatch] = parseVersion(b);

  return aMajor - bMajor || aMinor - bMinor || aPatch - bPatch;
}

/**
 * Resolve a release request against the version currently in `package.json`.
 * Accepts a bump keyword or an explicit version, and refuses everything else
 * loudly — a wrong argument here is only cheap while it is still an argument.
 */
export function nextVersion(current: string, request: string): string {
  const [major, minor, patch] = parseVersion(current);

  if (request === 'major') return `${major + 1}.0.0`;
  if (request === 'minor') return `${major}.${minor + 1}.0`;
  if (request === 'patch') return `${major}.${minor}.${patch + 1}`;

  // A prerelease is refused rather than mishandled. Publishing one under the
  // default `latest` tag would hand a beta to everyone running a plain
  // `npm install`, and choosing a dist-tag is a decision this script does not
  // have enough context to make on the caller's behalf.
  if (request.includes('-')) {
    throw new Error(
      `Prerelease versions are not supported here, because "latest" is the wrong dist-tag for one. ` +
        `Publish it by hand with an explicit --tag.`
    );
  }

  let target: string;

  try {
    target = parseVersion(request).join('.');
  } catch {
    throw new Error(
      `"${request}" is neither ${releaseTypes.join(', ')} nor a major.minor.patch version.`
    );
  }

  // An explicit version may skip ahead but never backwards. npm rejects a
  // duplicate or older version too, but only after `prepublishOnly` has already
  // spent two minutes on the full gate; catching the typo here is the
  // difference between a corrected argument and a wasted build.
  if (compareVersions(target, current) <= 0) {
    throw new Error(`${target} does not follow the current version ${current}.`);
  }

  return target;
}
