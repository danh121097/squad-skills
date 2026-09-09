import { cp, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { validatePlanBundle } from '../../src/plans/plan-bundle-validator.ts';

const fixtureBundle = path.join(process.cwd(), 'evals/fixtures/plan-bundle/checkout-recovery');
const phaseOne = 'phases/phase-01-cart-persistence-contract.md';
const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true }))
  );
});

/**
 * Every negative case is the shipped bundle copied and mutated once.
 *
 * Hand-written broken bundles drift: each one has to restate the whole valid
 * structure, and a second mistake inside one makes its test pass for a reason
 * the test does not name. Copying the one bundle that is known valid means a
 * failure can only come from the mutation under test.
 */
async function bundleWith(mutate: (root: string) => Promise<void>): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'plan-bundle-'));

  temporaryRoots.push(root);
  await cp(fixtureBundle, root, { recursive: true });
  await mutate(root);

  return root;
}

async function errorsFor(mutate: (root: string) => Promise<void>): Promise<string[]> {
  return (await validatePlanBundle(await bundleWith(mutate))).errors;
}

/** Replaces one line's value in a document's frontmatter or body. */
async function patch(root: string, file: string, from: string, to: string): Promise<void> {
  const target = path.join(root, file);
  const source = await readFile(target, 'utf8');

  expect(source, `${file} does not contain ${from}`).toContain(from);
  await writeFile(target, source.replace(from, to));
}

