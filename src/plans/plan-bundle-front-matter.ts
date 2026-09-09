import { parseDocument } from 'yaml';

import type { PlanDocument } from './plan-bundle-layout.ts';
import { pad } from './plan-bundle-layout.ts';

export const planStatuses = ['proposed', 'accepted', 'superseded'] as const;
export const phaseStatuses = [
  'proposed',
  'in-progress',
  'blocked',
  'accepted',
  'superseded',
] as const;
export const artifactStatuses = ['draft', 'final', 'superseded'] as const;
export const adrStatuses = ['proposed', 'accepted', 'rejected', 'superseded'] as const;
export const gateNames = ['qa', 'code-review'] as const;

/** Each gate closes on its own vocabulary, and neither may borrow the other's. */
export const gateVerdicts: Readonly<Record<GateName, readonly string[]>> = {
  'code-review': ['APPROVE', 'CHANGES_REQUESTED', 'NEEDS_EVIDENCE'],
  qa: ['PASS', 'FAIL', 'NEEDS_ENVIRONMENT'],
};

export type GateName = (typeof gateNames)[number];

/** One `{ path, revision }` pair a gate artifact recorded when it graded. */
export interface ReviewedInput {
  path: string;
  revision: number;
}

export interface PlanDocumentMetadata {
  /** ADR ordinal, from an `adr/` document only. */
  adrNumber: number | null;
  /** Phase-declared approvals, keyed by id, empty when none are declared. */
  approvals: { id: string; status: string }[];
  depends: number[];
  gate: GateName | null;
  /** Relative paths a phase declares as the inputs it must link. */
  inputs: string[];
  /** The phase a document belongs to; null for a plan-wide artifact or index. */
  owningPhase: number | null;
  phaseNumber: number | null;
  reviewed: ReviewedInput[];
  revision: number | null;
  status: string | null;
  verdict: string | null;
}

export interface PlanFrontMatterResult {
  errors: string[];
  metadata: Map<string, PlanDocumentMetadata>;
}

/**
 * Validates the frontmatter every bundle document carries, by kind.
 *
 * The metadata is what makes the rest of the contract checkable without opening
 * prose: phase order and dependencies, who owns an artifact and at which
 * revision, and what a gate recorded about the evidence it graded. A field
 * missing here does not merely lose a label — it removes the only thing a later
 * check could compare, which is how a stale verdict stays readable as a current
 * one.
 */
export function validatePlanFrontMatter(documents: PlanDocument[]): PlanFrontMatterResult {
  const errors: string[] = [];
  const metadata = new Map<string, PlanDocumentMetadata>();

  for (const document of documents) {
    const values = parseFrontMatter(document, errors);

    if (!values) continue;

    metadata.set(document.relativePath, readMetadata(document, values, errors));
  }

  return { errors, metadata };
}

function parseFrontMatter(
  document: PlanDocument,
  errors: string[]
): Record<string, unknown> | null {
  if (document.frontMatter === null) {
    errors.push(`${document.relativePath}: missing YAML frontmatter.`);
    return null;
  }

  const parsed = parseDocument(document.frontMatter);

  if (parsed.errors.length > 0) {
    for (const error of parsed.errors) {
      errors.push(`${document.relativePath}: invalid YAML: ${error.message.split('\n')[0]}`);
    }

    return null;
  }

  const value: unknown = parsed.toJS();

  if (!isRecord(value)) {
    errors.push(`${document.relativePath}: frontmatter must be a YAML mapping.`);
    return null;
  }

  return value;
}

