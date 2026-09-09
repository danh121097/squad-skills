import { validatePlanGates } from './plan-bundle-gates.ts';
import { validatePlanFrontMatter } from './plan-bundle-front-matter.ts';
import { readPlanBundle } from './plan-bundle-layout.ts';
import {
  validateDeclaredInputs,
  validatePhaseIndex,
  validatePlanLinks,
} from './plan-bundle-links.ts';

export interface PlanBundleValidationResult {
  /** Bundle-relative paths of every document the run examined, in read order. */
  checkedDocuments: string[];
  errors: string[];
}

/**
 * Checks one written plan bundle against the structure `squad-product` and the
 * `squads-team` lead produce when a user asks for a plan on disk.
 *
 * Layout runs first and alone: the later checks are phrased in terms of it, so a
 * bundle whose root is a flat pile of Markdown has nowhere to hang a question
 * about phase order or gate evidence, and reporting forty consequential errors
 * would bury the one that caused them.
 */
export async function validatePlanBundle(bundleRoot: string): Promise<PlanBundleValidationResult> {
  const layout = await readPlanBundle(bundleRoot);
  const checkedDocuments = layout.documents.map((document) => document.relativePath);

  if (layout.errors.length > 0) return { checkedDocuments, errors: layout.errors };

  const frontMatter = validatePlanFrontMatter(layout.documents);
  const links = await validatePlanLinks(bundleRoot, layout.documents);
  const inputs = new Map(
    [...frontMatter.metadata].map(([document, metadata]) => [document, metadata.inputs])
  );

  return {
    checkedDocuments,
    errors: [
      ...frontMatter.errors,
      ...links.errors,
      ...validatePhaseIndex(layout.documents, links.linked),
      ...validateDeclaredInputs(layout.documents, inputs, links.linked),
      ...validatePlanGates({ documents: layout.documents, metadata: frontMatter.metadata }),
    ],
  };
}
