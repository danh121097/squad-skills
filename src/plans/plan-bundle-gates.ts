import type { PlanDocumentMetadata } from './plan-bundle-front-matter.ts';
import type { PlanDocument } from './plan-bundle-layout.ts';
import { toBundlePath } from './plan-bundle-links.ts';

const uncheckedBox = /^[ \t]*[-*+][ \t]+\[[ \t]\]/m;

export interface PlanGateInput {
  documents: PlanDocument[];
  metadata: Map<string, PlanDocumentMetadata>;
}

/**
 * The pipeline rules a written bundle can be checked against offline.
 *
 * A file in a plan bundle records a verdict for a reader; it is never the
 * mechanism that gates a stage, and nothing here reads it as one. What it can
 * do is refuse a bundle whose records contradict the pipeline that produced
 * them — a review that never names a QA pass, a verdict still marked current
 * over evidence that has since moved, a phase marked accepted with its own
 * checklist open.
 */
export function validatePlanGates(input: PlanGateInput): string[] {
  return [
    ...validateDependencies(input),
    ...validateGateEvidence(input),
    ...validateGateOrder(input),
    ...validateAcceptance(input),
  ];
}

/**
 * A dependency names an earlier phase. Forward and self dependencies are the two
 * shapes that make an order unrunnable while still reading as one.
 */
function validateDependencies({ documents, metadata }: PlanGateInput): string[] {
  const errors: string[] = [];
  const phases = new Set(
    documents.filter((document) => document.kind === 'phase').map((document) => document.number)
  );

  for (const document of documents) {
    if (document.kind !== 'phase') continue;

    const meta = metadata.get(document.relativePath);

    if (!meta || meta.phaseNumber === null) continue;

    for (const dependency of meta.depends) {
      if (!phases.has(dependency)) {
        errors.push(
          `${document.relativePath}: depends on phase ${dependency}, which the bundle has no file for.`
        );
        continue;
      }

      if (dependency >= meta.phaseNumber) {
        errors.push(
          `${document.relativePath}: depends on phase ${dependency}, which does not run earlier. phases/ is the running order, so a dependency names a lower number.`
        );
      }
    }
  }

  return errors;
}

/**
 * A gate that still claims to be current graded the revisions the bundle holds
 * now.
 *
 * This is the rule that keeps a plan honest after it is edited. Changing a
 * phase's contract or an artifact it rests on does not make the old verdict
 * wrong on its face — it makes it a verdict about a document that no longer
 * exists, which reads exactly like a verdict about the current one.
 */
function validateGateEvidence({ documents, metadata }: PlanGateInput): string[] {
  const errors: string[] = [];
  const revisions = new Map<string, number | null>();

  for (const document of documents) {
    revisions.set(document.relativePath, metadata.get(document.relativePath)?.revision ?? null);
  }

  for (const document of documents) {
    const meta = metadata.get(document.relativePath);

    if (!meta?.gate || meta.status === 'superseded') continue;

    for (const reviewed of meta.reviewed) {
      const target = toBundlePath(document.relativePath, reviewed.path);

      if (target === null || !revisions.has(target)) {
        errors.push(
          `${document.relativePath}: graded ${reviewed.path}, which the bundle does not hold.`
        );
        continue;
      }

      const current = revisions.get(target) ?? null;

      if (current === null) continue;

      if (current !== reviewed.revision) {
        errors.push(
          `${document.relativePath}: graded ${reviewed.path} at revision ${reviewed.revision} and it now stands at ${current}. Mark this verdict status: superseded, then rerun QA and Code Review in that order.`
        );
      }
    }
  }

  return errors;
}

/**
 * Code Review runs on QA-passed work, so an APPROVE names the PASS it followed.
 *
 * Naming it is the whole check: a review that lists the QA report among its
 * inputs cannot have been written before that report existed, and one that does
 * not list it has no evidence it ran second.
 */
function validateGateOrder({ documents, metadata }: PlanGateInput): string[] {
  const errors: string[] = [];
  const qaPasses = new Map<string, PlanDocument>();

  for (const document of documents) {
    const meta = metadata.get(document.relativePath);

    if (meta?.gate === 'qa' && meta.verdict === 'PASS' && meta.status !== 'superseded') {
      qaPasses.set(document.relativePath, document);
    }
  }

  for (const document of documents) {
    const meta = metadata.get(document.relativePath);

    // A superseded verdict has stopped claiming anything, which is the state
    // rule 11 puts a gate into after its evidence moves. Holding it to the
    // ordering rule would leave a bundle with no way to record that history.
    if (meta?.gate !== 'code-review' || meta.verdict !== 'APPROVE') continue;
    if (meta.status === 'superseded') continue;

    const cited = meta.reviewed
      .map((entry) => toBundlePath(document.relativePath, entry.path))
      .filter((entry): entry is string => entry !== null);

    const passes = cited
      .map((entry) => qaPasses.get(entry))
      .filter((entry): entry is PlanDocument => entry !== undefined);

    const owningPhase = meta.owningPhase;
    const matching = passes.filter(
      (pass) => metadata.get(pass.relativePath)?.owningPhase === owningPhase
    );

    if (matching.length === 0) {
      errors.push(
        `${document.relativePath}: APPROVE names no current QA PASS artifact for the same phase under "reviewed". Code Review runs only after QA passes.`
      );
    }
  }

  return errors;
}

/**
 * A phase is accepted when nothing it left open is still open.
 *
 * Both halves are here because they fail differently. An unchecked box is work
 * the phase itself said it needed; a pending approval is a decision the phase is
 * not allowed to make. Neither is closed by a status field asserting it is.
 */
function validateAcceptance({ documents, metadata }: PlanGateInput): string[] {
  const errors: string[] = [];

  for (const document of documents) {
    const meta = metadata.get(document.relativePath);

    if (meta?.status !== 'accepted' || document.kind !== 'phase') continue;

    if (uncheckedBox.test(document.body)) {
      errors.push(
        `${document.relativePath}: marked accepted with a required checkbox still open. Complete it, or return the phase to in-progress.`
      );
    }

    const pending = meta.approvals.filter((approval) => approval.status !== 'granted');

    if (pending.length > 0) {
      errors.push(
        `${document.relativePath}: marked accepted while approval ${pending.map((approval) => approval.id).join(', ')} is still pending. Put the decision to the user as named options and record the answer before accepting.`
      );
    }
  }

  return errors;
}
