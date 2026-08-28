import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseDocument } from 'yaml';

import {
  extractSection,
  findUnroutedReferences,
  hashContent,
  measureSkillPayload,
  type SkillPayloadMeasurement,
  type TaskTypeDefinition,
} from './skill-payload-measurement.ts';

export interface ValidateEvalBaselineOptions {
  errors: string[];
  manifest: Record<string, unknown>;
  manifestPath: string;
  projectRoot: string;
}

const boundaryHeading = '## Scope and boundary';
const commitPattern = /^[0-9a-f]{40}$/;
const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

/**
 * Recomputes every measured value in a baseline manifest from the working tree.
 * A recorded number that no longer reproduces means the baseline drifted
 * mid-cycle, which invalidates the comparison the whole cycle rests on.
 *
 * Which skills a cycle covers, and which one the budget governs, come from the
 * manifest rather than from code, so a contract for another skill needs no
 * change here.
 */
export async function validateEvalBaseline(options: ValidateEvalBaselineOptions): Promise<void> {
  const { errors, manifest, manifestPath, projectRoot } = options;

  if (manifest.schema_version !== 1) {
    errors.push(`${manifestPath}: schema_version must be 1.`);
  }

  validateRuntime(manifest.runtime, manifestPath, errors);
  validatePrivateStore(manifest.private_store, manifestPath, errors);

  const budget = asRecord(manifest.budget);
  const budgetSkill = typeof budget?.skill === 'string' ? budget.skill : null;

  if (!budget || !budgetSkill) {
    errors.push(`${manifestPath}: budget must be a mapping naming the skill it governs.`);
  }

  const taskTypes = readTaskTypes(manifest.task_types, manifestPath, errors);
  const skills = asRecord(manifest.skills);

  if (!skills || Object.keys(skills).length === 0) {
    errors.push(`${manifestPath}: skills must be a non-empty mapping.`);
    return;
  }

  if (budgetSkill && !(budgetSkill in skills)) {
    errors.push(`${manifestPath}: budget.skill "${budgetSkill}" is not recorded under skills.`);
  }

  let budgetMeasurement: SkillPayloadMeasurement | null = null;

  for (const [skillName, rawSkill] of Object.entries(skills)) {
    const recorded = asRecord(rawSkill);

    if (!recorded) {
      errors.push(`${manifestPath}: skills.${skillName} must be a mapping.`);
      continue;
    }

    const measurement = await validateSkillEntry({
      errors,
      manifestPath,
      projectRoot,
      recorded,
      skillName,
      taskTypes: skillName === budgetSkill ? taskTypes : [],
    });

    if (measurement && skillName === budgetSkill) budgetMeasurement = measurement;
  }

  if (budget && budgetMeasurement) {
    validateTaskLoads(budgetMeasurement, taskTypes, manifest, budget, manifestPath, errors);
    validateReferenceCap(budgetMeasurement, budget, manifestPath, errors);
    validateAgainstReference(budgetMeasurement, manifest, budgetSkill, manifestPath, errors);
  }
}

/**
 * Caps how large any single reference of the governing skill may grow.
 *
 * The median metric only guards the reference loaded by the median task type;
 * every reference routed above the median can grow without moving a measured
 * number, so a per-file cap is the only check those files have. It was prose in
 * the plan until an amendment pushed two references past it with a green gate,
 * which is why the limit now lives in the manifest and fails here.
 *
 * The field is required: an optional cap could be deleted to silence a breach.
 */
function validateReferenceCap(
  measurement: SkillPayloadMeasurement,
  budget: Record<string, unknown>,
  manifestPath: string,
  errors: string[]
): void {
  const cap = budget.max_reference_words;

  if (typeof cap !== 'number' || !Number.isInteger(cap) || cap <= 0) {
    errors.push(
      `${manifestPath}: budget.max_reference_words must be a positive integer capping any single reference.`
    );
    return;
  }

  for (const reference of measurement.references) {
    if (reference.words > cap) {
      errors.push(
        `${manifestPath}: budget.max_reference_words: ${reference.file} is ${reference.words} words, over the cap ${cap}. Split it, trim it, or raise the cap as a reviewed contract change.`
      );
    }
  }
}

/**
 * Enforces the previous cycle's figures as a ceiling on the governing budget.
 * `phase_1_reference` used to be read by no validator, so a regression against
 * it survived every gate; now the comparison the cycle owes is machine-checked.
 * The block is optional — a first cycle has no predecessor — but once present,
 * removing or raising it is a reviewed diff like any other contract change.
 */
