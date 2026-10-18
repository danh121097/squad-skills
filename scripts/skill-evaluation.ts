import { prepareSkillEvaluation, readEvaluationResults } from '../src/catalog/skill-evaluation.ts';
import { skillEvaluationCases } from '../src/catalog/skill-evaluation-cases.ts';

const [command, first, second] = process.argv.slice(2);
try {
  if (command === 'list') {
    console.log(skillEvaluationCases.map(({ id, prompt }) => `${id}: ${prompt}`).join('\n\n'));
  } else if (command === 'prepare' && first && second) {
    console.log(
      JSON.stringify(await prepareSkillEvaluation(process.cwd(), first, second), null, 2)
    );
  } else if (command === 'report' && first) {
    console.log(JSON.stringify(await readEvaluationResults(first), null, 2));
  } else {
    throw new Error(
      'Usage: pnpm eval:skills list | prepare <scenario> <new-directory> | report <results.json>'
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
