/**
 * The reasoning effort each role's Claude Code agent runs at, and how a caller
 * overrides it.
 *
 * A role's effort is catalog content, unlike its model: it follows from what
 * the role does, not from whose machine runs it. Roles that frame scope, build,
 * prove causes or gate risk get `high`; roles that verify or design against
 * criteria and a system already settled get `medium`. A caller overrides every role with a bare
 * level, or one role with `<skill>=<level>`, and `inherit` drops the field so
 * the agent follows the session's effort.
 *
 * Every shipped skill has an entry, and `tests/agents/plugin-agents.test.ts`
 * holds the table to the `skills/` directory.
 */

export const effortLevels = ['low', 'medium', 'high', 'xhigh', 'max'] as const;

/** Writes no effort field, so the agent inherits the session's level. */
export const inheritEffort = 'inherit';

export const defaultEffortByRole: Readonly<Record<string, string>> = {
  'squad-backend': 'high',
  'squad-code-review': 'high',
  'squad-designer': 'medium',
  'squad-devops': 'high',
  'squad-fix': 'high',
  'squad-frontend': 'high',
  'squad-mobile': 'high',
  'squad-product': 'high',
  'squad-qa': 'medium',
  'squads-team': 'high',
};

/** What a caller asked for: one level for every role, and levels for named roles. */
export interface EffortOverrides {
  effort?: string | null;
  roleEfforts?: Readonly<Record<string, string>>;
}

export type ParsedEffortOverrides =
  | { kind: 'ok'; effort: string | null; roleEfforts: Record<string, string> }
  | { kind: 'error'; message: string };

const acceptedLevels: readonly string[] = [...effortLevels, inheritEffort];

/**
 * Reads every `--effort` value, each already split on commas. A bare level
 * sets every role and `<skill>=<level>` sets one. The same target given two
 * different levels is refused rather than resolved by position, because either
 * answer would be a guess about which one the caller meant.
 */
export function parseEffortOverrides(values: string[]): ParsedEffortOverrides {
  let effort: string | null = null;
  const roleEfforts: Record<string, string> = {};

  for (const value of values) {
    const separator = value.indexOf('=');
    const role = separator === -1 ? null : value.slice(0, separator).trim();
    const level = (separator === -1 ? value : value.slice(separator + 1)).trim();

    if (!acceptedLevels.includes(level)) {
      return {
        kind: 'error',
        message: `--effort ${value}: the level must be one of ${acceptedLevels.join(', ')}.`,
      };
    }

    if (role === null) {
      if (effort !== null && effort !== level) {
        return { kind: 'error', message: `--effort is given both ${effort} and ${level}.` };
      }

      effort = level;
      continue;
    }

    if (!Object.hasOwn(defaultEffortByRole, role)) {
      const problem = role === '' ? 'no skill is named' : `${role} is not a skill in this catalog`;

      return { kind: 'error', message: `--effort ${value}: ${problem}.` };
    }

    const previous = roleEfforts[role];

    if (previous !== undefined && previous !== level) {
      return { kind: 'error', message: `--effort gives ${role} both ${previous} and ${level}.` };
    }

    roleEfforts[role] = level;
  }

  return { kind: 'ok', effort, roleEfforts };
}

/**
 * The level written into one role's agent file, or null for none. A named role
 * wins over the level for every role, which wins over the catalog default.
 */
export function resolveRoleEffort(name: string, overrides: EffortOverrides = {}): string | null {
  const level = overrides.roleEfforts?.[name] ?? overrides.effort ?? defaultEffortByRole[name];

  return level === undefined || level === inheritEffort ? null : level;
}

/** True when the caller overrode any role, which is what Codex has to be told it ignored. */
export function hasEffortOverrides(overrides: EffortOverrides): boolean {
  return (
    (overrides.effort !== undefined && overrides.effort !== null) ||
    Object.keys(overrides.roleEfforts ?? {}).length > 0
  );
}
