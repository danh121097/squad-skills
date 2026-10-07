/**
 * Who may turn the decision layer on, and with what.
 *
 * Two locks, held by different owners. The user scope (`~/.squad-skills/`) is
 * the only place that can enable the layer, pick a provider and model, or hold
 * credentials. The project scope (`.squad-skills/decide.json` in the working
 * directory or any parent) can only narrow what the user granted: switch it
 * off, or allow a subset of providers and models. A cloned repository therefore
 * cannot enable a provider
 * and send its context out on its own, and a credential being present is never
 * read as consent.
 *
 * The project scope's `.env` is never opened, so a repository cannot supply
 * credentials either. Every unreadable file fails closed.
 */
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';

const settingsDirectoryName = '.squad-skills';
const settingsFileName = 'decide.json';
const credentialsFileName = '.env';

/** Where settings are read from: the user's home, the project the server serves, and the process env. */
export interface DecisionContext {
  env: Record<string, string | undefined>;
  home: string;
  projectDir: string;
}

export type DecisionSelection =
  { enabled: true; model: string; provider: string } | { enabled: false; reason: string };

type JsonReadResult = { kind: 'missing' } | { kind: 'invalid' } | { kind: 'value'; value: unknown };

async function readJsonFile(filePath: string): Promise<JsonReadResult> {
  let text: string;
  try {
    text = await readFile(filePath, 'utf8');
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'ENOENT'
      ? { kind: 'missing' }
      : { kind: 'invalid' };
  }
  try {
    return { kind: 'value', value: JSON.parse(text) as unknown };
  } catch {
    return { kind: 'invalid' };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readStringList(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : null;
}

const projectKeys = new Set(['enabled', 'providers', 'models', 'provider', 'model']);

/**
 * Applies one project file's narrowing to the user's choice. Only `enabled:
 * false` and the `providers` / `models` allowlists take effect; `enabled: true`,
 * `provider` and `model` grant nothing. Anything else in the file, including a
 * typo, disables the layer, so a restriction is never silently dropped.
 */
async function applyProjectFile(
  projectPath: string,
  choice: { model: string; provider: string }
): Promise<string | null> {
  const project = await readJsonFile(projectPath);
  if (project.kind === 'missing') return null;
  if (project.kind === 'invalid' || !isRecord(project.value)) {
    return `Could not read ${projectPath} as a JSON object.`;
  }
  const unknownKey = Object.keys(project.value).find((key) => !projectKeys.has(key));
  if (unknownKey !== undefined) return `Unknown key "${unknownKey}" in ${projectPath}.`;
  const { enabled } = project.value;
  if (enabled !== undefined && typeof enabled !== 'boolean') {
    return `"enabled" in ${projectPath} must be true or false.`;
  }
  if (enabled === false) return `Disabled by ${projectPath}.`;
  for (const [key, chosen] of [
    ['providers', choice.provider],
    ['models', choice.model],
  ] as const) {
    if (!Object.hasOwn(project.value, key)) continue;
    const allowed = readStringList(project.value[key]);
    if (allowed === null) return `"${key}" in ${projectPath} must be a list of strings.`;
    if (!allowed.includes(chosen)) {
      return `${projectPath} does not allow ${key.slice(0, -1)} "${chosen}".`;
    }
  }
  return null;
}

/**
 * Resolves the provider and model the user enabled, then applies every project
 * file from the working directory up to the filesystem root, so starting the
 * server in a subdirectory cannot step around a restriction. An allowlist that
 * excludes the user's choice disables the layer rather than falling back,
 * because a fallback would let the project pick.
 */
export async function resolveDecisionSelection(
  context: DecisionContext
): Promise<DecisionSelection> {
  // A relative or empty home would resolve the user scope inside the project.
  if (!path.isAbsolute(context.home)) {
    return { enabled: false, reason: 'HOME is not an absolute path.' };
  }
  const userPath = path.join(context.home, settingsDirectoryName, settingsFileName);
  const user = await readJsonFile(userPath);
  if (user.kind === 'missing') {
    return { enabled: false, reason: `Not enabled. Set "enabled": true in ${userPath}.` };
  }
  if (user.kind === 'invalid' || !isRecord(user.value)) {
    return { enabled: false, reason: `Could not read ${userPath} as a JSON object.` };
  }
  const { enabled, provider, model } = user.value;
  if (enabled !== true) {
    return { enabled: false, reason: `Not enabled. Set "enabled": true in ${userPath}.` };
  }
  if (typeof provider !== 'string' || typeof model !== 'string') {
    return { enabled: false, reason: `${userPath} must name a "provider" and a "model".` };
  }

  // Real paths on both sides, so a symlinked home still matches the directory
  // it points at; every ancestor of a real path is itself real.
  const realHome = await realpath(context.home).catch(() => path.resolve(context.home));
  let directory = await realpath(context.projectDir).catch(() => path.resolve(context.projectDir));
  for (;;) {
    // The user file is the grant, not a restriction.
    if (directory !== realHome) {
      const projectPath = path.join(directory, settingsDirectoryName, settingsFileName);
      const reason = await applyProjectFile(projectPath, { provider, model });
      if (reason !== null) return { enabled: false, reason };
    }
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  return { enabled: true, provider, model };
}

/** Parses `KEY=VALUE` lines. No variable expansion, no multi-line values. */
function parseEnvFile(text: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^export\s+/, '');
    if (line === '' || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator <= 0) continue;
    let value = line.slice(separator + 1).trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.length >= 2 && value.endsWith(quote)) {
      value = value.slice(1, -1);
    }
    values[line.slice(0, separator).trim()] = value;
  }
  return values;
}

/**
 * Reads each named credential from the process env first, then from
 * `~/.squad-skills/.env`. Returns the names still missing alongside the values.
 */
export async function readCredentials(
  names: readonly string[],
  context: Pick<DecisionContext, 'env' | 'home'>
): Promise<{ missing: string[]; values: Record<string, string> }> {
  let fileValues: Record<string, string> = {};
  // A relative home would point the user `.env` into the project.
  if (path.isAbsolute(context.home)) {
    try {
      fileValues = parseEnvFile(
        await readFile(path.join(context.home, settingsDirectoryName, credentialsFileName), 'utf8')
      );
    } catch {
      // An absent or unreadable user `.env` leaves only the process env.
    }
  }
  const values: Record<string, string> = {};
  const missing: string[] = [];
  for (const name of names) {
    const value = context.env[name] || fileValues[name];
    if (value) values[name] = value;
    else missing.push(name);
  }
  return { missing, values };
}
