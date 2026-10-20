/**
 * Per-tool model and reasoning defaults, and how a caller overrides them.
 *
 * Claude Code runs every role on `opus` at `medium` effort, except
 * `squads-team`, which coordinates the others at `high`: the model already
 * carries each role's depth, and a higher effort spends tokens on every turn
 * of every run.
 *
 * A caller overrides every role with a bare value, or one role with
 * `<skill>=<value>`, and `inherit` drops the field for runtime resolution.
 *
 * Codex uses Sol at medium for settled work and Sol at high for the four
 * planning, diagnosis and review roles. Claude Code keeps its existing defaults.
 * Every shipped skill has an entry in each table, and
 * `tests/agents/plugin-agents.test.ts` holds them to the `skills/` directory.
 */

export const effortLevels = ['low', 'medium', 'high', 'xhigh', 'max'] as const;

/** Writes no field, leaving the setting to the runtime's inheritance rules. */
export const inheritPreference = 'inherit';

export type AgentTool = 'claude-code' | 'codex';

export type RolePreferences = Readonly<
  Record<string, { readonly model: string; readonly effort: string }>
>;

/** Authored once; native agents and worker tables derive from these pairs. */
export const defaultClaudePreferencesByRole: RolePreferences = {
  'squad-backend': { model: 'opus', effort: 'medium' },
  'squad-code-review': { model: 'opus', effort: 'medium' },
  'squad-designer': { model: 'opus', effort: 'medium' },
  'squad-devops': { model: 'opus', effort: 'medium' },
  'squad-fix': { model: 'opus', effort: 'medium' },
  'squad-frontend': { model: 'opus', effort: 'medium' },
  'squad-mobile': { model: 'opus', effort: 'medium' },
  'squad-product': { model: 'opus', effort: 'medium' },
  'squad-qa': { model: 'opus', effort: 'medium' },
  'squads-team': { model: 'opus', effort: 'high' },
};

/** Authored once; native agent defaults and bundled worker-chat tables derive from these pairs. */
export const defaultCodexPreferencesByRole: RolePreferences = {
  'squad-backend': { model: 'gpt-6.1-sol', effort: 'medium' },
  'squad-code-review': { model: 'gpt-6.1-sol', effort: 'high' },
  'squad-designer': { model: 'gpt-6.1-sol', effort: 'medium' },
  'squad-devops': { model: 'gpt-6.1-sol', effort: 'medium' },
  'squad-fix': { model: 'gpt-6.1-sol', effort: 'high' },
  'squad-frontend': { model: 'gpt-6.1-sol', effort: 'medium' },
  'squad-mobile': { model: 'gpt-6.1-sol', effort: 'medium' },
  'squad-product': { model: 'gpt-6.1-sol', effort: 'high' },
  'squad-qa': { model: 'gpt-6.1-sol', effort: 'medium' },
  'squads-team': { model: 'gpt-6.1-sol', effort: 'high' },
};

/** What a caller asked for: one value for every role, and values for named roles. */
export interface RoleOverrides {
  effort?: string | null;
  model?: string | null;
  roleEfforts?: Readonly<Record<string, string>>;
  roleModels?: Readonly<Record<string, string>>;
}

export type ParsedRoleOverrides =
  | { kind: 'ok'; value: string | null; roles: Record<string, string> }
  | { kind: 'error'; message: string };

const acceptedLevels: readonly string[] = [...effortLevels, inheritPreference];

// A model is written verbatim into YAML frontmatter, so anything beyond a model
// id's own characters could smuggle in a second key.
const modelPattern = /^[A-Za-z0-9](?:[\w.:/[\]-]*[\w\]/-])?$/;

export function parseEffortOverrides(values: string[]): ParsedRoleOverrides {
  return parseRoleOverrides('--effort', values, (level) =>
    acceptedLevels.includes(level) ? null : `the level must be one of ${acceptedLevels.join(', ')}`
  );
}

export function parseModelOverrides(values: string[]): ParsedRoleOverrides {
  return parseRoleOverrides('--model', values, (model) =>
    modelPattern.test(model) ? null : `${JSON.stringify(model)} is not a model id`
  );
}

/**
 * Reads every value of one flag, each already split on commas. A bare value
 * sets every role and `<skill>=<value>` sets one. The same target given two
 * different values is refused rather than resolved by position, because either
 * answer would be a guess about which one the caller meant.
 */
function parseRoleOverrides(
  flag: string,
  values: string[],
  problemWith: (value: string) => string | null
): ParsedRoleOverrides {
  let every: string | null = null;
  const roles: Record<string, string> = {};

  for (const value of values) {
    const separator = value.indexOf('=');
    const role = separator === -1 ? null : value.slice(0, separator).trim();
    const setting = (separator === -1 ? value : value.slice(separator + 1)).trim();
    const problem = problemWith(setting);

    if (problem !== null) return { kind: 'error', message: `${flag} ${value}: ${problem}.` };

    if (role === null) {
      if (every !== null && every !== setting) {
        return { kind: 'error', message: `${flag} is given both ${every} and ${setting}.` };
      }

      every = setting;
      continue;
    }

    if (!Object.hasOwn(defaultClaudePreferencesByRole, role)) {
      const unknown = role === '' ? 'no skill is named' : `${role} is not a skill in this catalog`;

      return { kind: 'error', message: `${flag} ${value}: ${unknown}.` };
    }

    const previous = roles[role];

    if (previous !== undefined && previous !== setting) {
      return { kind: 'error', message: `${flag} gives ${role} both ${previous} and ${setting}.` };
    }

    roles[role] = setting;
  }

  return { kind: 'ok', value: every, roles };
}

/**
 * The effort written into one role's agent file, or null for none. A named
 * role wins over the value for every role, which wins over the catalog default.
 */
export function resolveRoleEffort(
  name: string,
  overrides: RoleOverrides = {},
  tool: AgentTool = 'claude-code'
): string | null {
  const defaults =
    tool === 'codex' ? defaultCodexPreferencesByRole : defaultClaudePreferencesByRole;
  return resolve(overrides.roleEfforts?.[name] ?? overrides.effort ?? defaults[name]?.effort);
}

/** The model written into one role's agent file, resolved the same way. */
export function resolveRoleModel(
  name: string,
  overrides: RoleOverrides = {},
  tool: AgentTool = 'claude-code'
): string | null {
  const defaults =
    tool === 'codex' ? defaultCodexPreferencesByRole : defaultClaudePreferencesByRole;
  return resolve(overrides.roleModels?.[name] ?? overrides.model ?? defaults[name]?.model);
}

function resolve(value: string | undefined): string | null {
  return value === undefined || value === inheritPreference ? null : value;
}
