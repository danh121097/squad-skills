import { describe, expect, it } from 'vitest';

import { registerCodexAgents } from '../../src/agents/codex-config-registration.ts';

const qa = { description: 'Verifies behavior. Invoke after a build.', name: 'squad-qa' };
const fix = { description: 'Fixes a concrete bug.', name: 'squad-fix' };
const tester = { description: 'tester', name: 'tester' };
const qaAndFix = [qa, fix];

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
    const result = registerCodexAgents(config, [qa]);

    expect(result.added).toEqual(['squad-qa']);
    expect(result.source).toContain(
      '  [agents.squad-qa]\n    config_file = "agents/squad-qa.toml"\n    description = "Verifies behavior. Invoke after a build."'
    );
    expect(result.source.indexOf('[agents.squad-qa]')).toBeLessThan(
      result.source.indexOf('[projects."/tmp/example"]')
    );
  });

  it('leaves an existing entry exactly as the user has it', () => {
    const result = registerCodexAgents(config, [tester]);

    expect(result.added).toEqual([]);
    expect(result.alreadyRegistered).toEqual(['tester']);
    expect(result.source).toBe(config);
  });

  // TOML allows a quoted key; appending a second table for it breaks the config.
  it('recognizes an entry written with a quoted key', () => {
    const quoted = config.replace('[agents.tester]', '[agents."tester"]');

    expect(registerCodexAgents(quoted, [tester]).source).toBe(quoted);
  });

  // Reinstalling is the normal case, so a second run must not grow the file.
  it('is idempotent across repeated runs', () => {
    const once = registerCodexAgents(config, qaAndFix).source;

    expect(registerCodexAgents(once, qaAndFix).source).toBe(once);
  });

  // A commented header is still the same table; missing it appends a duplicate.
  it('recognizes headers that carry a trailing comment', () => {
    const commented = config.replace('[agents]', '[agents] # subagents');

    expect(registerCodexAgents(commented, [qa]).source.match(/^\s*\[agents\]/gm)).toHaveLength(1);
    expect(
      registerCodexAgents(config.replace('[agents.tester]', '[agents.tester] # mine'), [tester])
        .source
    ).toBe(config.replace('[agents.tester]', '[agents.tester] # mine'));
  });

  it('creates the table when the config has none', () => {
    const result = registerCodexAgents('model = "gpt-5.6"\n', [qa]);

    expect(result.source).toContain('[agents]\n  [agents.squad-qa]');
  });

  it('creates the whole file when there is no config at all', () => {
    expect(registerCodexAgents('', [qa]).source).toContain('[agents]');
  });

  it('keeps the blank line that separates the agents table from the next one', () => {
    expect(registerCodexAgents(config, [qa]).source).toContain('\n\n[projects."/tmp/example"]');
  });
});