function readMetadata(
  document: PlanDocument,
  values: Record<string, unknown>,
  errors: string[]
): PlanDocumentMetadata {
  const at = document.relativePath;
  const metadata: PlanDocumentMetadata = {
    adrNumber: null,
    approvals: [],
    depends: [],
    gate: null,
    inputs: [],
    owningPhase: null,
    phaseNumber: null,
    reviewed: [],
    revision: null,
    status: null,
    verdict: null,
  };

  switch (document.kind) {
    case 'index': {
      requireText(values, 'title', at, errors);
      requireText(values, 'description', at, errors);
      requireDate(values, 'created', at, errors);
      metadata.status = requireEnum(values, 'status', planStatuses, at, errors);
      metadata.revision = requireRevision(values, at, errors);
      break;
    }
    case 'phase': {
      requireText(values, 'title', at, errors);
      metadata.status = requireEnum(values, 'status', phaseStatuses, at, errors);
      metadata.revision = requireRevision(values, at, errors);
      metadata.phaseNumber = readPhaseNumber(document, values, errors);
      metadata.owningPhase = metadata.phaseNumber;
      metadata.depends = readDependencies(values, at, errors);
      metadata.inputs = readStringList(values, 'inputs', at, errors);
      metadata.approvals = readApprovals(values, at, errors);

      if (!Array.isArray(values.roles) || values.roles.length === 0) {
        errors.push(`${at}: "roles" must be a non-empty list, such as [squad-backend].`);
      }

      break;
    }
    case 'artifact': {
      requireText(values, 'owner', at, errors);
      metadata.status = requireEnum(values, 'status', artifactStatuses, at, errors);
      metadata.revision = requireRevision(values, at, errors);
      metadata.owningPhase = readArtifactPhase(values, at, errors);
      readGate(values, at, metadata, errors);
      break;
    }
    case 'adr': {
      requireText(values, 'title', at, errors);
      requireDate(values, 'date', at, errors);
      metadata.status = requireEnum(values, 'status', adrStatuses, at, errors);
      metadata.adrNumber = readAdrNumber(document, values, errors);
      break;
    }
    case 'reference': {
      requireText(values, 'title', at, errors);
      break;
    }
  }

  return metadata;
}

/**
 * A gate artifact records which gate it is, the verdict in that gate's own
 * vocabulary, and the exact revision of every input it graded. The last part is
 * what lets a later run tell a verdict that still stands from one whose evidence
 * moved underneath it.
 */
function readGate(
  values: Record<string, unknown>,
  at: string,
  metadata: PlanDocumentMetadata,
  errors: string[]
): void {
  if (values.gate === undefined && values.verdict === undefined && values.reviewed === undefined) {
    return;
  }

  const gate = requireEnum(values, 'gate', gateNames, at, errors);

  if (gate === null) return;

  metadata.gate = gate as GateName;

  const allowed = gateVerdicts[metadata.gate];
  const verdict = values.verdict;

  if (typeof verdict !== 'string' || !allowed.includes(verdict)) {
    errors.push(`${at}: "verdict" must be one of ${allowed.join(', ')} for the ${gate} gate.`);
  } else {
    metadata.verdict = verdict;
  }

  metadata.reviewed = readReviewed(values, at, errors);
}

function readReviewed(
  values: Record<string, unknown>,
  at: string,
  errors: string[]
): ReviewedInput[] {
  const raw = values.reviewed;

  if (!Array.isArray(raw) || raw.length === 0) {
    errors.push(
      `${at}: a gate artifact lists every input it graded under "reviewed" as { path, revision }.`
    );

    return [];
  }

  const reviewed: ReviewedInput[] = [];

  for (const entry of raw) {
    if (!isRecord(entry) || typeof entry.path !== 'string' || !isRevision(entry.revision)) {
      errors.push(`${at}: each "reviewed" entry needs a relative path and the revision graded.`);
      continue;
    }

    reviewed.push({ path: entry.path, revision: entry.revision });
  }

  return reviewed;
}

function readPhaseNumber(
  document: PlanDocument,
  values: Record<string, unknown>,
  errors: string[]
): number | null {
  const declared = values.phase;

  if (!isRevision(declared)) {
    errors.push(`${document.relativePath}: "phase" must be the phase's number.`);
    return null;
  }

  if (document.number !== null && declared !== document.number) {
    errors.push(
      `${document.relativePath}: frontmatter says phase ${declared} and the filename says ${pad(document.number)}.`
    );
  }

  return declared;
}

/**
 * An artifact names the phase that owns it, or `plan` when it belongs to the
 * bundle as a whole. Ownership lives here rather than in the filename because a
 * filename that carried it would read as an ordering entry.
 */
