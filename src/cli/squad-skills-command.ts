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
import { defaultEffortByRole, parseEffortOverrides } from '../agents/role-effort-defaults.ts';

/** The two flags this CLI owns, read once and carried rather than re-scanned. */
type AgentPreferences = Pick<AgentPlan, 'effort' | 'model' | 'roleEfforts'>;

export interface AgentPlan {
  agents: string[];
  /** Reasoning effort for every Claude Code agent file, over the catalog default. */
  effort: string | null;
  force: boolean;
  /** Model to write into a generated Claude Code agent file, if any. */
  model: string | null;
  /** Reasoning effort for named roles, over both `effort` and the catalog default. */
  roleEfforts: Record<string, string>;
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
const everyFlag = '--all';
const listOptionFlags = ['--agent', '-a', '--skill', '-s'];
// A model is a per-machine preference, never catalog content: this package
// ships to everyone, so a model name belongs in the invocation that writes one
// user's agent files and nowhere in `skills/`. Effort has catalog defaults in
// `role-effort-defaults.ts`, and this flag overrides them.
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

  // The one vector every later reader builds from. Both flags this CLI owns come
  // out here, before anything reads a value run: each starts with `-`, so
  // removing one joins the runs on either side of it, and a run only reaches
  // its true extent once they are gone. `--skill squad-qa --model x a,-b` is
  // the case: `-b` is not in the filter's run until `--model x` leaves, and a
  // reader that never sees the joined form never refuses it. Dropping
  // `--no-agents` after the rewrite instead rejoins runs the rewrite has split.
  const strippedArguments = dropPreferenceArguments(
    forwardedArguments.filter((argument) => argument !== noAgentsFlag)
  );
  // Preferences are read from the caller's own arguments because `stripped` no
  // longer carries them.
  const preferences = readPreferences(forwardedArguments);
  // Both vectors get asked, because each catches what the other cannot. The
  // caller's own arguments hold flags left with no value at all — `--agent
  // --no-agents squad-qa` names no agent, however adjacent stripping makes it
  // look. The stripped vector holds values that only become values once the
  // preference flags between them are gone.
  const malformed =
    findMalformedScalarOption(forwardedArguments) ??
    findValuelessListOption(forwardedArguments) ??
    findValuelessListOption(strippedArguments);

  if (malformed !== null) {
    return {
      kind: 'print',
      message: `${malformed} needs a value.\n\n${createHelpText()}`,
      exitCode: 1,
    };
  }

  if (preferences.kind === 'error') {
    return {
      kind: 'print',
      message: `${preferences.message}\n\n${createHelpText()}`,
      exitCode: 1,
    };
  }

  if (addCommands.has(command)) {
    const canonical = expandEveryFlag(normalizeListOptions(strippedArguments));

    return {
      kind: 'delegate',
      agentPlan: forwardedArguments.includes(noAgentsFlag)
        ? null
        : createAgentPlan(canonical, preferences),
      arguments: ['add', packageRoot, ...ensureCopyInstallation(canonical)],
    };
  }

