import path from 'node:path';
import { parseArgs } from 'node:util';
import {
  createSkillPayloadReport,
  compareSkillPayloadReports,
} from '../src/catalog/skill-payload-report.ts';

try {
  const { values } = parseArgs({
    options: { root: { type: 'string' }, 'baseline-root': { type: 'string' } },
  });
  const report = await createSkillPayloadReport(path.resolve(values.root ?? process.cwd()));
  const baselineRoot = values['baseline-root'];
  const comparison =
    baselineRoot === undefined
      ? undefined
      : {
          baselineRoot: path.resolve(baselineRoot),
          skills: compareSkillPayloadReports(
            await createSkillPayloadReport(path.resolve(baselineRoot)),
            report
          ),
        };
  console.log(JSON.stringify({ ...report, ...(comparison ? { comparison } : {}) }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
