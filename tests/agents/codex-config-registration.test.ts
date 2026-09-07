import { describe, expect, it } from 'vitest';

import { registerCodexAgents } from '../../src/agents/codex-config-registration.ts';

const config = `model = "gpt-5.6"

[agents]
  default_subagent_model = "gpt-5.6"
  [agents.tester]
    config_file = "agents/tester.toml"
    description = "tester"

[projects."/tmp/example"]
  trust_level = "trusted"
`;

describe('registerCodexAgents', () => {
  it('adds an entry inside the agents table, above the next table', () => {
    const result = registerCodexAgents(config, ['squad-qa']);

    expect(result.added).toEqual(['squad-qa']);
    expect(result.source).toContain(
      '  [agents.squad-qa]\n    config_file = "agents/squad-qa.toml"\n    description = "squad-qa"'
    );
    expect(result.source.indexOf('[agents.squad-qa]')).toBeLessThan(
      result.source.indexOf('[projects."/tmp/example"]')
    );
  });

  it('leaves an existing entry exactly as the user has it', () => {
    const result = registerCodexAgents(config, ['tester']);

    expect(result.added).toEqual([]);
    expect(result.alreadyRegistered).toEqual(['tester']);
    expect(result.source).toBe(config);
  });

  // Reinstalling is the normal case, so a second run must not grow the file.
  it('is idempotent across repeated runs', () => {
    const once = registerCodexAgents(config, ['squad-qa', 'squad-fix']).source;

    expect(registerCodexAgents(once, ['squad-qa', 'squad-fix']).source).toBe(once);
  });

  it('creates the table when the config has none', () => {
    const result = registerCodexAgents('model = "gpt-5.6"\n', ['squad-qa']);

    expect(result.source).toContain('[agents]\n  [agents.squad-qa]');
  });

  it('creates the whole file when there is no config at all', () => {
    expect(registerCodexAgents('', ['squad-qa']).source).toContain('[agents]');
  });

  it('keeps the blank line that separates the agents table from the next one', () => {
    expect(registerCodexAgents(config, ['squad-qa']).source).toContain(
      '\n\n[projects."/tmp/example"]'
    );
  });
});
