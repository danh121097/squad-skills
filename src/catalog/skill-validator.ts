import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { parseDocument } from 'yaml';

import { validateMarkdownLinks } from './markdown-link-validator.ts';

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

  const value: unknown = document.toJS();

  if (!isRecord(value)) {
    errors.push(`${relative(projectRoot, skillFile)}: frontmatter must be a YAML mapping.`);
    return null;
  }

  const name = value.name;
  const description = value.description;

  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.push(`${relative(projectRoot, skillFile)}: missing non-empty "name".`);
  }

  if (typeof description !== 'string' || description.trim().length === 0) {
    errors.push(`${relative(projectRoot, skillFile)}: missing non-empty "description".`);
  }

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function relative(projectRoot: string, filePath: string): string {
  return path.relative(projectRoot, filePath);
}
