import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { installAgentDefinitions } from '../agents/agent-installation.ts';
import type { AgentPlan } from './squad-skills-command.ts';
import { createCliAction } from './squad-skills-command.ts';

interface PackageMetadata {
  version: string;
}

const require = createRequire(import.meta.url);
// This file sits two levels below the package root in both layouts: source
// at src/cli/cli.ts, bundled at dist/cli/cli.mjs.
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const packageMetadata = require(resolve(packageRoot, 'package.json')) as PackageMetadata;
const skillsPackagePath = require.resolve('skills/package.json');
const skillsCliPath = resolve(dirname(skillsPackagePath), 'bin/cli.mjs');
const action = createCliAction(process.argv.slice(2), packageRoot, packageMetadata.version);

if (action.kind === 'print') {
  console.log(action.message);
  process.exitCode = action.exitCode;
} else if (action.kind === 'install-agents') {
  await writeAgentDefinitions(action.agentPlan);
} else {
  const exitCode = await runSkillsCli(skillsCliPath, action.arguments);
  process.exitCode = exitCode;

  // Agent definitions point at the skills the delegated install just wrote, so
  // a failed install leaves them alone rather than pointing at nothing.
  if (exitCode === 0 && action.agentPlan !== null) {
    await writeAgentDefinitions(action.agentPlan);
  }
}

async function writeAgentDefinitions(agentPlan: AgentPlan): Promise<void> {
  const result = await installAgentDefinitions({
    ...agentPlan,
    homeDirectory: homedir(),
    packageRoot,
    projectRoot: process.cwd(),
  });

  for (const message of result.messages) console.log(message);

  console.log(
    result.written.length === 0
      ? 'No agent definitions written.'
      : `Wrote ${result.written.length} agent definition(s).`
  );
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
