import type { EvalRunReport } from './eval-run-report.ts';
import type { JudgingEvidenceIdentity } from './judging-report.ts';
import type { PairwiseOutcome } from './pairwise-judge.ts';

export interface PromotionEvidenceBinding {
  currentCandidateArtifacts: Array<{
    artifactHash: string | null;
    caseId: string;
    runDirectory: string;
  }>;
  currentCaseManifestHash: string;
  currentPayloadHash: string;
  deterministicReport: EvalRunReport;
  judgedSkill: string;
  judging: JudgingEvidenceIdentity | null;
  requiredCaseIds: readonly string[];
  skill: string;
}

/** Refuses internally valid reports that describe different candidate artifacts. */
export function evidenceBindingRefusals(options: {
  cycleId: string;
  evidence: PromotionEvidenceBinding;
  outcomes: readonly PairwiseOutcome[];
  promotionLane: string;
}): string[] {
  const { evidence, outcomes, promotionLane } = options;
  const report = evidence.deterministicReport;
  const refusals: string[] = [];
  const expected = new Set(evidence.requiredCaseIds);

  if (expected.size === 0) {
    refusals.push(`The promotion lane "${promotionLane}" declares no required cases.`);
  }

  if (expected.size !== evidence.requiredCaseIds.length) {
    refusals.push('The promotion lane declares duplicate required case ids.');
  }

  if (report.environment.cycleId !== options.cycleId) {
    refusals.push(
      `The deterministic evidence belongs to cycle "${report.environment.cycleId}", not "${options.cycleId}".`
    );
  }

  if (report.environment.caseManifestHash !== evidence.currentCaseManifestHash) {
    refusals.push('The deterministic evidence does not match the current case manifest.');
  }

  if (report.environment.payloadHash !== evidence.currentPayloadHash) {
    refusals.push('The deterministic evidence does not match the current candidate payload.');
  }

  if (evidence.judgedSkill !== evidence.skill) {
    refusals.push(
      `The judging report names skill "${evidence.judgedSkill}", not "${evidence.skill}".`
    );
  }

  const rowCounts = new Map<string, number>();
  const deterministicCandidates = new Map<
    string,
    { artifactHash: string | null | undefined; runDirectory: string }
  >();

  for (const row of report.cases) {
    if (row.lane !== promotionLane) {
      refusals.push(
        `Deterministic case "${row.caseId}" comes from lane "${row.lane}", not "${promotionLane}".`
      );
    }

    if (!expected.has(row.caseId)) {
      refusals.push(`Deterministic evidence contains unexpected case "${row.caseId}".`);
    }

    if (row.arm !== 'baseline' && row.arm !== 'candidate') {
      refusals.push(
        `Deterministic case "${row.caseId}" does not identify a baseline or candidate arm.`
      );
      continue;
    }

    const key = `${row.caseId}:${row.arm}`;
    rowCounts.set(key, (rowCounts.get(key) ?? 0) + 1);

    if (!row.artifactHash) {
      refusals.push(
        `Deterministic evidence carries no artifact hash for the ${row.arm} arm of "${row.caseId}".`
      );
    }

    if (row.arm === 'candidate') {
      deterministicCandidates.set(row.caseId, {
        artifactHash: row.artifactHash,
        runDirectory: row.runDirectory,
      });
    }
  }

  refusals.push(
    ...exactCaseSetRefusals(
      'Current candidate artifacts',
      evidence.currentCandidateArtifacts.map((item) => item.caseId),
      expected
    )
  );

  for (const current of evidence.currentCandidateArtifacts) {
    const recorded = deterministicCandidates.get(current.caseId);

    if (!current.artifactHash) {
      // Naming the path is the whole message: the arms are siblings of the lane
      // directory, and a maintainer who put them inside it sees an empty
      // refusal otherwise.
      refusals.push(
        `Current candidate artifact for "${current.caseId}" is missing at "${current.runDirectory}".`
      );
      continue;
    }

    if (!recorded) continue;

    if (recorded.runDirectory !== current.runDirectory) {
      refusals.push(
        `Deterministic evidence names a different candidate path for "${current.caseId}".`
      );
    }

    if (recorded.artifactHash !== current.artifactHash) {
      refusals.push(
        `Deterministic evidence does not match the current candidate artifact for "${current.caseId}".`
      );
    }
  }

  for (const caseId of expected) {
    for (const arm of ['baseline', 'candidate'] as const) {
      const count = rowCounts.get(`${caseId}:${arm}`) ?? 0;

      if (count === 0) {
        refusals.push(`Deterministic evidence omits the ${arm} arm for required case "${caseId}".`);
      } else if (count > 1) {
        refusals.push(
          `Deterministic evidence duplicates the ${arm} arm for required case "${caseId}".`
        );
      }
    }
  }

  refusals.push(
    ...exactCaseSetRefusals(
      'Judging outcomes',
      outcomes.map((item) => item.caseId),
      expected
    )
  );

  const judging = evidence.judging;

  if (!judging) {
    refusals.push('The judging report carries no deterministic evidence identity.');
    return refusals;
  }

  if (judging.deterministicReportHash !== report.reportHash) {
    refusals.push('The judging report names a different deterministic report.');
  }

  if (judging.caseManifestHash !== evidence.currentCaseManifestHash) {
    refusals.push('The judging report does not match the current case manifest.');
  }

  if (judging.payloadHash !== evidence.currentPayloadHash) {
    refusals.push('The judging report does not match the current candidate payload.');
  }

  refusals.push(
    ...exactCaseSetRefusals(
      'Judging candidate artifacts',
      judging.candidateArtifacts.map((item) => item.caseId),
      expected
    )
  );

  for (const artifact of judging.candidateArtifacts) {
    const deterministic = deterministicCandidates.get(artifact.caseId);

    if (deterministic && deterministic.runDirectory !== artifact.runDirectory) {
      refusals.push(
        `Judging names a different candidate artifact for "${artifact.caseId}": "${artifact.runDirectory}" instead of "${deterministic.runDirectory}".`
      );
    }

    if (deterministic && deterministic.artifactHash !== artifact.artifactHash) {
      refusals.push(`Judging names different candidate artifact content for "${artifact.caseId}".`);
    }
  }

  return refusals;
}

function exactCaseSetRefusals(
  label: string,
  actual: readonly string[],
  expected: ReadonlySet<string>
): string[] {
  const refusals: string[] = [];
  const counts = new Map<string, number>();

  for (const caseId of actual) counts.set(caseId, (counts.get(caseId) ?? 0) + 1);

  for (const caseId of expected) {
    const count = counts.get(caseId) ?? 0;

    if (count === 0) refusals.push(`${label} omit required case "${caseId}".`);
    else if (count > 1) refusals.push(`${label} duplicate required case "${caseId}".`);
  }

  for (const caseId of counts.keys()) {
    if (!expected.has(caseId)) refusals.push(`${label} contain unexpected case "${caseId}".`);
  }

  return refusals;
}
