import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

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
