/**
 * Per-tool model and reasoning defaults, and how a caller overrides them.
 *
 * Claude Code defaults follow what the role does. Roles that
 * frame scope, prove causes or give the final verdict run on `opus`; roles that
 * build, verify or design against settled criteria run on `sonnet`. Every role
 * runs at `medium` effort: the model already chosen for a role carries its
 * depth, and a higher effort spends tokens on every turn of every run.
 *
 * A caller overrides every role with a bare value, or one role with
 * `<skill>=<value>`, and `inherit` drops the field for runtime resolution.
 *
 * Codex uses Luna at max for settled work and Sol at medium for the four
 * planning, diagnosis and review roles. Claude Code keeps its existing defaults.
 * Every shipped skill has an entry in each table, and
 * `tests/agents/plugin-agents.test.ts` holds them to the `skills/` directory.
 */

export const effortLevels = ['low', 'medium', 'high', 'xhigh', 'max'] as const;

/** Writes no field, leaving the setting to the runtime's inheritance rules. */
export const inheritPreference = 'inherit';

export type AgentTool = 'claude-code' | 'codex';

export const defaultModelByRole: Readonly<Record<string, string>> = {
  'squad-backend': 'sonnet',
  'squad-code-review': 'opus',
  'squad-designer': 'sonnet',
  'squad-devops': 'sonnet',
  'squad-fix': 'opus',
  'squad-frontend': 'sonnet',
  'squad-mobile': 'sonnet',
  'squad-product': 'opus',
  'squad-qa': 'sonnet',
  'squads-team': 'opus',
};

export const defaultEffortByRole: Readonly<Record<string, string>> = {
  'squad-backend': 'medium',
  'squad-code-review': 'medium',
  'squad-designer': 'medium',
  'squad-devops': 'medium',
  'squad-fix': 'medium',
  'squad-frontend': 'medium',
  'squad-mobile': 'medium',
  'squad-product': 'medium',
  'squad-qa': 'medium',
  'squads-team': 'medium',
};

/** Authored once; native agent defaults and bundled worker-chat tables derive from these pairs. */
export const defaultCodexPreferencesByRole: Readonly<
  Record<string, { readonly model: string; readonly effort: string }>
> = {
  'squad-backend': { model: 'gpt-6-luna', effort: 'max' },
  'squad-code-review': { model: 'gpt-6.1-sol', effort: 'medium' },
  'squad-designer': { model: 'gpt-6-luna', effort: 'max' },
  'squad-devops': { model: 'gpt-6-luna', effort: 'max' },
  'squad-fix': { model: 'gpt-6.1-sol', effort: 'medium' },
  'squad-frontend': { model: 'gpt-6-luna', effort: 'max' },
  'squad-mobile': { model: 'gpt-6-luna', effort: 'max' },
  'squad-product': { model: 'gpt-6.1-sol', effort: 'medium' },
  'squad-qa': { model: 'gpt-6-luna', effort: 'max' },
  'squads-team': { model: 'gpt-6.1-sol', effort: 'medium' },
};

export const defaultCodexModelByRole: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(defaultCodexPreferencesByRole).map(([role, preference]) => [
    role,
    preference.model,
  ])
);

export const defaultCodexEffortByRole: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(defaultCodexPreferencesByRole).map(([role, preference]) => [
    role,
    preference.effort,
  ])
);

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

    if (!Object.hasOwn(defaultEffortByRole, role)) {
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
  const defaults = tool === 'codex' ? defaultCodexEffortByRole : defaultEffortByRole;
  return resolve(overrides.roleEfforts?.[name] ?? overrides.effort ?? defaults[name]);
}

/** The model written into one role's agent file, resolved the same way. */
export function resolveRoleModel(
  name: string,
  overrides: RoleOverrides = {},
  tool: AgentTool = 'claude-code'
): string | null {
  const defaults = tool === 'codex' ? defaultCodexModelByRole : defaultModelByRole;
  return resolve(overrides.roleModels?.[name] ?? overrides.model ?? defaults[name]);
}

function resolve(value: string | undefined): string | null {
  return value === undefined || value === inheritPreference ? null : value;
}
