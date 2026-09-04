import process from 'node:process';

import { validateCrossSkillContract } from '../src/catalog/cross-skill-contract-validator.ts';
import { validateSkillPayloads } from '../src/catalog/skill-payload-validator.ts';
import { validateSkills } from '../src/catalog/skill-validator.ts';

const catalog = await validateSkills(process.cwd());
const contract = await validateCrossSkillContract(process.cwd());
const payloads = await validateSkillPayloads(process.cwd());
const errors = [...catalog.errors, ...contract.errors, ...payloads.errors];

if (errors.length > 0) {
  console.error('Skill validation failed:\n');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validated ${catalog.skillNames.length} skills: ${catalog.skillNames.join(', ')}`);
console.log(`Cross-skill role contract checked across ${contract.checkedFiles.length} files.`);
console.log(`Payload ceiling checked for ${payloads.checkedSkills.length} skills.`);