  if (command === 'agents') {
    return {
      kind: 'install-agents',
      agentPlan: createAgentPlan(normalizeListOptions(strippedArguments), preferences),
    };
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
 * Read from the caller's own arguments, because `dropPreferenceArguments`
 * strips these two flags before anything else sees them. Passing them into the plan
 * keeps that stripping unconditional: no vector has to stay readable by two
 * consumers that disagree about whether the preference flags are still in it.
 */
function readPreferences(
  arguments_: string[]
): ({ kind: 'ok' } & AgentPreferences) | { kind: 'error'; message: string } {
  const effort = parseEffortOverrides(
    readRepeatedOption(arguments_, effortFlags).flatMap((value) =>
      value.split(',').map((part) => part.trim())
    )
  );

  if (effort.kind === 'error') return effort;

  return {
    kind: 'ok',
    effort: effort.effort,
    model: readScalarOption(arguments_, modelFlags),
    roleEfforts: effort.roleEfforts,
  };
}

/**
 * Reads the same flags the Skills CLI reads, without consuming them. An
 * unspecified `--agent` means both supported tools: the installer writes an
 * agent only where it can see the matching skill, so guessing wide is caught by
 * that check rather than by producing a definition pointing at nothing.
 */
function createAgentPlan(arguments_: string[], preferences: AgentPreferences): AgentPlan {
  return {
    agents: readListOption(arguments_, ['--agent', '-a'], supportedAgentTools),
    effort: preferences.effort,
    force: arguments_.includes('--force'),
    model: preferences.model,
    roleEfforts: preferences.roleEfforts,
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

/**
 * Every value a repeatable flag carries, one per occurrence, with null in place
 * of an occurrence that has no usable value. `--effort` is the one repeatable
 * scalar: each occurrence names a level for every role or for one role.
 */
function readOptionOccurrences(arguments_: string[], flags: string[]): (string | null)[] {
  const occurrences: (string | null)[] = [];

  for (const [index, argument] of arguments_.entries()) {
    const inlineFlag = flags.find((flag) => argument.startsWith(`${flag}=`));

    if (inlineFlag !== undefined) {
      const value = argument.slice(inlineFlag.length + 1).trim();
      occurrences.push(value.length > 0 ? value : null);
      continue;
    }

    if (!flags.includes(argument)) continue;

    const value = arguments_[index + 1]?.trim() ?? '';
    occurrences.push(value.length > 0 && !value.startsWith('-') ? value : null);
  }

  return occurrences;
}

function readRepeatedOption(arguments_: string[], flags: string[]): string[] {
  return readOptionOccurrences(arguments_, flags).filter((value) => value !== null);
}

/**
 * The flag a caller wrote with no usable value, so the run stops instead of
 * guessing. For `--effort` that is any occurrence, and any comma-separated part
 * of one, left empty: `--effort high --effort=` reads as a slip, not as `high`.
 */
function findMalformedScalarOption(arguments_: string[]): string | null {
  const modelWritten = arguments_.some(
    (argument) =>
      modelFlags.includes(argument) || modelFlags.some((flag) => argument.startsWith(`${flag}=`))
  );

  if (modelWritten && readScalarOption(arguments_, modelFlags) === null) {
    return modelFlags[0] as string;
  }

  const effortMalformed = readOptionOccurrences(arguments_, effortFlags).some(
    (value) => value === null || value.split(',').some((part) => part.trim() === '')
  );

  return effortMalformed ? (effortFlags[0] as string) : null;
}

/**
 * A list flag carrying no usable value is refused rather than normalized away.
 * Left in, it reaches two readers that disagree: `readListOption` takes the next
 * token whatever it is, and the Skills CLI consumes a whole run of them, so a
 * bare `--agent` silently turns the following flag into an agent name and
 * installs a skill with no agent definition. `--model` and `--effort` are
 * already refused this way, and a filter the caller wrote but left empty is the
 * same mistake.
 *
 * A flag-shaped value is refused everywhere the same run can carry one, which
 * is why this reads through `readListOptionRun` rather than testing the token
 * after the flag. No skill or agent is named with a leading `-`, and letting one
 * through leaves `normalizeListOptions` emitting a flag with no value after it
 * — output this same function rejects — which upstream then reads as an empty
 * agent list, the widen-to-every-tool path `--all` was fixed to close.
 */
function findValuelessListOption(arguments_: string[]): string | null {
  for (const [index, argument] of arguments_.entries()) {
    const flag = findListOptionFlag(argument);

    if (flag === null) continue;

    const { consumed, end, values } = readListOptionRun(arguments_, index, flag);

    // The two knobs part here. What the run *consumes* has to match upstream
    // exactly, or a token this CLI declined survives into the forwarded vector
    // and upstream reads it there as a value. What the refusal *rejects* is
    // under no such constraint, because a refusal builds no vector at all — so
    // it rejects tokens the run was obliged to take.
    //
    // A token naming nothing is one of them. `--skill "$VAR" squad-fix` with
    // `VAR=" "`, and the `,` and `, ` spellings of the same mistake, all read
    // `squad-fix` as the filter otherwise — the guess this fix exists to stop.
    if (consumed.some((value) => value.split(',').every((part) => part.trim() === ''))) {
      return flag;
    }

    // A run that stopped at an empty token is the same mistake one token later.
    // Left in, `--skill a "" b` drops `b` in silence while `--skill "" b` is
    // refused: one token meaning one thing, answered two ways.
    if (arguments_[end + 1] === '') return flag;

    if (values.length === 0 || values.some((value) => value.startsWith('-'))) return flag;
  }

  return null;
}

/** The list flag a token writes, in either the bare or the inline form. */
function findListOptionFlag(argument: string): string | null {
  return (
    listOptionFlags.find(
      (candidate) => argument === candidate || argument.startsWith(`${candidate}=`)
    ) ?? null
  );
}

/**
 * Every value one list option carries, read once for both the refusal and the
 * rewrite: the inline value if there is one, then the run of following tokens up
 * to the next flag, split on commas. Upstream consumes that same run, so a
 * caller may have written `--agent claude-code codex`, and an inline value takes
 * the run with it rather than leaving `codex` for a second reader.
 *
 * Both callers read through here because reading it two ways is the defect this
 * file keeps producing: a refusal that checked only the first token of the run
 * let `--skill squad-qa squad-fix,-x` through to a rewrite that consumed all of
 * it, emitting a flag with no value after it. `end` is the last index consumed,
 * so the rewrite can skip what it has already read.
 */
function readListOptionRun(
  arguments_: string[],
  index: number,
  flag: string
): { consumed: string[]; end: number; values: string[] } {
  const consumed: string[] = [];
  const argument = arguments_[index] as string;

  if (argument.startsWith(`${flag}=`)) consumed.push(argument.slice(flag.length + 1));

  let end = index;

  // Upstream stops this run at a falsy token as well as at a flag
  // (`while (i < args.length && nextArg && !nextArg.startsWith('-'))`), so an
  // empty token ends the run rather than being trimmed away inside it. Walking
  // past one would read `--skill "$VAR" squad-fix` with `VAR` unset as a filter
  // naming `squad-fix` — the guess the inline `--skill=` form is refused for.
  // Stopping anywhere upstream does not, whitespace included, is just as wrong:
  // the token then survives into the forwarded vector, where upstream reads it
  // as a value this reader already declined.
  while (end + 1 < arguments_.length) {
    const next = arguments_[end + 1] as string;

    if (next === '' || next.startsWith('-')) break;

    end += 1;
    consumed.push(next);
  }

  return {
    consumed,
    end,
    values: consumed
      .flatMap((value) => value.split(','))
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
  };
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

/**
 * Reads a normalized vector only. `normalizeListOptions` runs on every path
 * that reaches here, so the `--flag=value` form is already gone and this handles
 * the bare form alone.
 */
function readListOption(arguments_: string[], flags: string[], wildcard: string[]): string[] {
  const parsed: string[] = [];

  for (const [index, argument] of arguments_.entries()) {
    // The third reader of a value run, and so the third chance for one to drift.
    // It reads through `readListOptionRun` for that reason: stopping only at a
    // flag would take the stray blank a run already ended at, and the plan would
    // name a skill the install does not.
    if (flags.includes(argument))
      parsed.push(...readListOptionRun(arguments_, index, argument).values);
  }

  return parsed.includes('*') || parsed.length === 0 ? wildcard : parsed;
}

/**
 * Expands `--all` here rather than letting the Skills CLI do it. There it is
 * shorthand for `--skill '*' --agent '*' -y`, and the `--agent '*'` half
 * silently overrides an explicit `--agent` the caller passed in the same
 * command: `add --all --agent codex` installs to every tool on the machine and
 * reports the failures of tools the caller never named. Expanding it locally
 * fills in only the halves the caller left out, so an explicit filter wins and
 * a bare `--all` behaves exactly as before.
 */
function expandEveryFlag(arguments_: string[]): string[] {
  if (!arguments_.includes(everyFlag)) return arguments_;

  const expansion = ['-y'];

  if (!hasOption(arguments_, ['--skill', '-s'])) expansion.unshift('--skill', '*');
  if (!hasOption(arguments_, ['--agent', '-a'])) expansion.unshift('--agent', '*');

  return arguments_.flatMap((argument) => (argument === everyFlag ? expansion : [argument]));
}

/**
 * Rewrites every list option into the one shape the Skills CLI actually parses:
 * a bare flag followed by a single value, repeated per value. Upstream matches
 * only the bare tokens, so `--skill=squad-qa` is discarded outright, and it
 * splits on nothing, so `--skill squad-qa,squad-fix` becomes a search for one
 * skill by that literal name. Both forms are read by `readListOption` here, so
 * without this the agent plan honours a filter the install silently ignored —
 * and for `--agent` that means writing to every tool on the machine.
 */
function normalizeListOptions(arguments_: string[]): string[] {
  const normalized: string[] = [];

  for (let index = 0; index < arguments_.length; index += 1) {
    const flag = findListOptionFlag(arguments_[index] as string);

    if (flag === null) {
      normalized.push(arguments_[index] as string);
      continue;
    }

    // On a vector `findValuelessListOption` has cleared, this makes the function
    // a fixpoint: every value it emits is non-empty, comma-free and not
    // flag-shaped, so a second pass re-reads the same runs and rewrites them to
    // themselves. A token the run stopped at survives beside them untouched, so
    // what follows a value is not always a flag — `readListOptionRun` is the
    // single reader that keeps that from mattering.
    const { end, values } = readListOptionRun(arguments_, index, flag);

    index = end;

    for (const value of values) normalized.push(flag, value);
  }

  return normalized;
}

/** True when a list option was given. Run only on a normalized argument list. */
function hasOption(arguments_: string[], flags: string[]): boolean {
  return arguments_.some((argument) => flags.includes(argument));
}

function ensureCopyInstallation(arguments_: string[]): string[] {
  if (arguments_.includes('--copy')) return arguments_;
  return [...arguments_, '--copy'];
}

function formatDefaultEfforts(): string {
  const byLevel = new Map<string, string[]>();

  for (const [role, level] of Object.entries(defaultEffortByRole)) {
    byLevel.set(level, [...(byLevel.get(level) ?? []), role]);
  }

  return [...byLevel].map(([level, roles]) => wrapHelpLine(`  ${level}: `, roles)).join('\n');
}

/** Wraps a list at the help text's width, continuing under its first item. */
function wrapHelpLine(prefix: string, items: string[]): string {
  const lines = [prefix];

  for (const [index, item] of items.entries()) {
    const text = index < items.length - 1 ? `${item},` : item;
    const current = lines[lines.length - 1] as string;

    if (current.length > prefix.length && current.length + 1 + text.length > 78) {
      lines.push(`${' '.repeat(prefix.length)}${text}`);
    } else {
      lines[lines.length - 1] =
        current.length > prefix.length ? `${current} ${text}` : current + text;
    }
  }

  return lines.join('\n');
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
  --all             Every skill into every agent (add). A --skill or --agent
                    given alongside it wins, so --all --agent codex stays
                    codex-only
  --model           Write this model into each Claude Code agent file
  --effort          Override the reasoning effort in Claude Code agent files:
                    a level for every role, or <skill>=<level> for one.
                    Repeatable or comma-separated. Levels: low, medium, high,
                    xhigh, max, or inherit to follow the session's effort

Examples:
  squad-skills list
  squad-skills add --skill squads-team
  squad-skills add --skill squad-frontend --global --agent codex
  squad-skills agents --global
  squad-skills agents --global --agent claude-code --model opus --effort medium
  squad-skills agents --global --effort squad-qa=high,squad-frontend=low

Claude Code reads an agent from .claude/agents/<name>.md. Codex reads one from
.codex/agents/<name>.toml and loads it only once config.toml names it, so this
CLI registers it there and backs the file up first. Codex agents are written at
global scope only, and carry no model field: Codex takes a subagent default from
[agents] default_subagent_model in config.toml instead.

Each role's Claude Code agent carries a default effort:
${formatDefaultEfforts()}
--effort overrides it; a role named with <skill>=<level> wins over a bare
level. --model is a machine preference with no default. Every install
regenerates these files, so pass the same flags again to keep an override.

All other options after add or list are forwarded to the Skills CLI.`;
}