function validateAgainstReference(
  measurement: SkillPayloadMeasurement,
  manifest: Record<string, unknown>,
  budgetSkill: string | null,
  manifestPath: string,
  errors: string[]
): void {
  if (!budgetSkill) return;

  const referenceBlock = asRecord(manifest.phase_1_reference);

  if (!referenceBlock) return;

  const reference = asRecord(referenceBlock[budgetSkill]);

  // A present block that omits the budget skill would disable the ceiling with
  // a green gate — a key rename must fail loudly, not skip the comparison.
  if (!reference) {
    errors.push(
      `${manifestPath}: phase_1_reference is present but has no entry for the budget skill "${budgetSkill}", so the comparison ceiling would silently not apply.`
    );
    return;
  }

  const caps: Array<[key: string, measured: number]> = [
    ['entrypoint_words', measurement.entrypointWords],
    ['median_loaded_words', measurement.medianLoadedWords],
  ];

  for (const [key, measured] of caps) {
    const cap = reference[key];

    if (typeof cap !== 'number') {
      errors.push(
        `${manifestPath}: phase_1_reference.${budgetSkill}.${key} must be a number to act as the comparison ceiling.`
      );
      continue;
    }

    if (measured > cap) {
      errors.push(
        `${manifestPath}: phase_1_reference.${budgetSkill}.${key}: measured ${measured} exceeds the reference ceiling ${cap}.`
      );
    }
  }
}

async function validateSkillEntry(options: {
  errors: string[];
  manifestPath: string;
  projectRoot: string;
  recorded: Record<string, unknown>;
  skillName: string;
  taskTypes: TaskTypeDefinition[];
}): Promise<SkillPayloadMeasurement | null> {
  const { errors, manifestPath, projectRoot, recorded, skillName, taskTypes } = options;
  const skillRoot = path.join(projectRoot, 'skills', skillName);
  const prefix = `${manifestPath}: skills.${skillName}`;

  let entrypointSource: string;

  try {
    entrypointSource = await readFile(path.join(skillRoot, 'SKILL.md'), 'utf8');
  } catch {
    errors.push(`${prefix}: skills/${skillName}/SKILL.md could not be read.`);
    return null;
  }

  let measurement: SkillPayloadMeasurement;

  try {
    measurement = await measureSkillPayload({ skillRoot, taskTypes });
  } catch (error) {
    // Surface the routing cause; blaming SKILL.md would send the next reader
    // looking in the wrong file.
    errors.push(`${prefix}: measurement failed: ${(error as Error).message}`);
    return null;
  }

  const boundary = extractSection(entrypointSource, boundaryHeading);

  if (boundary === null) {
    errors.push(`${prefix}: skills/${skillName}/SKILL.md has no "${boundaryHeading}" section.`);
  }

  const version = readSkillVersion(entrypointSource);

  if (version === null) {
    errors.push(`${prefix}: skills/${skillName}/SKILL.md declares no string metadata.version.`);
  }

  compare(errors, prefix, 'version', recorded.version, version);
  compare(errors, prefix, 'payload_hash', recorded.payload_hash, measurement.payloadHash);
  compare(
    errors,
    prefix,
    'boundary_hash',
    recorded.boundary_hash,
    boundary === null ? null : hashContent(boundary)
  );
  compare(
    errors,
    prefix,
    'entrypoint_words',
    recorded.entrypoint_words,
    measurement.entrypointWords
  );
  compare(errors, prefix, 'reference_count', recorded.reference_count, measurement.referenceCount);
  compare(errors, prefix, 'reference_words', recorded.reference_words, measurement.referenceWords);
  compare(
    errors,
    prefix,
    'total_payload_words',
    recorded.total_payload_words,
    measurement.totalPayloadWords
  );

  return measurement;
}

