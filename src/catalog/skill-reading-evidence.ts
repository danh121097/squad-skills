/** Observations from evaluator-owned transcripts, never instructions supplied to workers. */
export interface ReadingExpectation {
  required: string[];
  forbidden: string[];
}

export interface SkillRead {
  path: string;
  /** Stable worker/session identity; separate workers legitimately read the same file. */
  context: string;
  reason: 'initial' | 'file-change' | 'context-recovery' | 'scope-change';
  evidence: string;
}

const reasons = new Set(['initial', 'file-change', 'context-recovery', 'scope-change']);

/** Validates observations and counts excess reads without claiming to authenticate a transcript. */
export function summarizeReadingEvidence(input: unknown, expectation?: ReadingExpectation) {
  if (input === undefined) {
    if (expectation) throw new Error('Missing reading evidence for this scenario.');
    return null;
  }
  if (!Array.isArray(input)) throw new Error('reads must be an array.');
  const paths = new Set<string>();
  const seen = new Set<string>();
  let repeatedReads = 0;
  let unjustifiedRereads = 0;
  let forbiddenReads = 0;
  for (const raw of input) {
    const read = raw as SkillRead;
    if (
      !read ||
      typeof read.path !== 'string' ||
      !read.path.startsWith('skills/') ||
      read.path.includes('\\') ||
      read.path.split('/').some((part) => !part || part === '.' || part === '..') ||
      typeof read.context !== 'string' ||
      !read.context.trim() ||
      typeof read.evidence !== 'string' ||
      !read.evidence.trim() ||
      !reasons.has(read.reason)
    )
      throw new Error(
        'Each skill read needs a canonical skill path, context, reason and evidence.'
      );
    const key = JSON.stringify([read.context, read.path]);
    if (seen.has(key)) {
      repeatedReads++;
      if (read.reason === 'initial') unjustifiedRereads++;
    }
    seen.add(key);
    paths.add(read.path);
    if (expectation?.forbidden.includes(read.path)) forbiddenReads++;
  }
  const missingRequired = expectation?.required.filter((file) => !paths.has(file)) ?? [];
  return {
    reads: input.length,
    uniqueFiles: paths.size,
    repeatedReads,
    unjustifiedRereads,
    forbiddenReads,
    missingRequired,
    passed: missingRequired.length === 0 && forbiddenReads === 0 && unjustifiedRereads === 0,
  };
}
