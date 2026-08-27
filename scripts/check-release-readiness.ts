import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

interface PackageMetadata {
  bin?: Record<string, string>;
  bugs?: { url?: string };
  dependencies?: Record<string, string>;
  files?: string[];
  homepage?: string;
  name?: string;
  private?: boolean;
  publishConfig?: { access?: string };
  repository?: { type?: string; url?: string };
  version?: string;
}

const expectedSource = 'danh121097/squad-skills';
const expectedRepositoryUrl = `git+https://github.com/${expectedSource}.git`;
const errors: string[] = [];

const packageMetadata = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8')
) as PackageMetadata;
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');

if (packageMetadata.name !== 'squad-skills') {
  errors.push('package.json name must remain "squad-skills".');
}

if (packageMetadata.private === true) {
  errors.push('package.json must be publishable and cannot set private: true.');
}

if (packageMetadata.repository?.url !== expectedRepositoryUrl) {
  errors.push(`package.json repository must target ${expectedRepositoryUrl}.`);
}

if (packageMetadata.homepage !== `https://github.com/${expectedSource}#readme`) {
  errors.push('package.json homepage must target the public GitHub README.');
}

if (packageMetadata.bugs?.url !== `https://github.com/${expectedSource}/issues`) {
  errors.push('package.json bugs URL must target the public GitHub issue tracker.');
}

if (packageMetadata.bin?.['squad-skills'] !== './bin/cli.mjs') {
  errors.push('package.json must expose squad-skills through ./bin/cli.mjs.');
}

const expectedFiles = ['dist', 'bin', 'skills', 'README.md'];
if (JSON.stringify(packageMetadata.files) !== JSON.stringify(expectedFiles)) {
  errors.push(`package.json files must be ${expectedFiles.join(', ')}.`);
}

if (packageMetadata.publishConfig?.access !== 'public') {
  errors.push('package.json publishConfig.access must be "public".');
}

if (packageMetadata.dependencies?.skills === undefined) {
  errors.push('The Skills CLI must remain a runtime dependency.');
}

if (!readme.includes(`npx skills add ${expectedSource}`)) {
  errors.push(`README.md must document npx skills add ${expectedSource}.`);
}

if (!readme.includes('npx squad-skills add')) {
  errors.push('README.md must document the npm package CLI.');
}

if (!readme.includes(`https://skills.sh/b/${expectedSource}`)) {
  errors.push('README.md must include the skills.sh badge for the public source.');
}

for (const artifact of ['../bin/cli.mjs', '../dist/cli/cli.mjs']) {
  try {
    await access(new URL(artifact, import.meta.url));
  } catch {
    errors.push(`${artifact.replace('../', '')} must exist before packaging.`);
  }
}

// Existence is not enough: the bin entry resolves the package root by walking
// up from its own location, so a moved bundle can exist and still fail to boot.
const binPath = fileURLToPath(new URL('../bin/cli.mjs', import.meta.url));

try {
  const { stdout } = await promisify(execFile)(process.execPath, [binPath, '--version']);

  if (stdout.trim() !== packageMetadata.version) {
    errors.push(
      `bin/cli.mjs reported version ${stdout.trim() || '(nothing)'} but package.json declares ${packageMetadata.version}.`
    );
  }
} catch (error) {
  errors.push(`bin/cli.mjs failed to run: ${(error as Error).message.split('\n')[0]}`);
}

if (errors.length > 0) {
  console.error('Release-readiness check failed:\n');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Release metadata is ready for GitHub and the public squad-skills npm package.`);
