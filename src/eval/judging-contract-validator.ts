import { providerFamily } from './pairwise-judge.ts';

/**
 * Validates the pinned judging contract offline.
 *
 * Two of these checks are the reason the file exists. A judge in the same
 * provider family as the subject is measuring its own family's artifact, and a
 * case that pins a different model than the manifest quietly runs a second,
 * unrecorded configuration — both produce a number that looks like the cycle's
 * and is not.
 *
 * The block is required whenever a lane declares paid judging, and optional
 * otherwise, so a cycle that only runs deterministic gates owes nothing here.
 */
export interface ValidateJudgingOptions {
  baseline: Record<string, unknown> | null;
  baselinePath: string;
  cases: Record<string, unknown> | null;
  casesPath: string;
  errors: string[];
  notes: string[];
}

const agreementRange = { max: 1, min: 0 };

export function validateJudgingContract(options: ValidateJudgingOptions): void {
  const { baseline, baselinePath, cases, casesPath, errors, notes } = options;
  const paidLanes = readPaidLanes(cases);
  const judging = asRecord(baseline?.judging);

  if (!judging) {
    if (paidLanes.length > 0) {
      errors.push(
        `${baselinePath}: lanes ${paidLanes.join(', ')} declare paid judging, so a pinned judging block is required.`
      );
    } else {
      notes.push(`${baselinePath}: no judging block; this cycle runs deterministic gates only.`);
    }

    return;
  }

  const subject = validateRole(judging.subject, 'subject', baselinePath, errors);
  const judge = validateRole(judging.judge, 'judge', baselinePath, errors);

  if (subject && judge && providerFamily(subject.provider) === providerFamily(judge.provider)) {
    errors.push(
      `${baselinePath}: judging.judge provider "${judge.provider}" is the same family as judging.subject "${subject.provider}"; the judge must be cross-provider relative to the subject that produced the judged artifact.`
    );
  }

  if (judging.subject_sanity_subset === undefined) {
    // Pinned by the cycle contract. Deleting it would quietly narrow what the
    // cycle claims to have checked.
    errors.push(
      `${baselinePath}: judging.subject_sanity_subset is required; it records the tier check the cycle pins.`
    );
  }

  validateSanitySubset(
    judging.subject_sanity_subset,
    judge?.provider ?? null,
    baselinePath,
    errors
  );
  validateDisclosures(judging, baselinePath, errors);
  validateBudget(judging.budget, baselinePath, errors);
  validateThresholds(judging.thresholds, baselinePath, errors);
  validatePaidLanes(judging.paid_lanes, paidLanes, baselinePath, errors);
  validatePromotionLane(judging.promotion_lane, paidLanes, baselinePath, errors);
  validateLengthControl({
    baselinePath,
    cases,
    casesPath,
    errors,
    paidLanes,
    value: judging.length_control,
  });

  if (subject && judge) {
    validateCaseConfigs({ casesPath, cases, errors, judge, subject });
  }

  notes.push(
    `${baselinePath}: judging pinned to subject ${subject?.model ?? 'unknown'} and judge ${judge?.model ?? 'unknown'}.`
  );
}

interface RolePin {
  model: string;
  provider: string;
}

function validateRole(
  value: unknown,
  role: string,
  baselinePath: string,
  errors: string[]
): RolePin | null {
  const record = asRecord(value);

  if (
    !record ||
    typeof record.provider !== 'string' ||
    typeof record.model !== 'string' ||
    record.provider.trim().length === 0 ||
    record.model.trim().length === 0
  ) {
    errors.push(`${baselinePath}: judging.${role} needs a pinned provider and model.`);
    return null;
  }

  return { model: record.model, provider: record.provider };
}

/**
 * The sanity subset catches a skill that only works on a top tier. It is graded
 * by deterministic gates alone when its provider shares the judge's family,
 * because judging it there would reintroduce exactly the self-preference the
 * cross-provider rule removes.
 */
