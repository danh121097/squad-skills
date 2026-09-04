/**
 * Maps `squad-skills` argv to one action: delegate to the official `skills`
 * runtime, or print. Nothing here reimplements discovery or installation.
 *
 * A delegated installation forces `--copy`, because a symlinked install into an
 * `npx` package cache stops resolving as soon as that cache is cleaned.
 */
export type CliAction =
  { kind: 'delegate'; arguments: string[] } | { kind: 'print'; message: string; exitCode: number };

const helpFlags = new Set(['--help', '-h']);
const versionFlags = new Set(['--version', '-v']);
const addCommands = new Set(['add', 'install', 'i']);

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
    return {
      kind: 'delegate',
      arguments: ['add', packageRoot, ...ensureCopyInstallation(forwardedArguments)],
    };
  }

  if (command === 'list' || command === 'ls') {
    return {
      kind: 'delegate',
      arguments: ['add', packageRoot, '--list', ...forwardedArguments],
    };
  }

  return {
    kind: 'print',
    message: `Unknown command: ${command}\n\n${createHelpText()}`,
    exitCode: 1,
  };
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

Commands:
  add, install, i   Install skills from this package
  list, ls          List the packaged skills

Examples:
  squad-skills list
  squad-skills add --skill squads-team
  squad-skills add --skill squad-frontend --global --agent codex

All options after add or list are forwarded to the Skills CLI.`;
}
