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

// TOML allows a comment after a table header, and spaces or quotes inside it; a
// header that does not match here is appended a second time, and a duplicate
// table is a config Codex cannot parse.
const tableHeaderPattern = /^\s*\[([^\]]+)\]\s*(?:#.*)?$/;
const keyLinePattern = /^\s*([^#=[\s][^=]*?)\s*=/;

/** An agent to register, with the text Codex reads to decide when to spawn it. */
export interface CodexAgentEntry {
  description: string;
  name: string;
}

export interface CodexRegistrationResult {
  added: string[];
  alreadyRegistered: string[];
  /** Entries for the user to add by hand when the config cannot be edited safely. */
  manualEntries?: string;
  source: string;
}

export function registerCodexAgents(
  source: string,
  agents: CodexAgentEntry[]
): CodexRegistrationResult {
  const added: string[] = [];
  const alreadyRegistered: string[] = [];
  const missing: CodexAgentEntry[] = [];

  const keys = readAgentKeys(source);

  for (const agent of agents) {
    if (keys.registered.has(agent.name)) alreadyRegistered.push(agent.name);
    else missing.push(agent);
  }

  if (missing.length === 0) return { added, alreadyRegistered, source };

  const entries = missing.flatMap(({ description, name }) => [
    `  [agents.${name}]`,
    `    config_file = "agents/${name}.toml"`,
    `    description = ${JSON.stringify(description)}`,
  ]);

  // A dotted key or inline table defines part of `agents` without a header, and
  // appending a header beside it is a redefinition Codex refuses to parse.
  if (keys.headerless) {
    return { added, alreadyRegistered, manualEntries: entries.join('\n'), source };
  }

  added.push(...missing.map(({ name }) => name));

  return {
    added,
    alreadyRegistered,
    source: insertIntoAgentsTable(source, entries),
  };
}

/**
 * Reads which agents a config already names, by table header, dotted key or
 * inline table, and whether `agents` is defined anywhere without a header.
 */
function readAgentKeys(source: string): { headerless: boolean; registered: Set<string> } {
  const registered = new Set<string>();
  let headerless = false;
  let table = '';

  for (const line of source.split(/\r?\n/)) {
    const header = tableHeaderPattern.exec(line)?.[1];

    if (header !== undefined) {
      table = normalizeKey(header);
      const [root, name] = table.split('.');
      if (root === 'agents' && name !== undefined) registered.add(name);
      continue;
    }

    const key = keyLinePattern.exec(line)?.[1];
    if (key === undefined) continue;

    const path = (table === '' ? normalizeKey(key) : `${table}.${normalizeKey(key)}`).split('.');
    if (path[0] !== 'agents') continue;

    // Keys inside an `[agents.<name>]` table are that agent's own settings.
    if (table.startsWith('agents.')) continue;
    // A plain setting inside `[agents]`, such as `max_threads = 4`.
    if (table === 'agents' && !key.includes('.') && !line.includes('{')) continue;

    headerless = true;
    if (path[1] !== undefined) registered.add(path[1]);
  }

  return { headerless, registered };
}

function normalizeKey(key: string): string {
  return key.replace(/["'\s]/g, '');
}

function insertIntoAgentsTable(source: string, entries: string[]): string {
  const lines = source.split('\n');
  const tableStart = lines.findIndex(
    (line) => normalizeKey(tableHeaderPattern.exec(line)?.[1] ?? '') === 'agents'
  );

  if (tableStart === -1) {
    const separator = source.length > 0 && !source.endsWith('\n') ? '\n' : '';
    return `${source}${separator}\n[agents]\n${entries.join('\n')}\n`;
  }

  let insertAt = lines.length;

  for (let index = tableStart + 1; index < lines.length; index += 1) {
    const header = tableHeaderPattern.exec(lines[index] as string)?.[1];

    if (header !== undefined && !normalizeKey(header).startsWith('agents.')) {
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