function validateSanitySubset(
  value: unknown,
  judgeProvider: string | null,
  baselinePath: string,
  errors: string[]
): void {
  const record = asRecord(value);

  if (!record) return;

  const provider = typeof record.provider === 'string' ? record.provider : null;

  if (!provider || typeof record.model !== 'string' || !Number.isInteger(record.cases)) {
    errors.push(
      `${baselinePath}: judging.subject_sanity_subset needs a provider, model, and an integer case count.`
    );
    return;
  }

  if (record.judged !== false && record.judged !== true) {
    errors.push(
      `${baselinePath}: judging.subject_sanity_subset.judged must state explicitly whether the subset is judged.`
    );
    return;
  }

  if (
    record.judged === true &&
    judgeProvider &&
    providerFamily(provider) === providerFamily(judgeProvider)
  ) {
    errors.push(
      `${baselinePath}: judging.subject_sanity_subset shares the judge's provider family, so it may not be judged; deterministic gates carry it.`
    );
  }
}

function validateDisclosures(
  judging: Record<string, unknown>,
  baselinePath: string,
  errors: string[]
): void {
  // Both are disclosures rather than gates, and both have to be stated: an
  // unrecorded authoring assistant and an unstated absence of temperature
  // control are the two caveats a reader would otherwise have to assume away.
  for (const field of ['authoring_assistance', 'temperature_control']) {
    if (typeof judging[field] !== 'string' || (judging[field] as string).trim().length === 0) {
      errors.push(`${baselinePath}: judging.${field} must be disclosed as a string.`);
    }
  }
}

function validateBudget(value: unknown, baselinePath: string, errors: string[]): void {
  const record = asRecord(value);

  if (!record) {
    errors.push(`${baselinePath}: judging.budget must be a mapping with a hard stop.`);
    return;
  }

  if (typeof record.hard_stop_usd !== 'number' || record.hard_stop_usd <= 0) {
    errors.push(`${baselinePath}: judging.budget.hard_stop_usd must be a positive number.`);
  }

  if (typeof record.estimated_usd_per_cycle !== 'string') {
    errors.push(`${baselinePath}: judging.budget.estimated_usd_per_cycle must be recorded.`);
  }
}

/**
 * Thresholds are pre-registered, and `registered` is the switch that says
 * whether the numbers below it came from a scored calibration or from a guess.
 * Cycle one ships `false`, and the promotion gate refuses to report a verdict
 * until a calibration flips it.
 */
function validateThresholds(value: unknown, baselinePath: string, errors: string[]): void {
  const record = asRecord(value);

  if (!record) {
    errors.push(`${baselinePath}: judging.thresholds must be a mapping.`);
    return;
  }

  if (typeof record.registered !== 'boolean') {
    errors.push(`${baselinePath}: judging.thresholds.registered must be a boolean.`);
  }

  if (typeof record.equivalence_boundary !== 'number' || record.equivalence_boundary < 0) {
    errors.push(
      `${baselinePath}: judging.thresholds.equivalence_boundary must be a non-negative number.`
    );
  }

  if (
    !Number.isInteger(record.minimum_calibration_pairs) ||
    (record.minimum_calibration_pairs as number) < 1
  ) {
    errors.push(
      `${baselinePath}: judging.thresholds.minimum_calibration_pairs must be an integer of at least 1; one agreeing pair is not a measurement.`
    );
  }

  const agreement = record.minimum_judge_human_agreement;

  if (
    typeof agreement !== 'number' ||
    agreement <= agreementRange.min ||
    agreement > agreementRange.max
  ) {
    errors.push(
      `${baselinePath}: judging.thresholds.minimum_judge_human_agreement must be a fraction above 0 and at most 1.`
    );
  }

  if (!Number.isInteger(record.bootstrap_seed)) {
    errors.push(
      `${baselinePath}: judging.thresholds.bootstrap_seed must be an integer so an interval can be recomputed.`
    );
  }
}

/** Promotion reads one lane's evidence, and it has to be a paid, judged one. */
function validatePromotionLane(
  value: unknown,
  paidLanes: readonly string[],
  baselinePath: string,
  errors: string[]
): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(
      `${baselinePath}: judging.promotion_lane must name the lane a promotion is decided on.`
    );
    return;
  }

  if (!paidLanes.includes(value)) {
    errors.push(
      `${baselinePath}: judging.promotion_lane "${value}" is not one of the paid lanes ${paidLanes.join(', ')}.`
    );
  }
}

