import path from 'node:path';
import { skillTaskTypes } from './skill-task-types.ts';
import { hashContent, measureSkillPayload } from './skill-payload-measurement.ts';
import { skillEvaluationCases } from './skill-evaluation-cases.ts';

/** Both roots use this harness's reading paths, never executable code from a snapshot. */
export async function createSkillPayloadReport(projectRoot: string) {
  const skills = await Promise.all(
    Object.entries(skillTaskTypes).map(async ([skill, taskTypes]) => {
      const measured = await measureSkillPayload({
        skillRoot: path.join(projectRoot, 'skills', skill),
        taskTypes,
      });
      return {
        skill,
        ...measured,
        maxDeclaredLoadedWords: Math.max(...measured.taskLoads.map((task) => task.loadedWords)),
      };
    })
  );
  const readingPaths = skills.flatMap(({ skill, taskLoads }) =>
    taskLoads.map(({ id, references }) => ({ skill, task: id, references }))
  );
  const workflows = skillEvaluationCases.map(({ id, loads }) => {
    const files = new Map<string, number>();
    let freshInvocationWords = 0;
    for (const load of loads) {
      const skill = skills.find((item) => item.skill === load.skill);
      const task = skill?.taskLoads.find((item) => item.id === load.task);
      if (!skill || !task)
        throw new Error(`${id}: unknown reading path ${load.skill}/${load.task}`);
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
  return {
    unit: 'whitespace-delimited words; not tokens or observed usage',
    scope:
      'Declared reading paths only; excludes runtime instructions, reasoning, repository and tool output.',
    readingPathsHash: hashContent(JSON.stringify(readingPaths)),
    skills,
    workflows,
  };
}

type PayloadReport = Awaited<ReturnType<typeof createSkillPayloadReport>>;

/** A routing-population change is not a content saving. Compare identical named paths only. */
export function compareSkillPayloadReports(baseline: PayloadReport, candidate: PayloadReport) {
  if (baseline.readingPathsHash !== candidate.readingPathsHash) {
    throw new Error('Reading paths differ; remeasure both catalogs with the same harness.');
  }
  return candidate.skills.map((skill) => {
    const before = baseline.skills.find((item) => item.skill === skill.skill)!;
    return {
      skill: skill.skill,
      baselinePayloadHash: before.payloadHash,
      candidatePayloadHash: skill.payloadHash,
      entrypointWordsDelta: skill.entrypointWords - before.entrypointWords,
      medianLoadedWordsDelta: skill.medianLoadedWords - before.medianLoadedWords,
      maxDeclaredLoadedWordsDelta: skill.maxDeclaredLoadedWords - before.maxDeclaredLoadedWords,
      taskLoads: skill.taskLoads.map((task) => {
        const previous = before.taskLoads.find((item) => item.id === task.id)!;
        return {
          id: task.id,
          references: task.references,
          baselineWords: previous.loadedWords,
          candidateWords: task.loadedWords,
          deltaWords: task.loadedWords - previous.loadedWords,
        };
      }),
    };
  });
}
