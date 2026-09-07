/**
 * Registers agents in a Codex `config.toml`.
 *
 * Dropping a file into `~/.codex/agents/` is not enough: Codex loads an agent
 * only when the `[agents]` table names its `config_file`. This is a pure string
 * transform so the fs step stays testable and so an unregistered agent is a
 * caught case rather than a silent no-op.
 *
 * It appends and never rewrites. An entry that already exists is left exactly
 * as the user has it, which keeps a reinstall idempotent and keeps a hand-tuned
 * model or reasoning setting from being reset.
 */

const agentsTablePattern = /^\s*\[agents\]\s*$/;
const tableHeaderPattern = /^\s*\[([^\]]+)\]\s*$/;

export interface CodexRegistrationResult {
  added: string[];
  alreadyRegistered: string[];
  source: string;
}

export function registerCodexAgents(source: string, names: string[]): CodexRegistrationResult {
  const added: string[] = [];
  const alreadyRegistered: string[] = [];
  const missing: string[] = [];

  for (const name of names) {
    if (hasAgentEntry(source, name)) alreadyRegistered.push(name);
    else missing.push(name);
  }

  if (missing.length === 0) return { added, alreadyRegistered, source };

  const entries = missing.flatMap((name) => [
    `  [agents.${name}]`,
    `    config_file = "agents/${name}.toml"`,
    `    description = ${JSON.stringify(name)}`,
  ]);

  added.push(...missing);

  return {
    added,
    alreadyRegistered,
    source: insertIntoAgentsTable(source, entries),
  };
}

function hasAgentEntry(source: string, name: string): boolean {
  return source
    .split(/\r?\n/)
    .some((line) => tableHeaderPattern.exec(line)?.[1] === `agents.${name}`);
}

function insertIntoAgentsTable(source: string, entries: string[]): string {
  const lines = source.split('\n');
  const tableStart = lines.findIndex((line) => agentsTablePattern.test(line));

  if (tableStart === -1) {
    const separator = source.length > 0 && !source.endsWith('\n') ? '\n' : '';
    return `${source}${separator}\n[agents]\n${entries.join('\n')}\n`;
  }

  let insertAt = lines.length;

  for (let index = tableStart + 1; index < lines.length; index += 1) {
    const header = tableHeaderPattern.exec(lines[index] as string)?.[1];

    if (header !== undefined && !header.startsWith('agents.')) {
      insertAt = index;
      break;
    }
  }

  // Keep the blank lines that separate this table from the next one below the
  // insertion, so repeated installs do not accumulate gaps inside the table.
  while (insertAt > tableStart + 1 && (lines[insertAt - 1] as string).trim() === '') {
    insertAt -= 1;
  }

  return [...lines.slice(0, insertAt), ...entries, ...lines.slice(insertAt)].join('\n');
}
