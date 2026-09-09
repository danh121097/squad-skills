import path from 'node:path';
import process from 'node:process';

import { validatePlanBundle } from '../src/plans/plan-bundle-validator.ts';

/**
 * Checks a written plan bundle against the structure the Product role and the
 * squad lead produce when a user asks for a plan on disk.
 *
 * The bundle is the user's output and usually lives in the user's repository,
 * so this takes a path rather than scanning a fixed location. The one bundle
 * this repository ships is the worked example under `evals/fixtures/`, which
 * `pnpm test` validates through the unit suite.
 */
const target = process.argv[2];

if (!target) {
  console.error('Usage: pnpm validate:plan <plan-directory>');
  process.exit(2);
}

const bundleRoot = path.resolve(process.cwd(), target);
const result = await validatePlanBundle(bundleRoot);

if (result.errors.length > 0) {
  console.error(`Plan bundle validation failed for ${target}:\n`);
  for (const error of result.errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Plan bundle ${target} is consistent: ${result.checkedDocuments.length} documents checked.`
);
