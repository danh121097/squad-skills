import { describe, expect, it } from 'vitest';

import { createCliAction } from '../src/squad-skills-command.ts';

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
      arguments: ['add', packageRoot, '--skill', 'squads-team', '--agent', 'codex', '--copy'],
    });
  });

  it('does not duplicate an explicit copy option', () => {
    expect(createCliAction(['install', '--copy', '--yes'], packageRoot, '0.1.0')).toEqual({
      kind: 'delegate',
      arguments: ['add', packageRoot, '--copy', '--yes'],
    });
  });

  it('maps list to non-installing Skills CLI discovery', () => {
    expect(createCliAction(['ls'], packageRoot, '0.1.0')).toEqual({
      kind: 'delegate',
      arguments: ['add', packageRoot, '--list'],
    });
  });

  it('rejects unknown commands', () => {
    expect(createCliAction(['remove'], packageRoot, '0.1.0')).toMatchObject({
      kind: 'print',
      exitCode: 1,
    });
  });
});
