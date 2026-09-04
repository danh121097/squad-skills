import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { checkRoleReport } from '../../src/eval/role-report-contract.ts';
import {
  codeReviewReportContract,
  qaReportContract,
  roleReportContracts,
} from '../../src/eval/role-report-contracts.ts';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const fixtures = path.join(projectRoot, 'evals', 'fixtures', 'report-contract');
const cases = ['pagination-clamp', 'transfer-rollback', 'document-authorization'];

function readFixture(name: string): Promise<string> {
  return readFile(path.join(fixtures, `${name}.md`), 'utf8');
}

/**
 * The fixtures are evidence, and evidence that can be edited to make a check
 * pass is not evidence. `.prettierignore` keeps the formatter off them; this
 * keeps everything else off them. A deliberate replacement re-records the hash
 * in the same diff, which is how a reviewer sees that the evidence moved.
 */
const fixtureHashes: Readonly<Record<string, string>> = {
  'document-authorization.control': 'c24de5f484cbf776',
  'document-authorization.skill': '9aa596211ac64237',
  'pagination-clamp.control': 'ebe966af92f7e7ea',
  'pagination-clamp.skill': '21b62cdd1314e268',
  'transfer-rollback.control': '5aea1c1ddb30cc6f',
  'transfer-rollback.skill': '6a9c7d50a6b7ab44',
};

describe('report-contract fixtures', () => {
  it.each(Object.keys(fixtureHashes))('%s is byte-for-byte what the A/B produced', async (name) => {
    const digest = createHash('sha256')
      .update(await readFile(path.join(fixtures, `${name}.md`)))
      .digest('hex');

    expect(digest.slice(0, 16)).toBe(fixtureHashes[name]);
  });
});

describe('role report contracts', () => {
  it('quotes a requirement for every element of every role', () => {
    for (const contract of Object.values(roleReportContracts)) {
      for (const element of contract.elements) {
        expect(element.requirement.length, `${contract.role}/${element.id}`).toBeGreaterThan(20);
        expect(element.minimumFamilies).toBeLessThanOrEqual(element.families.length);
      }
    }
  });

  /**
   * The test that keeps this from becoming a control that cannot fire. One role
   * would make every check trivially true of the only contract there is.
   */
  it('covers more than one role', () => {
    expect(Object.keys(roleReportContracts).length).toBeGreaterThan(1);
  });

  it('reads a verdict only where one is issued, not where the word appears', () => {
    expect(checkRoleReport('18 tests, 11 pass, 7 fail.', qaReportContract).verdict).toBeNull();
    expect(
      checkRoleReport('**Verdict: FAIL** — criterion 3 unmet.', qaReportContract).verdict
    ).toBe('FAIL');
    expect(
      checkRoleReport('Verdict: NEEDS_ENVIRONMENT, no device available.', qaReportContract).verdict
    ).toBe('NEEDS_ENVIRONMENT');
    expect(checkRoleReport('Verdict: CHANGES_REQUESTED', codeReviewReportContract).verdict).toBe(
      'CHANGES_REQUESTED'
    );
  });

  it('needs more than one stray word to satisfy a multi-family element', () => {
    // `environment-and-commands` wants a command and a version, so a report
    // naming only a runner satisfies neither.
    const partial = checkRoleReport('Ran the tests with node.', qaReportContract);

    expect(partial.missing).toContain('environment-and-commands');
  });
});

/**
 * The measurement this checker exists for, re-run on every `pnpm test` so it
 * cannot quietly stop separating the arms. The fixtures are verbatim output from
 * an A/B that predates the checker; see their README.
 */
describe('the A/B fixtures the contract was validated against', () => {
  const discriminating = [
    'determinism',
    'environment-and-commands',
    'residual-risk',
    'execution-mode',
  ];

  it.each(cases)(
    '%s: the skill arm issues a verdict and the control arm does not',
    async (name) => {
      const skill = checkRoleReport(await readFixture(`${name}.skill`), qaReportContract);
      const control = checkRoleReport(await readFixture(`${name}.control`), qaReportContract);

      expect(skill.verdict).not.toBeNull();
      expect(control.verdict).toBeNull();
    }
  );

  it.each(cases)('%s: the control arm states none of the discriminating elements', async (name) => {
    const control = checkRoleReport(await readFixture(`${name}.control`), qaReportContract);

    expect(control.missing).toEqual(expect.arrayContaining(discriminating));
  });

  /**
   * Two of the three skill arms state all four; `document-authorization` states
   * neither determinism nor residual risk. That gap is recorded rather than
   * rounded away, so this asserts the measured figure and fails if either the
   * checker or a fixture moves.
   */
  it('the skill arms state ten of the twelve discriminating elements', async () => {
    let stated = 0;

    for (const name of cases) {
      const result = checkRoleReport(await readFixture(`${name}.skill`), qaReportContract);
      stated += discriminating.filter((id) => result.satisfied.includes(id)).length;
    }

    expect(stated).toBe(10);
  });

  it('acceptance-traceability is satisfied by both arms, so it separates nothing', async () => {
    for (const name of cases) {
      for (const arm of ['skill', 'control']) {
        const result = checkRoleReport(await readFixture(`${name}.${arm}`), qaReportContract);

        expect(result.satisfied, `${name}.${arm}`).toContain('acceptance-traceability');
      }
    }
  });
});
