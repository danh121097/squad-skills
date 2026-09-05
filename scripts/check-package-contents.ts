import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { validatePackagedSkillPayload } from '../src/catalog/package-payload-validator.ts';

interface PackResult {
  filename: string;
  files: Array<{ path: string }>;
  name: string;
  version: string;
}

const execFileAsync = promisify(execFile);
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'squad-skills-pack-'));
const extractionDirectory = join(temporaryDirectory, 'extracted');
const sourceSkillNames = (await readdir(resolve(projectRoot, 'skills'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

try {
  const { stdout } = await execFileAsync(
    'pnpm',
    ['pack', '--json', '--pack-destination', temporaryDirectory],
    { cwd: projectRoot, maxBuffer: 10 * 1024 * 1024 }
  );
  const packResult = JSON.parse(stdout) as PackResult;
  const paths = packResult.files.map((file) => file.path);
  const requiredPaths = ['LICENSE', 'bin/cli.mjs', 'dist/cli/cli.mjs', 'package.json', 'README.md'];
  const unexpectedPaths = paths.filter(
    (path) =>
      !requiredPaths.includes(path) && path !== 'dist/cli/cli.d.mts' && !path.startsWith('skills/')
  );
  const packagedSkillNames = paths
    .map((path) => path.match(/^skills\/([^/]+)\/SKILL\.md$/)?.[1])
    .filter((name): name is string => name !== undefined)
    .sort();

  if (requiredPaths.some((path) => !paths.includes(path))) {
    throw new Error('The package is missing a required CLI or metadata file.');
  }

  if (unexpectedPaths.length > 0) {
    throw new Error(`Unexpected package files: ${unexpectedPaths.join(', ')}`);
  }

  if (JSON.stringify(packagedSkillNames) !== JSON.stringify(sourceSkillNames)) {
    throw new Error(
      `Packaged skills do not match the source catalog: ${packagedSkillNames.join(', ')}.`
    );
  }

  await mkdir(extractionDirectory, { recursive: true });
  const archive = resolve(temporaryDirectory, packResult.filename);
  await execFileAsync('tar', ['-xzf', archive, '-C', extractionDirectory]);
  const payloadErrors = await validatePackagedSkillPayload({
    packagedProjectRoot: join(extractionDirectory, 'package'),
    sourceProjectRoot: projectRoot,
  });

  if (payloadErrors.length > 0) {
    throw new Error(`Packaged skill payload mismatch:\n- ${payloadErrors.join('\n- ')}`);
  }

  console.log(
    `Verified ${packResult.name}@${packResult.version}: ${paths.length} package files and ${packagedSkillNames.length} skills.`
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
