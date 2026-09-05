import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { validateSkills } from './skill-validator.ts';

export interface PackagePayloadValidationOptions {
  packagedProjectRoot: string;
  sourceProjectRoot: string;
}

/** Verifies authored skill payload parity and re-runs link checks after extraction. */
export async function validatePackagedSkillPayload(
  options: PackagePayloadValidationOptions
): Promise<string[]> {
  const sourceFiles = await listRegularFiles(options.sourceProjectRoot);
  const packagedFiles = await listRegularFiles(options.packagedProjectRoot);
  const errors: string[] = [];

  for (const file of sourceFiles) {
    if (!packagedFiles.includes(file)) {
      errors.push(`Extracted package is missing authored skill payload file: ${file}.`);
    }
  }

  for (const file of packagedFiles) {
    if (!sourceFiles.includes(file)) {
      errors.push(`Extracted package contains unexpected skill payload file: ${file}.`);
    }
  }

  for (const file of sourceFiles.filter((entry) => packagedFiles.includes(entry))) {
    const [source, packaged] = await Promise.all([
      readFile(path.join(options.sourceProjectRoot, file)),
      readFile(path.join(options.packagedProjectRoot, file)),
    ]);

    if (!source.equals(packaged)) {
      errors.push(`Extracted package file differs from the authored file: ${file}.`);
    }
  }

  const sourceValidation = await validateSkills(options.sourceProjectRoot);
  const packagedValidation = await validateSkills(options.packagedProjectRoot);

  errors.push(...sourceValidation.errors.map((error) => `Source payload: ${error}`));
  errors.push(...packagedValidation.errors.map((error) => `Extracted payload: ${error}`));

  return errors;
}

async function listRegularFiles(projectRoot: string): Promise<string[]> {
  const skillsRoot = path.join(projectRoot, 'skills');
  const files: string[] = [];

  const walk = async (directory: string): Promise<void> => {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) await walk(entryPath);
      else if (entry.isFile())
        files.push(path.relative(projectRoot, entryPath).split(path.sep).join('/'));
    }
  };

  await walk(skillsRoot);

  return files.sort();
}
