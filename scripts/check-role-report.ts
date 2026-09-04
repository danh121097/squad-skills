import { readFile } from 'node:fs/promises';
import process from 'node:process';

import { checkRoleReport } from '../src/eval/role-report-contract.ts';
import { roleReportContracts } from '../src/eval/role-report-contracts.ts';

const [role, reportPath] = process.argv.slice(2);
const roles = Object.keys(roleReportContracts).join(', ');

if (!role || !reportPath) {
  console.error(`Usage: pnpm check:report <role> <report.md>\nRoles: ${roles}`);
  process.exit(2);
}

const contract = roleReportContracts[role];

if (!contract) {
  console.error(`No report contract for "${role}". Roles with one: ${roles}`);
  process.exit(2);
}

const report = await readFile(reportPath, 'utf8');
const result = checkRoleReport(report, contract);
const byId = new Map(contract.elements.map((element) => [element.id, element]));

console.log(`${contract.role} — ${reportPath}\n`);
console.log(`verdict: ${result.verdict ?? 'none issued'}`);

for (const id of result.satisfied) console.log(`  stated   ${id}`);
for (const id of result.missing) console.log(`  MISSING  ${id} — ${byId.get(id)?.requirement}`);

// Presence, not truth, and a miss can be this checker's wording rather than the
// report's omission — so it names what to say and exits zero either way. Wiring
// it to a non-zero exit would turn a prose heuristic into a merge blocker.
if (result.missing.length > 0 || result.verdict === null) {
  console.log('\nAdvisory: state the missing elements plainly, or say why they do not apply.');
}
