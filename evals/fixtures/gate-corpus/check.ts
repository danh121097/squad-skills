/**
 * The shape every corpus case exposes to a grader.
 *
 * A case ships the checks a correct test would make, so the corpus can state
 * its own ground truth: run them against `fixed.ts` and every one holds, run
 * them against `buggy.ts` and exactly the case's declared discriminators fail.
 * That is what makes `defect.yml` a verified record rather than a claim, and it
 * is the upper bound a produced test is later graded against.
 */
export interface Check {
  /** Matches an id in the case's `defect.yml`, so the record stays checkable. */
  name: string;
  run(): void | Promise<void>;
}

/** Names of the checks that failed, in declaration order. */
export async function runChecks(checks: readonly Check[]): Promise<string[]> {
  const failed: string[] = [];

  for (const check of checks) {
    try {
      await check.run();
    } catch {
      failed.push(check.name);
    }
  }

  return failed;
}

/** Deliberately not `node:assert`: a check failing is data here, not a crash. */
export function expectEqual(actual: unknown, expected: unknown, label: string): void {
  const same = JSON.stringify(actual) === JSON.stringify(expected);

  if (!same)
    throw new Error(
      `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
}

export async function expectThrows(run: () => unknown, label: string): Promise<void> {
  try {
    await run();
  } catch {
    return;
  }

  throw new Error(`${label}: expected a rejection, got none`);
}