function readArtifactPhase(
  values: Record<string, unknown>,
  at: string,
  errors: string[]
): number | null {
  const declared = values.phase;

  if (declared === 'plan') return null;

  if (!isRevision(declared)) {
    errors.push(
      `${at}: "phase" must be the owning phase's number, or "plan" for a plan-wide artifact.`
    );
    return null;
  }

  return declared;
}

function readAdrNumber(
  document: PlanDocument,
  values: Record<string, unknown>,
  errors: string[]
): number | null {
  const declared = values.adr;

  if (!isRevision(declared)) {
    errors.push(`${document.relativePath}: "adr" must be the ADR's number.`);
    return null;
  }

  if (document.number !== null && declared !== document.number) {
    errors.push(
      `${document.relativePath}: frontmatter says ADR ${declared} and the filename says ${document.number}.`
    );
  }

  return declared;
}

function readDependencies(values: Record<string, unknown>, at: string, errors: string[]): number[] {
  const raw = values.depends_on;

  if (raw === undefined) {
    errors.push(`${at}: "depends_on" must be a list of phase numbers, empty when there are none.`);
    return [];
  }

  if (!Array.isArray(raw)) {
    errors.push(`${at}: "depends_on" must be a list of phase numbers.`);
    return [];
  }

  const dependencies: number[] = [];

  for (const entry of raw) {
    if (!isRevision(entry)) {
      errors.push(
        `${at}: "depends_on" holds phase numbers, and ${JSON.stringify(entry)} is not one.`
      );
      continue;
    }

    dependencies.push(entry);
  }

  return dependencies;
}

function readApprovals(
  values: Record<string, unknown>,
  at: string,
  errors: string[]
): { id: string; status: string }[] {
  const raw = values.approvals;

  if (raw === undefined) return [];

  if (!Array.isArray(raw)) {
    errors.push(`${at}: "approvals" must be a list of { id, status } entries.`);
    return [];
  }

  const approvals: { id: string; status: string }[] = [];

  for (const entry of raw) {
    if (
      !isRecord(entry) ||
      typeof entry.id !== 'string' ||
      (entry.status !== 'pending' && entry.status !== 'granted')
    ) {
      errors.push(`${at}: each approval needs an id and a status of pending or granted.`);
      continue;
    }

    approvals.push({ id: entry.id, status: entry.status });
  }

  return approvals;
}

function readStringList(
  values: Record<string, unknown>,
  key: string,
  at: string,
  errors: string[]
): string[] {
  const raw = values[key];

  if (raw === undefined) return [];

  if (!Array.isArray(raw) || raw.some((entry) => typeof entry !== 'string')) {
    errors.push(`${at}: "${key}" must be a list of bundle-relative paths.`);
    return [];
  }

  return raw as string[];
}

function requireText(
  values: Record<string, unknown>,
  key: string,
  at: string,
  errors: string[]
): void {
  const value = values[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${at}: missing non-empty "${key}".`);
  }
}

function requireDate(
  values: Record<string, unknown>,
  key: string,
  at: string,
  errors: string[]
): void {
  const value = values[key];
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : value;

  if (typeof text !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    errors.push(`${at}: "${key}" must be a YYYY-MM-DD date.`);
  }
}

function requireEnum(
  values: Record<string, unknown>,
  key: string,
  allowed: readonly string[],
  at: string,
  errors: string[]
): string | null {
  const value = values[key];

  if (typeof value !== 'string' || !allowed.includes(value)) {
    errors.push(`${at}: "${key}" must be one of ${allowed.join(', ')}.`);
    return null;
  }

  return value;
}

/**
 * A revision is what every staleness check compares, so it is a counter the
 * author increments rather than a timestamp: two edits in one minute are two
 * revisions, and a file copied forward keeps the number it was graded at.
 */
function requireRevision(
  values: Record<string, unknown>,
  at: string,
  errors: string[]
): number | null {
  const value = values.revision;

  if (!isRevision(value)) {
    errors.push(`${at}: "revision" must be a whole number of 1 or more.`);
    return null;
  }

  return value;
}

function isRevision(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
