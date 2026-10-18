import path from 'node:path';
import { skillTaskTypes } from '../src/catalog/skill-task-types.ts';
import { measureSkillPayload } from '../src/catalog/skill-payload-measurement.ts';
import { skillEvaluationCases } from '../src/catalog/skill-evaluation-cases.ts';

const skills = await Promise.all(
  Object.entries(skillTaskTypes).map(async ([skill, taskTypes]) => {
    const measured = await measureSkillPayload({
      skillRoot: path.join(process.cwd(), 'skills', skill),
      taskTypes,
    });
    return {
      skill,
      ...measured,
      maxDeclaredLoadedWords: Math.max(...measured.taskLoads.map((task) => task.loadedWords)),
    };
  })
);
const workflows = skillEvaluationCases.map(({ id, loads }) => {
  const files = new Map<string, number>();
  let freshInvocationWords = 0;
  for (const load of loads) {
    const skill = skills.find((item) => item.skill === load.skill);
    const task = skill?.taskLoads.find((item) => item.id === load.task);
    if (!skill || !task) throw new Error(`${id}: unknown reading path ${load.skill}/${load.task}`);
    freshInvocationWords += task.loadedWords;
    files.set(`${load.skill}/SKILL.md`, skill.entrypointWords);
    for (const reference of task.references) {
      const words = skill.references.find((item) => item.file === reference)!.words;
      files.set(`${load.skill}/references/${reference}`, words);
    }
  }
  return {
    id,
    uniquePayloadWords: [...files.values()].reduce((sum, words) => sum + words, 0),
    freshInvocationWords,
  };
});
console.log(
  JSON.stringify(
    {
      unit: 'whitespace-delimited words; not tokens or observed usage',
      scope:
        'Declared reading paths only; excludes runtime instructions, reasoning, repository and tool output.',
      skills,
      workflows,
    },
    null,
    2
  )
);
