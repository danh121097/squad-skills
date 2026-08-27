import process from 'node:process';

import { validateSkills } from '../src/skill-validator.ts';

const result = await validateSkills(process.cwd());

if (result.errors.length > 0) {
  console.error('Skill validation failed:\n');
  for (const error of result.errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validated ${result.skillNames.length} skills: ${result.skillNames.join(', ')}`);
