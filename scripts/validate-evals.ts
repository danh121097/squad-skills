import { readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { validateKnowledgeCards } from '../src/eval/knowledge-card-validator.ts';

/**
 * Validates the reviewed knowledge cards under `evals/<skill>/knowledge/`.
 *
 * The cards are research with provenance, not evaluation configuration: each
 * one abstracts a published rule, names its source and records when that
 * source was last verified. This check keeps them well-formed and unexpired
 * offline; `pnpm evals:links` separately reports a source that has moved.
 */
const projectRoot = process.cwd();
const evalsRoot = 'evals';
const errors: string[] = [];
const notes: string[] = [];

let entries;

try {
  entries = await readdir(path.join(projectRoot, evalsRoot), { withFileTypes: true });
} catch {
  console.log(`- ${evalsRoot}/: no evaluation directory found.`);
  process.exit(0);
}

const skillDirectories = entries
  .filter((entry) => entry.isDirectory() && entry.name !== 'fixtures')
  .map((entry) => entry.name)
  .sort();

for (const directory of skillDirectories) {
  await validateKnowledgeCards({
    cardsDirectory: path.posix.join(evalsRoot, directory, 'knowledge'),
    errors,
    notes,
    projectRoot,
  });
}

for (const note of notes) console.log(`- ${note}`);

if (errors.length > 0) {
  console.error('\nKnowledge card validation failed:\n');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Knowledge cards are consistent with the working tree.');
