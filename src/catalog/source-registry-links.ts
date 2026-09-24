import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

/**
 * Discovery and link extraction for skill source registries.
 *
 * Extracted from the liveness script so both halves can be tested. The bug this
 * replaces was a hard-coded list naming one skill while seven others shipped a
 * registry: those seven were cited to agents and checked by nothing, and no
 * test could have caught it while the list lived inside a top-level-await
 * script.
 */

/** Every skill's registry carries this name; nothing else in a skill is one. */
export const sourceRegistryFileName = 'official-sources.md';

const skillsDirectoryName = 'skills';
const referencesDirectoryName = 'references';

// Registries write a source either as a Markdown link or as a bare URL, and
// both forms appear across the catalog today. Matching the URL itself covers
// both: a link's URL stops at its closing parenthesis either way. Quotes and
// backticks are excluded so an entry written as inline code or a quoted string
// yields the URL rather than the URL plus its delimiter.
//
// `http` is matched as well as `https`. No registry uses it today, and one
// should not, but a scheme this pattern skips is a source cited to agents and
// checked by nothing — the exact silence this module exists to end.
const registryUrlPattern = /https?:\/\/[^\s<>)\]`"']+/g;

/** Sentence and emphasis punctuation that follows a URL is not part of it. */
const trailingPunctuation = /[.,;:*]+$/;

export interface SourceRegistryDiscovery {
  /** Registry paths relative to the project root, POSIX-separated and sorted. */
  registries: string[];
  /** Skill directories seen, so a caller can tell "none exist" from "none found". */
  skillCount: number;
}

/**
 * Every URL cited by one registry file, in the order it appears, without
 * repeats. A registry entry is a source this repository tells agents to use, so
 * every one of them is checked.
 */
export function extractRegistryUrls(source: string): string[] {
  const seen = new Set<string>();

  for (const match of source.matchAll(registryUrlPattern)) {
    seen.add(match[0].replace(trailingPunctuation, ''));
  }

  return [...seen];
}

/**
 * Finds every skill's source registry under the project root.
 *
 * Discovered rather than listed, so a registry a contributor adds is covered
 * the moment it exists rather than when someone remembers a second file.
 */
export async function findSourceRegistries(projectRoot: string): Promise<SourceRegistryDiscovery> {
  const skillsRoot = path.join(projectRoot, skillsDirectoryName);

  let entries;

  try {
    entries = await readdir(skillsRoot, { withFileTypes: true });
  } catch {
    return { registries: [], skillCount: 0 };
  }

  const skillDirectories = entries.filter((entry) => entry.isDirectory());
  const registries: string[] = [];

  for (const entry of skillDirectories) {
    const relativePath = path.posix.join(
      skillsDirectoryName,
      entry.name,
      referencesDirectoryName,
      sourceRegistryFileName
    );

    // `stat` states the intent — this is an existence probe, not a read — and a
    // permission error is not the same as an absent registry.
    try {
      const found = await stat(path.join(projectRoot, relativePath));

      if (found.isFile()) registries.push(relativePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }

  return { registries: registries.sort(), skillCount: skillDirectories.length };
}

/**
 * The message for a discovery that found no registry at all while skills exist,
 * or `undefined` when the discovery is usable.
 *
 * A predicate rather than an inline check in the script: the script is a
 * top-level-await file no test can import, so a fatal decision left inside it
 * has no signal. This is that decision, and it is the failure the check was
 * blind to for its whole life — every remaining card would report green while
 * nothing said the registries went unread.
 */
export function describeRegistryDiscoveryFailure(
  discovery: SourceRegistryDiscovery
): string | undefined {
  if (discovery.skillCount === 0 || discovery.registries.length > 0) return undefined;

  return (
    `No source registry found under skills/, though ${discovery.skillCount} skill(s) are present. ` +
    `Every skill's registry is expected at references/${sourceRegistryFileName}.`
  );
}
