import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { parseDocument } from 'yaml';

import { validateMarkdownLinks } from './markdown-link-validator.ts';
import { validateSkillEntrypointStructure } from './skill-entrypoint-structure.ts';

export interface SkillValidationResult {
  errors: string[];
  skillNames: string[];
}

interface SkillMetadata {
  description: string;
  name: string;
}

const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const skillNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function validateSkills(projectRoot: string): Promise<SkillValidationResult> {
  const skillsRoot = path.join(projectRoot, 'skills');
  const errors: string[] = [];
  const skillNames = new Set<string>();
  const skillDirectories = await findSkillDirectories(skillsRoot, projectRoot, errors);

  for (const directory of skillDirectories) {
    const skillRoot = path.join(skillsRoot, directory);
    const skillFile = path.join(skillRoot, 'SKILL.md');
    let source: string;

    try {
      source = await readFile(skillFile, 'utf8');
    } catch {
      errors.push(`${relative(projectRoot, skillFile)}: SKILL.md is missing.`);
      continue;
    }

    const metadata = parseSkillMetadata(source, skillFile, projectRoot, errors);

    if (metadata) {
      validateMetadata(metadata, directory, skillFile, projectRoot, skillNames, errors);
      errors.push(
        ...validateSkillEntrypointStructure(source, metadata.name, relative(projectRoot, skillFile))
      );
    }

    await validateMarkdownLinks(skillRoot, projectRoot, errors);
  }

  return {
    errors,
    skillNames: [...skillNames].sort(),
  };
}

async function findSkillDirectories(
  skillsRoot: string,
  projectRoot: string,
  errors: string[]
): Promise<string[]> {
  let entries;

  try {
    entries = await readdir(skillsRoot, { withFileTypes: true });
  } catch {
    errors.push(`${relative(projectRoot, skillsRoot)}: skills directory is missing.`);
    return [];
  }

  const directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

  if (directories.length === 0) {
    errors.push(`${relative(projectRoot, skillsRoot)}: no skill directories found.`);
  }

  return directories.sort();
}

function parseSkillMetadata(
  source: string,
  skillFile: string,
  projectRoot: string,
  errors: string[]
): SkillMetadata | null {
  const frontmatter = source.match(frontmatterPattern)?.[1];

  if (!frontmatter) {
    errors.push(`${relative(projectRoot, skillFile)}: missing YAML frontmatter.`);
    return null;
  }

  const document = parseDocument(frontmatter);

  if (document.errors.length > 0) {
    for (const error of document.errors) {
      errors.push(
        `${relative(projectRoot, skillFile)}: invalid YAML: ${error.message.split('\n')[0]}`
      );
    }
    return null;
  }

  // Preserve YAML key types: object conversion would turn numeric metadata keys into strings.
  const value: unknown = document.toJS({ mapAsMap: true });

  if (!(value instanceof Map)) {
    errors.push(`${relative(projectRoot, skillFile)}: frontmatter must be a YAML mapping.`);
    return null;
  }

  const fields: Map<unknown, unknown> = value;
  const skillPath = relative(projectRoot, skillFile);
  for (const [field, limit] of [
    ['name', 64],
    ['description', 1024],
    ['compatibility', 500],
  ] as const) {
    if (field === 'compatibility' && !fields.has(field)) continue;
    const content = fields.get(field);
    if (typeof content !== 'string' || content.trim().length === 0) {
      const problem =
        field === 'compatibility'
          ? '"compatibility" must be a non-empty string'
          : `missing non-empty "${field}"`;
      errors.push(`${skillPath}: ${problem}.`);
    } else if ([...(field === 'name' ? content.trim() : content)].length > limit) {
      errors.push(`${skillPath}: "${field}" must be at most ${limit} characters.`);
    }
  }

  if (fields.has('metadata')) {
    const metadata = fields.get('metadata');
    if (
      !(metadata instanceof Map) ||
      [...metadata].some(([key, entry]) => typeof key !== 'string' || typeof entry !== 'string')
    ) {
      errors.push(`${skillPath}: "metadata" must be a mapping of string keys to string values.`);
    }
  }

  const name = fields.get('name');
  const description = fields.get('description');
  if (
    typeof name !== 'string' ||
    name.trim().length === 0 ||
    typeof description !== 'string' ||
    description.trim().length === 0
  ) {
    return null;
  }

  return {
    description: description.trim(),
    name: name.trim(),
  };
}

function validateMetadata(
  metadata: SkillMetadata,
  directory: string,
  skillFile: string,
  projectRoot: string,
  skillNames: Set<string>,
  errors: string[]
): void {
  const skillPath = relative(projectRoot, skillFile);

  if (!skillNamePattern.test(metadata.name)) {
    errors.push(`${skillPath}: name "${metadata.name}" must use lowercase kebab-case.`);
  }

  if (metadata.name !== directory) {
    errors.push(`${skillPath}: name "${metadata.name}" must match folder "${directory}".`);
  }

  if (skillNames.has(metadata.name)) {
    errors.push(`${skillPath}: duplicate skill name "${metadata.name}".`);
  }

  skillNames.add(metadata.name);
}

function relative(projectRoot: string, filePath: string): string {
  return path.relative(projectRoot, filePath);
}
