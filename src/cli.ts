import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { createCliAction } from './squad-skills-command.ts';

interface PackageMetadata {
  version: string;
}

const require = createRequire(import.meta.url);
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageMetadata = require(resolve(packageRoot, 'package.json')) as PackageMetadata;
const skillsPackagePath = require.resolve('skills/package.json');
const skillsCliPath = resolve(dirname(skillsPackagePath), 'bin/cli.mjs');
const action = createCliAction(process.argv.slice(2), packageRoot, packageMetadata.version);

if (action.kind === 'print') {
  console.log(action.message);
  process.exitCode = action.exitCode;
} else {
  const exitCode = await runSkillsCli(skillsCliPath, action.arguments);
  process.exitCode = exitCode;
}

function runSkillsCli(cliPath: string, arguments_: string[]): Promise<number> {
  return new Promise((resolveExitCode) => {
    const child = spawn(process.execPath, [cliPath, ...arguments_], {
      stdio: 'inherit',
    });

    child.once('error', (error) => {
      console.error(`Unable to start the Skills CLI: ${error.message}`);
      resolveExitCode(1);
    });

    child.once('exit', (code, signal) => {
      if (signal !== null) {
        console.error(`Skills CLI stopped by signal ${signal}.`);
        resolveExitCode(1);
        return;
      }

      resolveExitCode(code ?? 1);
    });
  });
}
