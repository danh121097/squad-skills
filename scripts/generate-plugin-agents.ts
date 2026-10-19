import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { renderThreadHandoff } from '../src/agents/thread-handoff.ts';

import {
  workerModelReferences,
  renderWorkerModels,
  renderWorkerDispatch,
} from '../src/agents/worker-models.ts';
import {
  readSkillAgentDefinition,
  renderPluginAgentFile,
} from '../src/agents/skill-agent-definition.ts';

const skillsRoot = path.join(process.cwd(), 'skills');
const agentsRoot = path.join(process.cwd(), 'agents');

for (const entry of await readdir(skillsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const source = await readFile(path.join(skillsRoot, entry.name, 'SKILL.md'), 'utf8');
  const definition = readSkillAgentDefinition(source);

  if (definition === null) {
    console.error(`skills/${entry.name}/SKILL.md has unreadable frontmatter`);
    process.exit(1);
  }

  await writeFile(path.join(agentsRoot, `${entry.name}.md`), renderPluginAgentFile(definition));
}

for (const reference of workerModelReferences) {
  await writeFile(
    path.join(process.cwd(), path.dirname(reference), 'thread-handoff.md'),
    renderThreadHandoff()
  );
  await writeFile(path.join(process.cwd(), reference), renderWorkerModels());
  for (const tool of ['codex', 'claude-code'] as const) {
    const runtime = tool === 'codex' ? 'codex' : 'claude';
    await writeFile(
      path.join(process.cwd(), path.dirname(reference), `${runtime}-worker-dispatch.md`),
      renderWorkerDispatch(tool)
    );
  }
}
