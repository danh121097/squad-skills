/**
 * Select and optionally write the next package version before publishing.
 *
 * The registry is consulted before any manifest is changed. A failed registry
 * request is fatal except for npm's E404 response, which means the package has
 * no published version yet and the manifest version should be kept.
 *
 * Usage:
 *   node scripts/bump-release-version.ts
 *   node scripts/bump-release-version.ts --release-type minor
 *   node scripts/bump-release-version.ts --dry-run
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import {
  parseVersion,
  releaseTypes,
  selectReleaseVersion,
  type ReleaseType,
} from '../src/release/next-version.ts';

type Manifest = {
  name: string;
  version: string;
};

export type BumpOptions = {
  manifestPath: string;
  pluginPaths: string[];
  releaseType: ReleaseType;
  dryRun: boolean;
};

export type BumpResult = {
  name: string;
  currentVersion: string;
  latestPublishedVersion?: string;
  nextVersion: string;
  changed: boolean;
};

export const pluginManifestPaths = [
  resolve('.claude-plugin/plugin.json'),
  resolve('.codex-plugin/plugin.json'),
];

function parseReleaseType(value: string | undefined): ReleaseType {
  const candidate = value ?? process.env.RELEASE_TYPE ?? 'patch';
  if ((releaseTypes as readonly string[]).includes(candidate)) return candidate as ReleaseType;
  throw new Error(`Unknown release type "${candidate}". Use major, minor, or patch.`);
}

function parseArgs(argv: string[]): BumpOptions {
  let releaseType: string | undefined;
  let dryRun = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (argument === '--release-type') {
      releaseType = argv[index + 1];
      if (!releaseType || releaseType.startsWith('--')) {
        throw new Error('Missing value for --release-type.');
      }
      index += 1;
      continue;
    }
    throw new Error(`Unexpected argument: ${argument ?? ''}`);
  }

  return {
    manifestPath: resolve('package.json'),
    pluginPaths: pluginManifestPaths,
    releaseType: parseReleaseType(releaseType),
    dryRun,
  };
}

function readManifest(path: string): Manifest {
  const value: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!value || typeof value !== 'object') throw new Error(`${path} is not a JSON object.`);

  const manifest = value as Partial<Manifest>;
  if (typeof manifest.name !== 'string' || typeof manifest.version !== 'string') {
    throw new Error(`${path} must contain string name and version fields.`);
  }
  parseVersion(manifest.version);
  return { name: manifest.name, version: manifest.version };
}

function latestPublishedVersion(name: string): string | undefined {
  try {
    const output = execFileSync('npm', ['view', name, 'version', '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();

    if (!output) return undefined;
    const parsed: unknown = JSON.parse(output);
    if (typeof parsed !== 'string')
      throw new Error(`npm returned a non-string latest version for ${name}.`);
    parseVersion(parsed);
    return parsed;
  } catch (error) {
    const stderr =
      error !== null && typeof error === 'object' && 'stderr' in error ? String(error.stderr) : '';
    if (stderr.includes('E404')) return undefined;
    throw new Error(`Could not ask npm for the latest version of ${name}.`);
  }
}

export function replaceManifestVersion(source: string, version: string): string {
  const updated = source.replace(/("version"\s*:\s*")[^"]+("\s*[,}])/, `$1${version}$2`);
  if (updated === source) throw new Error('Could not find a top-level version field to update.');
  return updated;
}

function updatedManifest(path: string, version: string): { original: string; updated: string } {
  const source = readFileSync(path, 'utf8');
  const updated = replaceManifestVersion(source, version);
  JSON.parse(updated);
  return { original: source, updated };
}

export function writeManifestPair(
  packagePath: string,
  packageSource: { original: string; updated: string },
  pluginPath: string,
  pluginSource: { original: string; updated: string }
): void {
  writeManifestSet([
    { path: packagePath, ...packageSource },
    { path: pluginPath, ...pluginSource },
  ]);
}

export function writeManifestSet(
  manifests: Array<{ path: string; original: string; updated: string }>
): void {
  try {
    for (const manifest of manifests) writeFileSync(manifest.path, manifest.updated, 'utf8');
  } catch (error) {
    try {
      for (const manifest of manifests) {
        writeFileSync(manifest.path, manifest.original, 'utf8');
      }
    } catch (rollbackError) {
      throw new Error(
        'Version update failed and automatic rollback also failed; inspect every manifest before retrying.',
        { cause: rollbackError }
      );
    }
    throw error;
  }
}

export function bumpReleaseVersion(options: BumpOptions): BumpResult {
  const packageManifest = readManifest(options.manifestPath);
  const latest = latestPublishedVersion(packageManifest.name);
  const selected = selectReleaseVersion(packageManifest.version, latest, options.releaseType);
  const result: BumpResult = {
    name: packageManifest.name,
    currentVersion: packageManifest.version,
    ...(latest ? { latestPublishedVersion: latest } : {}),
    nextVersion: selected,
    changed: selected !== packageManifest.version,
  };

  if (options.dryRun || !result.changed) return result;

  // Validate every file before writing any of them, so a malformed plugin
  // manifest cannot leave package.json half-bumped.
  const packageSource = updatedManifest(options.manifestPath, selected);
  const pluginSources = options.pluginPaths.map((path) => ({
    path,
    ...updatedManifest(path, selected),
  }));
  writeManifestSet([{ path: options.manifestPath, ...packageSource }, ...pluginSources]);
  return result;
}

function printResult(result: BumpResult, dryRun: boolean): void {
  const latest = result.latestPublishedVersion ?? 'none (first publish)';
  if (!result.changed) {
    const reason = result.latestPublishedVersion
      ? 'ahead of npm'
      : 'has no published npm version yet';
    console.log(
      `${result.name}@${result.currentVersion} is ${reason}; keeping the manifest version.`
    );
    return;
  }

  const verb = dryRun ? 'would update' : 'updated';
  console.log(
    `${verb} ${result.name}: ${result.currentVersion} -> ${result.nextVersion} (npm latest: ${latest}).`
  );
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const result = bumpReleaseVersion(options);
  printResult(result, options.dryRun);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  await main();
}
