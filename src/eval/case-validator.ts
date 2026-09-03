import { readFile, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';

import { readGitHeadCommit } from './git-head-reader.ts';
import { isInside } from './path-containment.ts';
import { hashContent } from './skill-payload-measurement.ts';

export interface ValidateEvalCasesOptions {
  errors: string[];
  /** Commit the baseline manifest pins the held-out store to, when recorded. */
  expectedStoreCommit: string | null;
  invariantIds: Set<string>;
  manifest: Record<string, unknown>;
  manifestPath: string;
  notes: string[];
  /** Absolute path to the held-out store, or null when it is unset or rejected. */
  privatePath: string | null;
  rubricIds: Set<string>;
}

interface LaneDefinition {
  frozen: boolean;
  paidJudging: boolean;
  source: string | null;
  visibility: 'private' | 'public';
}

interface PrivateCase {
  id: string;
  lane: LaneDefinition;
  recordedHash: string;
}

/**
 * The only keys a held-out case may expose publicly. An allowlist, not a
 * denylist: an unknown key is exactly how a held-out body leaks.
 */
const privateAllowedFields = new Set(['id', 'lane', 'content_hash']);
const publicRequiredFields = [
  'category',
  'target_platform',
  'output_type',
  'request',
  'evidence_packet',
  'allowed_capabilities',
  'hard_invariants',
  'qualitative_rubric',
  'expected_source_decisions',
  'seed',
  'config',
];
const contentHashPattern = /^sha256:[0-9a-f]{64}$/;
const identifierPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const severities = new Set(['critical', 'high', 'medium']);
const targetPlatforms = new Set([
  'web',
  'adaptive',
  'react-native',
  'flutter',
  'swiftui',
  'compose',
]);

/**
 * Validates case identity, lane membership, and the public/private boundary.
 * Every case belongs to exactly one lane, and a private case may expose nothing
 * beyond its id and content hash.
 */
export async function validateEvalCases(options: ValidateEvalCasesOptions): Promise<void> {
  const { errors, manifest, manifestPath, notes, privatePath } = options;

  if (manifest.schema_version !== 1) {
    errors.push(`${manifestPath}: schema_version must be 1.`);
  }

  const lanes = readLanes(manifest.lanes, manifestPath, errors);
  const categories = readCategories(manifest.categories, manifestPath, errors);
  const cases = Array.isArray(manifest.cases) ? manifest.cases : null;

  if (!cases || cases.length === 0) {
    errors.push(`${manifestPath}: cases must be a non-empty sequence.`);
    return;
  }

  const seenIds = new Set<string>();
  const privateCases: PrivateCase[] = [];

  for (const entry of cases) {
    const record = asRecord(entry);
    const id = record?.id;

    if (!record || typeof id !== 'string' || !identifierPattern.test(id)) {
      errors.push(`${manifestPath}: every case needs a lowercase kebab-case id.`);
      continue;
    }

    // One id, one lane: a case appearing twice destroys the split.
    if (seenIds.has(id)) {
      errors.push(
        `${manifestPath}: duplicate case id "${id}"; a case belongs to exactly one lane.`
      );
      continue;
    }

    seenIds.add(id);

    const laneName = record.lane;
    const lane = typeof laneName === 'string' ? lanes.get(laneName) : undefined;

    if (!lane) {
      errors.push(`${manifestPath}: case "${id}" declares undeclared lane ${format(laneName)}.`);
      continue;
    }

    if (lane.visibility === 'public') {
      validatePublicCase({ ...options, categories, id, record });
      continue;
    }

    const recordedHash = validatePrivateCase({ errors, id, manifestPath, record });

    if (recordedHash) privateCases.push({ id, lane, recordedHash });
  }

  if (!privatePath) {
    notes.push(`${manifestPath}: ${privateCases.length} private case hashes were not verified.`);
    return;
  }

  await verifyPrivateStore({ ...options, lanes, privateCases, privatePath });
}

function validatePublicCase(options: {
  categories: Set<string>;
  errors: string[];
  id: string;
  invariantIds: Set<string>;
  manifestPath: string;
  record: Record<string, unknown>;
  rubricIds: Set<string>;
}): void {
  const { categories, errors, id, invariantIds, manifestPath, record, rubricIds } = options;
  const prefix = `${manifestPath}: case "${id}"`;

  if ('content_hash' in record) {
    errors.push(`${prefix} is public and must carry its body, not a content_hash.`);
  }

  for (const field of publicRequiredFields) {
    if (isEmpty(record[field])) errors.push(`${prefix} is missing a usable ${field}.`);
  }

  if (typeof record.category === 'string' && !categories.has(record.category)) {
    errors.push(`${prefix} uses unregistered category "${record.category}".`);
  }

  if (typeof record.target_platform === 'string' && !targetPlatforms.has(record.target_platform)) {
    errors.push(`${prefix} uses unsupported target_platform "${record.target_platform}".`);
  }

  if (record.output_type !== undefined && record.output_type !== 'presentational-code') {
    errors.push(`${prefix} must declare output_type "presentational-code" for this cycle.`);
  }

  if (!Number.isInteger(record.seed)) {
    errors.push(`${prefix} needs an integer seed.`);
  }

  validateConfig(record.config, prefix, errors);
  validateInvariants(record.hard_invariants, prefix, invariantIds, errors);
  validateRubric(record.qualitative_rubric, prefix, rubricIds, errors);
}

function validatePrivateCase(options: {
  errors: string[];
  id: string;
  manifestPath: string;
  record: Record<string, unknown>;
}): string | null {
  const { errors, id, manifestPath, record } = options;
  const prefix = `${manifestPath}: case "${id}"`;
  const leaked = Object.keys(record).filter((field) => !privateAllowedFields.has(field));

  if (leaked.length > 0) {
    errors.push(
      `${prefix} is held out and may only carry id, lane, and content_hash; found ${leaked.sort().join(', ')}.`
    );
  }

  const contentHash = record.content_hash;

  if (typeof contentHash !== 'string' || !contentHashPattern.test(contentHash)) {
    errors.push(`${prefix} needs a sha256 content_hash so the held-out set is provably frozen.`);
    return null;
  }

  return contentHash;
}

/**
 * Verifies the held-out store in both directions. Manifest-to-store proves no
 * registered case changed; store-to-manifest proves the set did not silently
 * grow, which a one-way check would miss entirely.
 */
async function verifyPrivateStore(options: {
  errors: string[];
  expectedStoreCommit: string | null;
  lanes: Map<string, LaneDefinition>;
  manifestPath: string;
  notes: string[];
  privateCases: PrivateCase[];
  privatePath: string;
}): Promise<void> {
  const { errors, expectedStoreCommit, lanes, manifestPath, notes, privateCases, privatePath } =
    options;

  let verified = 0;

  for (const { id, lane, recordedHash } of privateCases) {
    const source = await readPrivateCase({ errors, id, lane, manifestPath, privatePath });

    if (source === null) continue;

    const measured = hashContent(source);

    if (measured === recordedHash) {
      verified += 1;
      continue;
    }

    errors.push(
      `${manifestPath}: case "${id}" changed in the held-out store; recorded ${recordedHash} but measured ${measured}.`
    );
  }

  await detectStoreGrowth({ errors, lanes, manifestPath, privateCases, privatePath });
  await verifyStoreCommit({ errors, expectedStoreCommit, manifestPath, notes, privatePath });

  notes.push(
    `${manifestPath}: verified ${verified} of ${privateCases.length} held-out case hashes.`
  );
}

async function readPrivateCase(options: {
  errors: string[];
  id: string;
  lane: LaneDefinition;
  manifestPath: string;
  privatePath: string;
}): Promise<string | null> {
  const { errors, id, lane, manifestPath, privatePath } = options;
  const source = await resolveLaneSource(lane, privatePath);

  if (source === null) {
    errors.push(
      `${manifestPath}: case "${id}" is held out but its lane declares no usable source path.`
    );
    return null;
  }

  let file: string;

  try {
    file = await realpath(path.join(source, `${id}.yml`));
  } catch {
    errors.push(`${manifestPath}: case "${id}" is missing from the held-out store.`);
    return null;
  }

  // Resolving the lane leaves the file inside it unresolved, and a symlinked
  // case body reads from wherever it points. The runner already checks this at
  // its own read; the validator has to agree with it.
  if (!isInside(file, await realpath(privatePath))) {
    errors.push(`${manifestPath}: case "${id}" resolves outside the held-out store.`);
    return null;
  }

  try {
    return await readFile(file, 'utf8');
  } catch {
    errors.push(`${manifestPath}: case "${id}" is missing from the held-out store.`);
    return null;
  }
}

/** A case file in the store that no public registration covers means the holdout grew. */
async function detectStoreGrowth(options: {
  errors: string[];
  lanes: Map<string, LaneDefinition>;
  manifestPath: string;
  privateCases: PrivateCase[];
  privatePath: string;
}): Promise<void> {
  const { errors, lanes, manifestPath, privateCases, privatePath } = options;
  const registered = new Set(privateCases.map(({ id }) => id));

  for (const [name, lane] of lanes) {
    const source = await resolveLaneSource(lane, privatePath);

    if (lane.visibility !== 'private' || source === null) continue;

    let entries;

    try {
      entries = await readdir(source, { withFileTypes: true });
    } catch {
      errors.push(`${manifestPath}: lane "${name}" has no directory in the held-out store.`);
      continue;
    }

    const unregistered = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.yml'))
      .map((entry) => entry.name.replace(/\.yml$/, ''))
      .filter((id) => !registered.has(id))
      .sort();

    if (unregistered.length > 0) {
      errors.push(
        `${manifestPath}: lane "${name}" grew in the held-out store; ${unregistered.length} case file(s) are not registered here.`
      );
    }
  }
}

/** "Provably frozen" means the store is actually parked on the pinned commit. */
async function verifyStoreCommit(options: {
  errors: string[];
  expectedStoreCommit: string | null;
  manifestPath: string;
  notes: string[];
  privatePath: string;
}): Promise<void> {
  const { errors, expectedStoreCommit, manifestPath, notes, privatePath } = options;

  if (!expectedStoreCommit) return;

  const head = await readGitHeadCommit(privatePath);

  if (head === null) {
    notes.push(`${manifestPath}: held-out store commit not verified (no readable git metadata).`);
    return;
  }

  if (head !== expectedStoreCommit) {
    errors.push(
      `${manifestPath}: held-out store is at ${head} but the baseline pins ${expectedStoreCommit}; the cycle is no longer frozen.`
    );
  }
}

/**
 * Rejects absolute, traversing, and symlinked-out lane sources so a manifest
 * cannot read outside the store.
 *
 * The spelling is checked first, then the resolved path. Checking only the
 * spelling accepts a source that is a symlink to somewhere else entirely, which
 * is the same escape written one level down.
 */
async function resolveLaneSource(
  lane: LaneDefinition,
  privatePath: string
): Promise<string | null> {
  if (!lane.source) return null;

  const resolved = path.resolve(privatePath, lane.source);
  const relative = path.relative(privatePath, resolved);

  if (relative.length === 0 || relative.startsWith('..') || path.isAbsolute(relative)) return null;

  try {
    return isInside(await realpath(resolved), await realpath(privatePath)) ? resolved : null;
  } catch {
    // Nothing there to resolve. The callers already report the absence in the
    // terms their own check is about, so this stays silent.
    return null;
  }
}

function readLanes(
  value: unknown,
  manifestPath: string,
  errors: string[]
): Map<string, LaneDefinition> {
  const lanes = new Map<string, LaneDefinition>();
  const record = asRecord(value);

  if (!record || Object.keys(record).length === 0) {
    errors.push(`${manifestPath}: lanes must be a non-empty mapping.`);
    return lanes;
  }

  for (const [name, rawLane] of Object.entries(record)) {
    const lane = asRecord(rawLane);
    const visibility = lane?.visibility;

    if (visibility !== 'public' && visibility !== 'private') {
      errors.push(`${manifestPath}: lane "${name}" needs visibility "public" or "private".`);
      continue;
    }

    if (typeof lane?.paid_judging !== 'boolean' || typeof lane.frozen !== 'boolean') {
      errors.push(`${manifestPath}: lane "${name}" needs boolean paid_judging and frozen.`);
      continue;
    }

    const source = lane.source;

    if (visibility === 'private' && (typeof source !== 'string' || source.length === 0)) {
      errors.push(`${manifestPath}: private lane "${name}" needs a source path inside the store.`);
      continue;
    }

    lanes.set(name, {
      frozen: lane.frozen,
      paidJudging: lane.paid_judging,
      source: typeof source === 'string' ? source : null,
      visibility,
    });
  }

  return lanes;
}

function readCategories(value: unknown, manifestPath: string, errors: string[]): Set<string> {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${manifestPath}: categories must be a non-empty sequence.`);
    return new Set();
  }

  const categories = new Set<string>();

  for (const category of value) {
    if (typeof category !== 'string' || !identifierPattern.test(category)) {
      errors.push(`${manifestPath}: category ${format(category)} must be lowercase kebab-case.`);
      continue;
    }

    if (categories.has(category)) {
      errors.push(`${manifestPath}: duplicate category "${category}".`);
      continue;
    }

    categories.add(category);
  }

  return categories;
}

function validateConfig(value: unknown, prefix: string, errors: string[]): void {
  const config = asRecord(value);

  if (!config) {
    if (value !== undefined) errors.push(`${prefix} needs config to be a mapping.`);
    return;
  }

  for (const role of ['subject', 'judge']) {
    const entry = asRecord(config[role]);

    if (!entry || typeof entry.provider !== 'string' || typeof entry.model !== 'string') {
      errors.push(`${prefix} needs config.${role} with a pinned provider and model.`);
    }
  }
}

function validateInvariants(
  value: unknown,
  prefix: string,
  invariantIds: Set<string>,
  errors: string[]
): void {
  if (!Array.isArray(value) || value.length === 0) {
    if (value !== undefined) errors.push(`${prefix} needs at least one hard invariant.`);
    return;
  }

  for (const entry of value) {
    const invariant = asRecord(entry);
    const id = invariant?.id;
    const severity = invariant?.severity;

    if (typeof id !== 'string' || !invariantIds.has(id)) {
      errors.push(
        `${prefix} references invariant ${format(id)} that the contract does not define.`
      );
      continue;
    }

    if (typeof severity !== 'string' || !severities.has(severity)) {
      errors.push(`${prefix} gives invariant "${id}" an unsupported severity ${format(severity)}.`);
    }
  }
}

function validateRubric(
  value: unknown,
  prefix: string,
  rubricIds: Set<string>,
  errors: string[]
): void {
  if (!Array.isArray(value) || value.length === 0) {
    if (value !== undefined) errors.push(`${prefix} needs at least one rubric id.`);
    return;
  }

  const seen = new Set<string>();

  for (const id of value) {
    if (typeof id !== 'string' || !rubricIds.has(id)) {
      errors.push(`${prefix} references rubric ${format(id)} that the contract does not define.`);
      continue;
    }

    if (seen.has(id)) errors.push(`${prefix} repeats rubric "${id}".`);

    seen.add(id);
  }
}

/** Presence is not enough: a null or blank required field would reach a paid run. */
function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;

  return false;
}

function format(value: unknown): string {
  return value === undefined ? 'nothing' : JSON.stringify(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
