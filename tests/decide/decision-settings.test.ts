import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { readCredentials, resolveDecisionSelection } from '../../src/decide/decision-settings.ts';

let root: string;
let home: string;
let projectDir: string;

async function writeSetting(scopeDir: string, name: string, content: unknown): Promise<void> {
  await mkdir(path.join(scopeDir, '.squad-skills'), { recursive: true });
  const text = typeof content === 'string' ? content : JSON.stringify(content);
  await writeFile(path.join(scopeDir, '.squad-skills', name), text);
}

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'squad-decide-settings-'));
  home = path.join(root, 'home');
  projectDir = path.join(root, 'project');
  await mkdir(home);
  await mkdir(projectDir);
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const userEnabled = { enabled: true, provider: 'clef', model: 'clef-flash' };

describe('resolveDecisionSelection', () => {
  it.each([
    { name: 'is off with no user settings', user: undefined, project: undefined, enabled: false },
    {
      name: 'is off when the user has not set enabled',
      user: { provider: 'clef', model: 'clef' },
      enabled: false,
    },
    { name: 'is off when user settings are not JSON', user: '{nope', enabled: false },
    { name: 'is on when the user enabled a provider and model', user: userEnabled, enabled: true },
    {
      name: 'cannot be enabled by the project',
      user: undefined,
      project: { enabled: true, provider: 'clef', model: 'clef-flash' },
      enabled: false,
    },
    {
      name: 'can be disabled by the project',
      user: userEnabled,
      project: { enabled: false },
      enabled: false,
    },
    {
      name: 'stays on when the project allows the user choice',
      user: userEnabled,
      project: { providers: ['clef'], models: ['clef-flash'] },
      enabled: true,
    },
    {
      name: 'is off rather than falling back when the project excludes the user model',
      user: userEnabled,
      project: { models: ['clef'] },
      enabled: false,
    },
    {
      name: 'is off when the project excludes the user provider',
      user: userEnabled,
      project: { providers: [] },
      enabled: false,
    },
    {
      name: 'fails closed on an unreadable project file',
      user: userEnabled,
      project: '[',
      enabled: false,
    },
    {
      name: 'fails closed when the project spells enabled as a string',
      user: userEnabled,
      project: { enabled: 'false' },
      enabled: false,
    },
    {
      name: 'fails closed on a key the project misspells',
      user: userEnabled,
      project: { model_list: ['clef'] },
      enabled: false,
    },
    {
      name: 'fails closed when an allowlist is not a list',
      user: userEnabled,
      project: { models: 'clef-flash' },
      enabled: false,
    },
    {
      name: 'ignores a provider or model the project tries to pick',
      user: userEnabled,
      project: { provider: 'other', model: 'clef' },
      enabled: true,
    },
  ])('$name', async ({ user, project, enabled }) => {
    if (user !== undefined) await writeSetting(home, 'decide.json', user);
    if (project !== undefined) await writeSetting(projectDir, 'decide.json', project);

    const selection = await resolveDecisionSelection({ env: {}, home, projectDir });

    expect(selection.enabled).toBe(enabled);
    if (selection.enabled)
      expect(selection).toMatchObject({ provider: 'clef', model: 'clef-flash' });
  });
});

it('applies a project file in a parent of the working directory', async () => {
  await writeSetting(home, 'decide.json', userEnabled);
  await writeSetting(projectDir, 'decide.json', { enabled: false });
  const subdirectory = path.join(projectDir, 'packages', 'app');
  await mkdir(subdirectory, { recursive: true });

  const selection = await resolveDecisionSelection({ env: {}, home, projectDir: subdirectory });

  expect(selection.enabled).toBe(false);
});

it('does not apply the user file as a project file when home is reached through a symlink', async () => {
  // A key outside the project allowlist would disable the layer if the user
  // file were read as a project restriction.
  await writeSetting(home, 'decide.json', { ...userEnabled, $schema: 'decide.schema.json' });
  const linkedHome = path.join(root, 'linked-home');
  await symlink(home, linkedHome);

  const selection = await resolveDecisionSelection({ env: {}, home: linkedHome, projectDir: home });

  expect(selection.enabled).toBe(true);
});

it('is off when home is not an absolute path, so a project file cannot act as the user file', async () => {
  await writeSetting(projectDir, 'decide.json', userEnabled);

  const selection = await resolveDecisionSelection({
    env: {},
    home: path.relative(process.cwd(), projectDir) || '.',
    projectDir,
  });

  expect(selection.enabled).toBe(false);
});

describe('readCredentials', () => {
  const names = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'];

  it('prefers the process env over the user .env file', async () => {
    await writeSetting(
      home,
      '.env',
      'CLOUDFLARE_ACCOUNT_ID=from-file\nexport CLOUDFLARE_API_TOKEN="file-token"\n'
    );

    const credentials = await readCredentials(names, {
      env: { CLOUDFLARE_ACCOUNT_ID: 'from-env' },
      home,
    });

    expect(credentials).toEqual({
      missing: [],
      values: { CLOUDFLARE_ACCOUNT_ID: 'from-env', CLOUDFLARE_API_TOKEN: 'file-token' },
    });
  });

  it('reports what is missing and never reads values from a project .env', async () => {
    await writeSetting(
      projectDir,
      '.env',
      'CLOUDFLARE_ACCOUNT_ID=project\nCLOUDFLARE_API_TOKEN=project\n'
    );

    const credentials = await readCredentials(names, { env: {}, home });
    // A relative home that resolves to the project must not reach its `.env` either.
    const relativeHome = await readCredentials(names, {
      env: {},
      home: path.relative(process.cwd(), projectDir),
    });

    expect(credentials).toEqual({ missing: names, values: {} });
    expect(relativeHome).toEqual({ missing: names, values: {} });
  });
});
