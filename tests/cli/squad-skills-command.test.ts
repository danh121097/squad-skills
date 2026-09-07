import { describe, expect, it } from 'vitest';

import { createCliAction, supportedAgentTools } from '../../src/cli/squad-skills-command.ts';

const packageRoot = '/package/squad-skills';

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
      arguments: ['add', packageRoot, '-g', '-s', 'squad-qa,squad-fix', '--copy'],
    });
  });

  it('treats an every-agent install as every supported agent', () => {
    expect(createCliAction(['add', '--agent=*'], packageRoot, '0.1.0')).toMatchObject({
      agentPlan: { agents: supportedAgentTools },
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

  it('rejects unknown commands', () => {
    expect(createCliAction(['remove'], packageRoot, '0.1.0')).toMatchObject({
      kind: 'print',
      exitCode: 1,
    });
  });
});
