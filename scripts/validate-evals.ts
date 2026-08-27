import process from 'node:process';

import { validateEvalManifests } from '../src/eval/manifest-validator.ts';

const result = await validateEvalManifests(process.cwd());

for (const note of result.notes) console.log(`- ${note}`);

if (result.errors.length > 0) {
  console.error('\nEvaluation contract validation failed:\n');
  for (const error of result.errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Evaluation contract is consistent with the working tree.');