/**
 * The verbosity control, one case id per paid lane.
 *
 * Named rather than invented: the control is the same task reworded longer, so
 * it borrows a real case's platform and rubrics. A control that pointed at a
 * case from another lane would measure a comparison the run never made.
 */
function validateLengthControl(options: {
  baselinePath: string;
  cases: Record<string, unknown> | null;
  casesPath: string;
  errors: string[];
  paidLanes: readonly string[];
  value: unknown;
}): void {
  const { baselinePath, cases, casesPath, errors, paidLanes, value } = options;
  const record = asRecord(value);

  if (!record) {
    errors.push(
      `${baselinePath}: judging.length_control must name one case per paid lane; without it the verbosity bias is never measured and promotion can never pass.`
    );
    return;
  }

  const entries = Array.isArray(cases?.cases) ? (cases.cases as unknown[]) : [];
  const lanes = new Map<string, string>();

  for (const entry of entries) {
    const caseRecord = asRecord(entry);

    if (caseRecord && typeof caseRecord.id === 'string' && typeof caseRecord.lane === 'string') {
      lanes.set(caseRecord.id, caseRecord.lane);
    }
  }

  for (const lane of paidLanes) {
    const declared = record[lane];

    if (typeof declared !== 'string' || declared.trim().length === 0) {
      errors.push(`${baselinePath}: judging.length_control names no case for the "${lane}" lane.`);
      continue;
    }

    const caseLane = lanes.get(declared);

    if (caseLane === undefined) {
      errors.push(
        `${baselinePath}: judging.length_control.${lane} names "${declared}", which ${casesPath} does not declare.`
      );
      continue;
    }

    if (caseLane !== lane) {
      errors.push(
        `${baselinePath}: judging.length_control.${lane} names "${declared}", which belongs to the "${caseLane}" lane.`
      );
    }
  }
}

/** The paid set is declared twice; a mismatch means one of them is stale. */
function validatePaidLanes(
  value: unknown,
  paidLanes: readonly string[],
  baselinePath: string,
  errors: string[]
): void {
  const declared = Array.isArray(value) ? value.filter((entry) => typeof entry === 'string') : null;

  if (!declared) {
    errors.push(`${baselinePath}: judging.paid_lanes must list the lanes paid judging may run on.`);
    return;
  }

  const left = [...declared].sort().join(',');
  const right = [...paidLanes].sort().join(',');

  if (left !== right) {
    errors.push(
      `${baselinePath}: judging.paid_lanes [${left}] does not match the lanes declaring paid_judging [${right}].`
    );
  }
}

/** A case pinning a different model runs a configuration the cycle never recorded. */
function validateCaseConfigs(options: {
  cases: Record<string, unknown> | null;
  casesPath: string;
  errors: string[];
  judge: RolePin;
  subject: RolePin;
}): void {
  const { cases, casesPath, errors, judge, subject } = options;
  const entries = Array.isArray(cases?.cases) ? cases.cases : [];

  for (const entry of entries) {
    const record = asRecord(entry);
    const config = asRecord(record?.config);

    if (!record || !config) continue;

    for (const [role, pinned] of [
      ['subject', subject],
      ['judge', judge],
    ] as const) {
      const declared = asRecord(config[role]);

      if (!declared) continue;

      if (declared.provider !== pinned.provider || declared.model !== pinned.model) {
        errors.push(
          `${casesPath}: case "${String(record.id)}" pins ${role} ${String(declared.provider)}/${String(declared.model)}, which is not the cycle's ${pinned.provider}/${pinned.model}.`
        );
      }
    }
  }
}

function readPaidLanes(cases: Record<string, unknown> | null): string[] {
  const lanes = asRecord(cases?.lanes);

  if (!lanes) return [];

  return Object.entries(lanes)
    .filter(([, definition]) => asRecord(definition)?.paid_judging === true)
    .map(([name]) => name)
    .sort();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
