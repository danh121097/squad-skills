import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { createCliAction, supportedAgentTools } from '../../src/cli/squad-skills-command.ts';

const packageRoot = '/package/squad-skills';

describe('Skills CLI parity', () => {
  it('still reads a value run the way this CLI mirrors it', () => {
    // `readListOptionRun` consumes exactly what upstream consumes, and the whole
    // separation between what the run takes and what the refusal rejects rests
    // on that. Nothing else in this suite would notice a `skills` bump changing
    // the rule: the plan and the forwarded vector would simply start disagreeing
    // in production. Assert the premise against the installed package so the
    // bump is a red gate instead.
    const upstream = readFileSync(
      new URL('../../node_modules/skills/dist/cli.mjs', import.meta.url),
      'utf8'
    );
    // Count rather than `toContain`: the rule governs `--agent` and `--skill`
    // separately, so matching one occurrence would miss a change to the other.
    // Counting also keeps the failure readable — asserting over the bundle
    // itself prints 300KB on the one day this test is supposed to be read.
    const rule = 'while (i < args.length && nextArg && !nextArg.startsWith("-"))';

    expect(upstream.split(rule).length - 1).toBeGreaterThanOrEqual(2);
  });
});

describe('createCliAction', () => {
  it('shows help when no command is provided', () => {
    expect(createCliAction([], packageRoot, '0.1.0')).toMatchObject({
      kind: 'print',
      exitCode: 0,
    });
  });

  it('prints the package version', () => {
    expect(createCliAction(['--version'], packageRoot, '0.1.0')).toEqual({
      kind: 'print',
      message: '0.1.0',
      exitCode: 0,
    });
  });

  it('delegates add commands and defaults to copied installations', () => {
    expect(
      createCliAction(['add', '--skill', 'squads-team', '--agent', 'codex'], packageRoot, '0.1.0')
    ).toEqual({
      kind: 'delegate',
      agentPlan: {
        agents: ['codex'],
        effort: null,
        force: false,
        model: null,
        scope: 'project',
        skills: ['squads-team'],
      },
      arguments: ['add', packageRoot, '--skill', 'squads-team', '--agent', 'codex', '--copy'],
    });
  });

  it('does not duplicate an explicit copy option', () => {
    expect(createCliAction(['install', '--copy', '--yes'], packageRoot, '0.1.0')).toEqual({
      kind: 'delegate',
      agentPlan: {
        agents: supportedAgentTools,
        effort: null,
        force: false,
        model: null,
        scope: 'project',
        skills: [],
      },
      arguments: ['add', packageRoot, '--copy', '--yes'],
    });
  });

  it('maps list to non-installing Skills CLI discovery', () => {
    expect(createCliAction(['ls'], packageRoot, '0.1.0')).toEqual({
      kind: 'delegate',
      agentPlan: null,
      arguments: ['add', packageRoot, '--list'],
    });
  });

  it('reads the scope and skill filters the Skills CLI reads, without consuming them', () => {
    const action = createCliAction(['add', '-g', '-s', 'squad-qa,squad-fix'], packageRoot, '0.1.0');

    expect(action).toMatchObject({
      agentPlan: { scope: 'global', skills: ['squad-qa', 'squad-fix'] },
      arguments: ['add', packageRoot, '-g', '-s', 'squad-qa', '-s', 'squad-fix', '--copy'],
    });
  });

  it('treats an every-agent install as every supported agent', () => {
    expect(createCliAction(['add', '--agent=*'], packageRoot, '0.1.0')).toMatchObject({
      agentPlan: { agents: supportedAgentTools },
    });
  });

  it('keeps an explicit agent filter when --all is used, rather than letting it widen', () => {
    const action = createCliAction(
      ['add', '--all', '--global', '--agent', 'codex'],
      packageRoot,
      '0.1.0'
    );

    expect(action).toMatchObject({
      agentPlan: { agents: ['codex'], scope: 'global' },
      arguments: [
        'add',
        packageRoot,
        '--skill',
        '*',
        '-y',
        '--global',
        '--agent',
        'codex',
        '--copy',
      ],
    });
  });

  it('keeps an explicit skill filter when --all is used', () => {
    expect(
      createCliAction(['add', '--all', '--skill=squad-qa'], packageRoot, '0.1.0')
    ).toMatchObject({
      agentPlan: { skills: ['squad-qa'], agents: supportedAgentTools },
      arguments: ['add', packageRoot, '--agent', '*', '-y', '--skill', 'squad-qa', '--copy'],
    });
  });

  it('expands a bare --all to every skill and every agent', () => {
    expect(createCliAction(['add', '--all'], packageRoot, '0.1.0')).toMatchObject({
      agentPlan: { agents: supportedAgentTools, skills: [] },
      arguments: ['add', packageRoot, '--agent', '*', '--skill', '*', '-y', '--copy'],
    });
  });

  it('installs skills alone when agents are declined, and does not forward the flag', () => {
    expect(createCliAction(['add', '--no-agents', '--yes'], packageRoot, '0.1.0')).toEqual({
      kind: 'delegate',
      agentPlan: null,
      arguments: ['add', packageRoot, '--yes', '--copy'],
    });
  });

  it('generates agents for an already-installed catalog without delegating', () => {
    expect(createCliAction(['agents', '--global', '--force'], packageRoot, '0.1.0')).toEqual({
      kind: 'install-agents',
      agentPlan: {
        agents: supportedAgentTools,
        effort: null,
        force: true,
        model: null,
        scope: 'global',
        skills: [],
      },
    });
  });

  it('reads a model and an effort, and keeps them out of the forwarded arguments', () => {
    expect(
      createCliAction(['add', '--model', 'opus', '--effort=medium', '--yes'], packageRoot, '0.1.0')
    ).toEqual({
      kind: 'delegate',
      agentPlan: {
        agents: supportedAgentTools,
        effort: 'medium',
        force: false,
        model: 'opus',
        scope: 'project',
        skills: [],
      },
      // The Skills CLI has never heard of these flags and would reject them.
      arguments: ['add', packageRoot, '--yes', '--copy'],
    });
  });

  it('reads a model on the agents command', () => {
    expect(
      createCliAction(['agents', '--global', '--model=sonnet'], packageRoot, '0.1.0')
    ).toMatchObject({
      agentPlan: { effort: null, model: 'sonnet' },
    });
  });

  // Without this the next flag becomes the value, and every generated agent
  // file gets `model: --global` written into it with nothing to catch it.
  it('refuses a model flag whose value is the next flag', () => {
    expect(createCliAction(['agents', '--model', '--global'], packageRoot, '0.1.0')).toMatchObject({
      kind: 'print',
      exitCode: 1,
    });
  });

  it('refuses an empty effort value', () => {
    expect(createCliAction(['agents', '--effort='], packageRoot, '0.1.0')).toMatchObject({
      kind: 'print',
      exitCode: 1,
    });
  });

  // A value-based filter would drop the first `opus` too and forward
  // `--skill` with nothing after it.
  it('strips a preference value by position, not by the value itself', () => {
    expect(
      createCliAction(['add', '--skill', 'opus', '--model', 'opus'], packageRoot, '0.1.0')
    ).toEqual({
      kind: 'delegate',
      agentPlan: {
        agents: supportedAgentTools,
        effort: null,
        force: false,
        model: 'opus',
        scope: 'project',
        skills: ['opus'],
      },
      arguments: ['add', packageRoot, '--skill', 'opus', '--copy'],
    });
  });

  it('rewrites an equals-joined filter into the form the Skills CLI parses', () => {
    expect(createCliAction(['add', '--agent=codex'], packageRoot, '0.1.0')).toMatchObject({
      agentPlan: { agents: ['codex'] },
      arguments: ['add', packageRoot, '--agent', 'codex', '--copy'],
    });
  });

  it('splits a comma list the Skills CLI would read as one name', () => {
    expect(
      createCliAction(['add', '--skill', 'squad-qa,squad-fix'], packageRoot, '0.1.0')
    ).toMatchObject({
      agentPlan: { skills: ['squad-qa', 'squad-fix'] },
      arguments: ['add', packageRoot, '--skill', 'squad-qa', '--skill', 'squad-fix', '--copy'],
    });
  });

  it('keeps an equals-joined filter against --all, which the plan and the install must agree on', () => {
    expect(createCliAction(['add', '--all', '--agent=codex'], packageRoot, '0.1.0')).toMatchObject({
      agentPlan: { agents: ['codex'] },
      arguments: ['add', packageRoot, '--skill', '*', '-y', '--agent', 'codex', '--copy'],
    });
  });

  it('reads a run of values after one flag, as the Skills CLI does', () => {
    expect(
      createCliAction(['add', '--agent', 'claude-code', 'codex'], packageRoot, '0.1.0')
    ).toMatchObject({
      agentPlan: { agents: ['claude-code', 'codex'] },
      arguments: ['add', packageRoot, '--agent', 'claude-code', '--agent', 'codex', '--copy'],
    });
  });

  it('refuses a list flag left with no value', () => {
    for (const argv of [
      ['add', '--agent'],
      ['add', '--agent='],
      ['add', '--skill=', 'squad-qa'],
      // The bare spelling of the same unset shell variable. Refusing one and
      // reading the next token as the value for the other is the drift.
      ['add', '--skill', '', 'squad-fix'],
      ['add', '--agent', '', 'codex'],
      ['add', '--agent', '--global'],
      ['add', '--skill', ','],
    ]) {
      expect(createCliAction(argv, packageRoot, '0.1.0')).toMatchObject({
        kind: 'print',
        exitCode: 1,
      });
    }
  });

  it('refuses a flag-shaped value wherever it is written', () => {
    // Left in, each of these normalizes to a list flag with no value after it,
    // which upstream reads as an empty agent list: every tool on the machine.
    for (const argv of [
      ['add', '--agent=-foo'],
      ['add', '--skill', 'squad-qa,-foo'],
      ['add', '--skill=squad-qa,-foo'],
      ['add', '--all', '--agent=-foo'],
      // Later in the run, not just the token after the flag: the refusal and
      // the rewrite must read the same run or one lets through what the other
      // consumes.
      ['add', '--skill', 'squad-qa', 'squad-fix,-x'],
      // Only a filter value once --model and its value are stripped, which is
      // why the refusal has to read the stripped vector and not the caller's.
      ['add', '--skill', 'squad-qa', '--model', 'opus', 'a,-b'],
    ]) {
      expect(createCliAction(argv, packageRoot, '0.1.0')).toMatchObject({
        kind: 'print',
        exitCode: 1,
      });
    }
  });

  it('refuses a filter value that names nothing', () => {
    // Every row here already held in 0.2.3; they pin it against the change that
    // made the run consume what upstream consumes. The run has to take a blank
    // token because upstream does, or it survives into the forwarded vector and
    // upstream reads it as a value there. The refusal is under no such
    // constraint — it builds no vector — so it rejects what the run had to take.
    for (const argv of [
      ['add', '--skill', ' ', 'squad-fix'],
      ['add', '--skill', '\t', 'squad-fix'],
      ['add', '--agent', '  ', 'codex'],
      ['add', '--skill=  ', 'squad-fix'],
      ['add', '--skill', ',', 'squad-fix'],
      ['add', '--skill', ' , ', 'squad-fix'],
      ['add', '--agent', ',,', 'codex'],
      // The run stopped at this one instead of starting at it. Same token.
      ['add', '--skill', 'squad-qa', '', 'squad-fix'],
      // Valueless in what the caller wrote, whatever stripping joins onto it.
      ['add', '--agent', '--no-agents', 'codex'],
      ['add', '--skill', '--model', 'opus', 'squad-qa'],
    ]) {
      expect(createCliAction(argv, packageRoot, '0.1.0')).toMatchObject({
        kind: 'print',
        exitCode: 1,
      });
    }
  });

  it('agrees on the filter when a preference flag interrupts a value run', () => {
    // `--model opus` is a run terminator that only the forwarded vector loses,
    // so building the plan from a second vector installed two skills and wrote
    // one agent definition.
    expect(
      createCliAction(
        ['add', '--skill', 'squad-qa', '--model', 'opus', 'squad-fix', '--agent', 'claude-code'],
        packageRoot,
        '0.1.0'
      )
    ).toMatchObject({
      agentPlan: {
        agents: ['claude-code'],
        model: 'opus',
        skills: ['squad-qa', 'squad-fix'],
      },
      arguments: [
        'add',
        packageRoot,
        '--skill',
        'squad-qa',
        '--skill',
        'squad-fix',
        '--agent',
        'claude-code',
        '--copy',
      ],
    });
  });

  it('agrees on the agent list when a preference flag interrupts it', () => {
    expect(
      createCliAction(
        ['add', '--agent', 'codex', '--effort', 'high', 'claude-code'],
        packageRoot,
        '0.1.0'
      )
    ).toMatchObject({
      agentPlan: { agents: ['codex', 'claude-code'], effort: 'high' },
      arguments: ['add', packageRoot, '--agent', 'codex', '--agent', 'claude-code', '--copy'],
    });
  });

  it('takes an inline value together with the run that follows it', () => {
    expect(
      createCliAction(
        ['add', '--skill=squad-qa', 'squad-fix,squads-team', '--global'],
        packageRoot,
        '0.1.0'
      )
    ).toMatchObject({
      agentPlan: { skills: ['squad-qa', 'squad-fix', 'squads-team'], scope: 'global' },
      arguments: [
        'add',
        packageRoot,
        '--skill',
        'squad-qa',
        '--skill',
        'squad-fix',
        '--skill',
        'squads-team',
        '--global',
        '--copy',
      ],
    });
  });

  it('rejects unknown commands', () => {
    expect(createCliAction(['remove'], packageRoot, '0.1.0')).toMatchObject({
      kind: 'print',
      exitCode: 1,
    });
  });
});
