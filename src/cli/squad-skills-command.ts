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
  /** Reasoning effort to write into a generated Claude Code agent file, if any. */
  effort: string | null;
  force: boolean;
  /** Model to write into a generated Claude Code agent file, if any. */
  model: string | null;
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
// Per-machine preferences, never catalog content: this package ships to
// everyone, so a model name belongs in the invocation that writes one user's
// agent files and nowhere in `skills/`.
const modelFlags = ['--model'];
const effortFlags = ['--effort'];

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

  const malformed = findMalformedScalarOption(forwardedArguments);

  if (malformed !== null) {
    return {
      kind: 'print',
      message: `${malformed} needs a value.\n\n${createHelpText()}`,
      exitCode: 1,
    };
  }

  if (addCommands.has(command)) {
    const forwardable = dropPreferenceArguments(
      forwardedArguments.filter((argument) => argument !== noAgentsFlag)
    );

    return {
      kind: 'delegate',
      // Read from the full argument list, not the forwardable one: the flags
      // stripped below are exactly the ones the plan is built from.
      agentPlan: forwardedArguments.includes(noAgentsFlag)
        ? null
        : createAgentPlan(forwardedArguments),
      arguments: ['add', packageRoot, ...ensureCopyInstallation(forwardable)],
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
    effort: readScalarOption(arguments_, effortFlags),
    force: arguments_.includes('--force'),
    model: readScalarOption(arguments_, modelFlags),
    scope: arguments_.includes('--global') || arguments_.includes('-g') ? 'global' : 'project',
    skills: readListOption(arguments_, ['--skill', '-s'], []),
  };
}

/**
 * Single-value counterpart to `readListOption`. A value that looks like a flag
 * is not one: `--model --global` would otherwise write `model: --global` into
 * every generated agent file, which no reader would catch.
 */
function readScalarOption(arguments_: string[], flags: string[]): string | null {
  for (const [index, argument] of arguments_.entries()) {
    const inlineFlag = flags.find((flag) => argument.startsWith(`${flag}=`));

    if (inlineFlag !== undefined) {
      const value = argument.slice(inlineFlag.length + 1).trim();
      if (value.length > 0) return value;
      continue;
    }

    if (!flags.includes(argument)) continue;

    const value = arguments_[index + 1]?.trim() ?? '';
    if (value.length > 0 && !value.startsWith('-')) return value;
  }

  return null;
}

/** The flag a caller wrote with no usable value, so the run stops instead of guessing. */
function findMalformedScalarOption(arguments_: string[]): string | null {
  for (const flags of [modelFlags, effortFlags]) {
    const written = arguments_.some(
      (argument) =>
        flags.includes(argument) || flags.some((flag) => argument.startsWith(`${flag}=`))
    );

    if (written && readScalarOption(arguments_, flags) === null) return flags[0] as string;
  }

  return null;
}

/**
 * These flags are this CLI's own, so they are stripped before the rest is
 * forwarded to the Skills CLI, which would reject them as unknown. Position
 * decides, not value: `--skill opus --model opus` must lose only the second
 * `opus`, which a value-based filter cannot tell from the first.
 */
function dropPreferenceArguments(arguments_: string[]): string[] {
  const flags = [...modelFlags, ...effortFlags];

  return arguments_.filter((argument, index) => {
    if (flags.some((flag) => argument === flag || argument.startsWith(`${flag}=`))) return false;

    return !flags.includes(arguments_[index - 1] as string);
  });
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
  --model           Write this model into each Claude Code agent file
  --effort          Write this reasoning effort into each Claude Code agent file

Examples:
  squad-skills list
  squad-skills add --skill squads-team
  squad-skills add --skill squad-frontend --global --agent codex
  squad-skills agents --global
  squad-skills agents --global --agent claude-code --model opus --effort medium

Claude Code reads an agent from .claude/agents/<name>.md. Codex reads one from
.codex/agents/<name>.toml and loads it only once config.toml names it, so this
CLI registers it there and backs the file up first. Codex agents are written at
global scope only, and carry no model field: Codex takes a subagent default from
[agents] default_subagent_model in config.toml instead.

--model and --effort are machine preferences, not catalog content. They are
written only where the caller asks for them, so a reinstall keeps them.

All other options after add or list are forwarded to the Skills CLI.`;
}