function validateTaskLoads(
  measurement: SkillPayloadMeasurement,
  taskTypes: TaskTypeDefinition[],
  manifest: Record<string, unknown>,
  budget: Record<string, unknown>,
  manifestPath: string,
  errors: string[]
): void {
  if (taskTypes.length === 0) return;

  const unrouted = findUnroutedReferences(measurement, taskTypes);

  if (unrouted.length > 0) {
    errors.push(`${manifestPath}: no task type routes to ${unrouted.join(', ')}.`);
  }

  // Match on id, never on position: readTaskTypes drops malformed entries.
  const recordedLoads = new Map(
    (Array.isArray(manifest.task_types) ? manifest.task_types : [])
      .map((entry) => asRecord(entry))
      .filter((entry): entry is Record<string, unknown> => entry !== null)
      .map((entry) => [entry.id, entry] as const)
  );

  for (const taskLoad of measurement.taskLoads) {
    const recorded = recordedLoads.get(taskLoad.id);

    compare(
      errors,
      `${manifestPath}: task_types.${taskLoad.id}`,
      'loaded_words',
      recorded?.loaded_words,
      taskLoad.loadedWords
    );
  }

  compare(
    errors,
    `${manifestPath}: budget`,
    'entrypoint_words',
    budget.entrypoint_words,
    measurement.entrypointWords
  );
  compare(
    errors,
    `${manifestPath}: budget`,
    'median_loaded_words',
    budget.median_loaded_words,
    measurement.medianLoadedWords
  );
}

function readTaskTypes(
  value: unknown,
  manifestPath: string,
  errors: string[]
): TaskTypeDefinition[] {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${manifestPath}: task_types must be a non-empty sequence.`);
    return [];
  }

  const taskTypes: TaskTypeDefinition[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    const record = asRecord(entry);
    const id = record?.id;
    const references = record?.references;

    if (typeof id !== 'string' || id.trim().length === 0) {
      errors.push(`${manifestPath}: every task_types entry needs a non-empty id.`);
      continue;
    }

    if (seen.has(id)) {
      errors.push(`${manifestPath}: duplicate task type id "${id}".`);
      continue;
    }

    if (!Array.isArray(references) || references.some((item) => typeof item !== 'string')) {
      errors.push(`${manifestPath}: task type "${id}" needs a sequence of reference file names.`);
      continue;
    }

    seen.add(id);
    taskTypes.push({ id, references: references as string[] });
  }

  return taskTypes;
}

function validateRuntime(value: unknown, manifestPath: string, errors: string[]): void {
  const runtime = asRecord(value);

  if (!runtime) {
    errors.push(`${manifestPath}: runtime must be a mapping.`);
    return;
  }

  for (const key of ['node', 'pnpm', 'gate_command', 'gate_status']) {
    if (typeof runtime[key] !== 'string' || (runtime[key] as string).trim().length === 0) {
      errors.push(`${manifestPath}: runtime.${key} must be a non-empty string.`);
    }
  }
}

function validatePrivateStore(value: unknown, manifestPath: string, errors: string[]): void {
  const store = asRecord(value);

  if (!store) {
    errors.push(`${manifestPath}: private_store must be a mapping.`);
    return;
  }

  if (store.env_var !== 'EVAL_PRIVATE_PATH') {
    errors.push(`${manifestPath}: private_store.env_var must be "EVAL_PRIVATE_PATH".`);
  }

  if (store.visibility !== 'private') {
    errors.push(`${manifestPath}: private_store.visibility must be "private".`);
  }

  if (typeof store.repository !== 'string' || store.repository.trim().length === 0) {
    errors.push(`${manifestPath}: private_store.repository must name the held-out repository.`);
  }

  if (typeof store.commit !== 'string' || !commitPattern.test(store.commit)) {
    errors.push(
      `${manifestPath}: private_store.commit must be a full 40-character commit hash so the set is provably frozen.`
    );
  }
}

/** Reads `metadata.version` from a skill's YAML frontmatter. */
function readSkillVersion(source: string): string | null {
  const frontmatter = source.match(frontmatterPattern)?.[1];

  if (!frontmatter) return null;

  const document = parseDocument(frontmatter);

  if (document.errors.length > 0) return null;

  const metadata = asRecord(asRecord(document.toJS())?.metadata);
  const version = metadata?.version;

  return typeof version === 'string' ? version : null;
}

function compare(
  errors: string[],
  prefix: string,
  key: string,
  recorded: unknown,
  measured: unknown
): void {
  // A null measurement means its own error was already reported.
  if (measured === null) return;

  if (recorded !== measured) {
    errors.push(`${prefix}.${key}: recorded ${format(recorded)} but measured ${format(measured)}.`);
  }
}

function format(value: unknown): string {
  return value === undefined ? 'nothing' : JSON.stringify(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