describe('validatePlanBundle', () => {
  it('accepts the shipped bundle', async () => {
    const result = await validatePlanBundle(fixtureBundle);

    expect(result.errors).toEqual([]);
    expect(result.checkedDocuments).toContain('plan.md');
    expect(result.checkedDocuments).toContain(phaseOne);
  });

  it('reports a bundle directory it cannot read', async () => {
    const result = await validatePlanBundle(path.join(fixtureBundle, 'no-such-plan'));

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('could not be read');
  });

  describe('root layout', () => {
    it('rejects a Markdown file at the plan root', async () => {
      const errors = await errorsFor(async (root) => {
        await writeFile(path.join(root, 'notes.md'), '# Notes\n');
      });

      expect(errors.join('\n')).toContain('notes.md: the plan root holds only plan.md');
    });

    it('rejects a directory that is not one of the four standard ones', async () => {
      const errors = await errorsFor(async (root) => {
        await cp(path.join(root, 'references'), path.join(root, 'background'), {
          recursive: true,
        });
      });

      expect(errors.join('\n')).toContain('background/: not a standard plan directory');
    });

    it('rejects a bundle with no plan.md', async () => {
      const errors = await errorsFor(async (root) => {
        await rm(path.join(root, 'plan.md'));
      });

      expect(errors.join('\n')).toContain('plan.md is missing');
    });

    it('rejects a bundle with no phases directory', async () => {
      const errors = await errorsFor(async (root) => {
        await rm(path.join(root, 'phases'), { recursive: true });
      });

      expect(errors.join('\n')).toContain('phases/ is missing');
    });

    it('stops at layout errors instead of reporting their consequences', async () => {
      const errors = await errorsFor(async (root) => {
        await rm(path.join(root, 'phases'), { recursive: true });
      });

      expect(errors.every((error) => error.includes('phases/'))).toBe(true);
    });
  });

  describe('phase numbering', () => {
    it('rejects a gap in the running order', async () => {
      const errors = await errorsFor(async (root) => {
        await rm(path.join(root, 'phases/phase-02-resume-link-delivery.md'));
        await patch(
          root,
          'plan.md',
          '[02 — Resume link delivery](phases/phase-02-resume-link-delivery.md)',
          '02 — Resume link delivery'
        );
        await patch(
          root,
          'phases/phase-03-recovery-surface.md',
          'depends_on: [2]',
          'depends_on: [1]'
        );
      });

      expect(errors.join('\n')).toContain('numbering must run continuously from 01');
    });

    it('rejects a phase file that is not zero padded', async () => {
      const errors = await errorsFor(async (root) => {
        await rename(
          path.join(root, phaseOne),
          path.join(root, 'phases/phase-1-cart-persistence-contract.md')
        );
      });

      expect(errors.join('\n')).toContain('phase-XX-<kebab-case-title>.md');
    });

    it('rejects a frontmatter phase number the filename disagrees with', async () => {
      const errors = await errorsFor(async (root) => {
        await patch(root, phaseOne, 'phase: 1\n', 'phase: 4\n');
      });

      expect(errors.join('\n')).toContain('frontmatter says phase 4 and the filename says 01');
    });
  });

  describe('the reserved phase prefix', () => {
    it('rejects an artifact carrying it', async () => {
      const errors = await errorsFor(async (root) => {
        await rename(
          path.join(root, 'artifacts/handoff-to-phase-02.md'),
          path.join(root, 'artifacts/phase-02-handoff.md')
        );
        await patch(
          root,
          'plan.md',
          'artifacts/handoff-to-phase-02.md',
          'artifacts/phase-02-handoff.md'
        );
        await patch(
          root,
          'phases/phase-02-resume-link-delivery.md',
          '  - ../artifacts/handoff-to-phase-02.md',
          '  - ../artifacts/phase-02-handoff.md'
        );
      });

      expect(errors.join('\n')).toContain('the phase-XX- prefix belongs to phases/ alone');
    });

    it('rejects an ADR carrying it', async () => {
      const errors = await errorsFor(async (root) => {
        await rename(
          path.join(root, 'adr/adr-002-single-use-resume-tokens.md'),
          path.join(root, 'adr/phase-02-single-use-resume-tokens.md')
        );
      });

      expect(errors.join('\n')).toContain('the phase-XX- prefix belongs to phases/ alone');
    });
  });

  describe('links', () => {
    it('rejects a relative link that resolves to nothing', async () => {
      const errors = await errorsFor(async (root) => {
        await patch(
          root,
          'plan.md',
          '(references/domain-model.md)',
          '(references/domain-models.md)'
        );
      });

      expect(errors.join('\n')).toContain('broken relative link: references/domain-models.md');
    });

    it('rejects a link that escapes the bundle', async () => {
      const errors = await errorsFor(async (root) => {
        await patch(
          root,
          'plan.md',
          '(references/domain-model.md)',
          '(../../elsewhere/domain-model.md)'
        );
      });

      expect(errors.join('\n')).toContain('escapes the plan bundle');
    });

    it('rejects an absolute link', async () => {
      const errors = await errorsFor(async (root) => {
        await patch(
          root,
          'plan.md',
          '(references/domain-model.md)',
          '(/srv/plans/domain-model.md)'
        );
      });

      expect(errors.join('\n')).toContain('is absolute');
    });

    it('rejects a phase the index does not link', async () => {
      const errors = await errorsFor(async (root) => {
        await patch(
          root,
          'plan.md',
          '[03 — Recovery surface](phases/phase-03-recovery-surface.md)',
          '03 — Recovery surface'
        );
      });

      expect(errors.join('\n')).toContain(
        'the phase index links no file for phases/phase-03-recovery-surface.md'
      );
    });

    it('rejects a declared input the phase body never links', async () => {
      const errors = await errorsFor(async (root) => {
        await patch(
          root,
          'phases/phase-03-recovery-surface.md',
          '[frontend feasibility note](../artifacts/frontend-feasibility.md)',
          'frontend feasibility note'
        );
      });

      expect(errors.join('\n')).toContain(
        'declares input ../artifacts/frontend-feasibility.md and links to it nowhere'
      );
    });
  });

  describe('frontmatter', () => {
    it('rejects a phase status outside the vocabulary', async () => {
      const errors = await errorsFor(async (root) => {
        await patch(root, phaseOne, 'status: accepted', 'status: done');
      });

      expect(errors.join('\n')).toContain('"status" must be one of proposed, in-progress');
    });

    it('rejects a phase with no depends_on key', async () => {
      const errors = await errorsFor(async (root) => {
        await patch(root, phaseOne, 'depends_on: []\n', '');
      });

      expect(errors.join('\n')).toContain('"depends_on" must be a list of phase numbers');
    });

    it('rejects a dependency on a phase that runs later', async () => {
      const errors = await errorsFor(async (root) => {
        await patch(root, phaseOne, 'depends_on: []', 'depends_on: [3]');
      });

      expect(errors.join('\n')).toContain('does not run earlier');
    });

    it('rejects an artifact with no owner, revision or status', async () => {
      const errors = await errorsFor(async (root) => {
        await writeFile(
          path.join(root, 'artifacts/test-strategy.md'),
          '---\nphase: 1\n---\n\n# Test strategy\n'
        );
      });
      const joined = errors.join('\n');

      expect(joined).toContain('artifacts/test-strategy.md: missing non-empty "owner"');
      expect(joined).toContain('artifacts/test-strategy.md: "revision"');
      expect(joined).toContain('artifacts/test-strategy.md: "status"');
    });

    it('rejects a gate verdict from the other gate vocabulary', async () => {
      const errors = await errorsFor(async (root) => {
        await patch(root, 'artifacts/qa-report.md', 'verdict: PASS', 'verdict: APPROVE');
      });

      expect(errors.join('\n')).toContain('"verdict" must be one of PASS, FAIL, NEEDS_ENVIRONMENT');
    });

    it('rejects a gate artifact that records no graded input', async () => {
      const errors = await errorsFor(async (root) => {
        await writeFile(
          path.join(root, 'artifacts/qa-report.md'),
          '---\nphase: 1\nowner: squad-qa\nrevision: 1\nstatus: final\ngate: qa\nverdict: PASS\n---\n\n# QA report\n'
        );
      });

      expect(errors.join('\n')).toContain('lists every input it graded under "reviewed"');
    });

    it('rejects a document with no frontmatter at all', async () => {
      const errors = await errorsFor(async (root) => {
        await writeFile(path.join(root, 'references/domain-model.md'), '# Domain model\n');
      });

      expect(errors.join('\n')).toContain('references/domain-model.md: missing YAML frontmatter');
    });
  });

  describe('gates', () => {
    it('rejects an APPROVE that names no QA PASS for its phase', async () => {
      const errors = await errorsFor(async (root) => {
        await patch(root, 'artifacts/qa-report.md', 'verdict: PASS', 'verdict: FAIL');
      });

      expect(errors.join('\n')).toContain(
        'APPROVE names no current QA PASS artifact for the same phase'
      );
    });

    it('rejects an APPROVE whose QA PASS was superseded', async () => {
      const errors = await errorsFor(async (root) => {
        await patch(root, 'artifacts/qa-report.md', 'status: final', 'status: superseded');
      });

      expect(errors.join('\n')).toContain(
        'APPROVE names no current QA PASS artifact for the same phase'
      );
    });

    it('rejects a review that reaches its QA report only through the phase file', async () => {
      const errors = await errorsFor(async (root) => {
        await patch(
          root,
          'artifacts/code-review.md',
          '  - path: ./qa-report.md\n    revision: 1\n',
          ''
        );
      });

      expect(errors.join('\n')).toContain(
        'APPROVE names no current QA PASS artifact for the same phase'
      );
    });

    it('turns a gate stale when the evidence it graded moves on', async () => {
      const errors = await errorsFor(async (root) => {
        await patch(root, phaseOne, 'revision: 2', 'revision: 3');
      });
      const joined = errors.join('\n');

      expect(joined).toContain(
        'graded ../phases/phase-01-cart-persistence-contract.md at revision 2'
      );
      expect(joined).toContain(
        'Mark this verdict status: superseded, then rerun QA and Code Review'
      );
      expect(joined).toContain('artifacts/qa-report.md');
      expect(joined).toContain('artifacts/code-review.md');
    });

    it('accepts a stale gate once it is marked superseded', async () => {
      const errors = await errorsFor(async (root) => {
        await patch(root, phaseOne, 'revision: 2', 'revision: 3');
        await patch(root, 'artifacts/qa-report.md', 'status: final', 'status: superseded');
        await patch(root, 'artifacts/code-review.md', 'status: final', 'status: superseded');
      });

      expect(errors).toEqual([]);
    });

    it('rejects a gate that graded a document the bundle does not hold', async () => {
      const errors = await errorsFor(async (root) => {
        await patch(root, 'artifacts/qa-report.md', './test-strategy.md', './test-plan.md');
      });

      expect(errors.join('\n')).toContain('graded ./test-plan.md, which the bundle does not hold');
    });
  });

  describe('acceptance', () => {
    it('rejects a phase accepted with a required checkbox open', async () => {
      const errors = await errorsFor(async (root) => {
        await patch(root, phaseOne, '- [x] The migration reverses', '- [ ] The migration reverses');
      });

      expect(errors.join('\n')).toContain('marked accepted with a required checkbox still open');
    });

    it('rejects a phase accepted while a user approval is pending', async () => {
      const errors = await errorsFor(async (root) => {
        await patch(
          root,
          'phases/phase-02-resume-link-delivery.md',
          'status: in-progress',
          'status: accepted'
        );
      });
      const joined = errors.join('\n');

      expect(joined).toContain('approval production-sending-domain is still pending');
      expect(joined).toContain('named options');
    });

    it('leaves an open checkbox alone on a phase that is not accepted', async () => {
      const result = await validatePlanBundle(fixtureBundle);

      expect(result.errors).toEqual([]);
    });
  });
});
