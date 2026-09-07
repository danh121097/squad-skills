/**
 * Maps `squad-skills` argv to one action: delegate to the official `skills`
 * runtime, generate agent definitions, or print. Nothing here reimplements
 * discovery or installation.
 *
 * A delegated installation forces `--copy`, because a symlinked install into an
 * `npx` package cache stops resolving as soon as that cache is cleaned.
 *
 * An install also carries an agent plan. The Skills CLI installs skills and has
 * no concept of an agent definition, so generating one is this CLI's own step,
 * and it can only happen on the npm path — a `npx skills add` of the GitHub
 * source never runs this code, which is what `squad-skills agents` is for.
 */
import type { AgentScope } from '../agents/agent-installation.ts';

export interface AgentPlan {
  agents: string[];
  force: boolean;
  scope: AgentScope;
  skills: string[];
}

export type CliAction =
  | { kind: 'delegate'; arguments: string[]; agentPlan: AgentPlan | null }
  | { kind: 'install-agents'; agentPlan: AgentPlan }
  | { kind: 'print'; message: string; exitCode: number };

/** The tools whose agent-definition layout this CLI writes. */
export const supportedAgentTools = ['claude-code', 'codex'];

const helpFlags = new Set(['--help', '-h']);
const versionFlags = new Set(['--version', '-v']);
const addCommands = new Set(['add', 'install', 'i']);
const noAgentsFlag = '--no-agents';

export function createCliAction(
  arguments_: string[],
  packageRoot: string,
  version: string
): CliAction {
  const [command, ...forwardedArguments] = arguments_;

  if (command === undefined || helpFlags.has(command)) {
    return { kind: 'print', message: createHelpText(), exitCode: 0 };
  }

  if (versionFlags.has(command)) {
    return { kind: 'print', message: version, exitCode: 0 };
  }

  if (addCommands.has(command)) {
    const withoutAgentFlags = forwardedArguments.filter((argument) => argument !== noAgentsFlag);

    return {
      kind: 'delegate',
      agentPlan: forwardedArguments.includes(noAgentsFlag)
        ? null
        : createAgentPlan(withoutAgentFlags),
      arguments: ['add', packageRoot, ...ensureCopyInstallation(withoutAgentFlags)],
    };
  }

  if (command === 'agents') {
    return { kind: 'install-agents', agentPlan: createAgentPlan(forwardedArguments) };
  }

  if (command === 'list' || command === 'ls') {
    return {
      kind: 'delegate',
      agentPlan: null,
      arguments: ['add', packageRoot, '--list', ...forwardedArguments],
    };
  }

  return {
    kind: 'print',
    message: `Unknown command: ${command}\n\n${createHelpText()}`,
    exitCode: 1,
  };
}

/**
 * Reads the same flags the Skills CLI reads, without consuming them. An
 * unspecified `--agent` means both supported tools: the installer writes an
 * agent only where it can see the matching skill, so guessing wide is caught by
 * that check rather than by producing a definition pointing at nothing.
 */
export function createAgentPlan(arguments_: string[]): AgentPlan {
  return {
    agents: readListOption(arguments_, ['--agent', '-a'], supportedAgentTools),
    force: arguments_.includes('--force'),
    scope: arguments_.includes('--global') || arguments_.includes('-g') ? 'global' : 'project',
    skills: readListOption(arguments_, ['--skill', '-s'], []),
  };
}

function readListOption(arguments_: string[], flags: string[], wildcard: string[]): string[] {
  const values: string[] = [];

  for (const [index, argument] of arguments_.entries()) {
    const inlineFlag = flags.find((flag) => argument.startsWith(`${flag}=`));

    if (inlineFlag !== undefined) values.push(argument.slice(inlineFlag.length + 1));
    else if (flags.includes(argument)) values.push(arguments_[index + 1] ?? '');
  }

  const parsed = values
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return parsed.includes('*') || parsed.length === 0 ? wildcard : parsed;
}

function ensureCopyInstallation(arguments_: string[]): string[] {
  if (arguments_.includes('--copy')) return arguments_;
  return [...arguments_, '--copy'];
}

function createHelpText(): string {
  return `Squad Skills

Install role-specialized engineering skills through the Skills CLI.

Usage:
  squad-skills add [skills options]
  squad-skills list [skills options]
  squad-skills agents [options]

Commands:
  add, install, i   Install skills from this package, then generate an agent
                    definition for each installed skill
  list, ls          List the packaged skills
  agents            Generate agent definitions for skills already installed,
                    for a catalog installed through \`npx skills add\`

Agent options:
  --no-agents       Install skills only (add)
  --force           Replace an agent file this CLI did not generate
  --global, -g      Read and write the user-level location
  --agent, -a       Limit to ${supportedAgentTools.join(', ')}
  --skill, -s       Limit to named skills

Examples:
  squad-skills list
  squad-skills add --skill squads-team
  squad-skills add --skill squad-frontend --global --agent codex
  squad-skills agents --global

Claude Code reads an agent from .claude/agents/<name>.md. Codex reads one from
.codex/agents/<name>.toml and loads it only once config.toml names it, so this
CLI registers it there and backs the file up first. Codex agents are written at
global scope only.

All other options after add or list are forwarded to the Skills CLI.`;
}
