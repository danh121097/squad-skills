/**
 * Whether a role's report states the things that role's handoff contract
 * requires it to state.
 *
 * This exists because the deterministic gate the roadmap planned could not
 * fire. Six A/B runs of `squad-qa`, three with the skill loaded and three
 * without, all caught their seeded defect: asking "did the produced test fail
 * on the buggy fixture" separated nothing. What did separate the arms was the
 * report — acceptance traceability, a determinism statement, residual risk
 * naming what was deliberately not asserted, an execution-mode label, and a
 * formal verdict. Every one of those is required by the skill's own completion
 * checklist, and none of them was visible to the gate.
 *
 * So this measures the part that differed. Two limits, stated rather than
 * discovered later:
 *
 * 1. It detects **presence, not truth**. A report claiming an independent pass
 *    that never happened satisfies `execution-mode` here. Presence is the
 *    precondition a reviewer needs in order to check truth at all, which is
 *    worth having, and is not the same as having checked it.
 * 2. It reads prose with patterns, so it can miss a requirement stated in
 *    wording nobody anticipated. A miss is a false "missing", never a false
 *    "satisfied" — the patterns are broad and the failure mode is to under-
 *    credit. Treat a missing element as "say it more plainly", not as proof it
 *    was not done.
 */
export interface ReportElement {
  /** Stable id, used in output and in tests. */
  id: string;
  /** The contract line this comes from, quoted from the skill. */
  requirement: string;
  /**
   * Every pattern family that counts as stating it. An element is satisfied
   * when at least `minimumFamilies` of them match, so a single stray word can
   * never satisfy an element on its own.
   */
  families: RegExp[][];
  minimumFamilies: number;
}

export interface RoleReportContract {
  /** The skill whose handoff contract this transcribes. */
  role: string;
  /** The verdict vocabulary that role may issue, in its own spelling. */
  verdicts: string[];
  elements: ReportElement[];
}

export interface ReportCheckResult {
  role: string;
  /** The verdict found, or null when the report issues none. */
  verdict: string | null;
  satisfied: string[];
  missing: string[];
}

/** True when at least `minimumFamilies` of the element's families match. */
function isSatisfied(report: string, element: ReportElement): boolean {
  const matched = element.families.filter((family) =>
    family.some((pattern) => pattern.test(report))
  ).length;

  return matched >= element.minimumFamilies;
}

/**
 * A verdict counts only where a report issues one, rather than anywhere the
 * word appears: `FAIL` inside a table of test results is a count, not a gate
 * decision. Requiring the labelled form is what keeps the two apart.
 */
function findVerdict(report: string, verdicts: string[]): string | null {
  for (const verdict of verdicts) {
    const labelled = new RegExp(
      `(?:verdict|status|gate|result)\\W{0,8}\\**\\s*${verdict}\\b|\\*\\*${verdict}\\*\\*`,
      'i'
    );

    if (labelled.test(report)) return verdict;
  }

  return null;
}

export function checkRoleReport(report: string, contract: RoleReportContract): ReportCheckResult {
  const satisfied: string[] = [];
  const missing: string[] = [];

  for (const element of contract.elements) {
    (isSatisfied(report, element) ? satisfied : missing).push(element.id);
  }

  return {
    role: contract.role,
    verdict: findVerdict(report, contract.verdicts),
    satisfied,
    missing,
  };
}
