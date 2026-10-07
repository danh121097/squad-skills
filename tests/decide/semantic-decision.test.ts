import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { decide } from '../../src/decide/semantic-decision.ts';

let root: string;
let home: string;
let projectDir: string;
const fetchMock = vi.fn<typeof fetch>();

const request = {
  state: 'Login button does nothing on Safari since yesterday deploy',
  questions: {
    route: {
      type: 'choice',
      instructions: 'Which skill?',
      criteria: { 'squad-fix': 'A concrete bug' },
    },
  },
};
const credentials = { CLOUDFLARE_ACCOUNT_ID: 'account-1', CLOUDFLARE_API_TOKEN: 'secret-token' };
const answers = {
  route: {
    type: 'choice',
    choice: 'squad-fix',
    probabilities: { 'squad-fix': 0.98 },
    confidence: 0.95,
  },
};

async function writeSetting(scopeDir: string, name: string, content: string): Promise<void> {
  await mkdir(path.join(scopeDir, '.squad-skills'), { recursive: true });
  await writeFile(path.join(scopeDir, '.squad-skills', name), content);
}

const enableClefFlash = () =>
  writeSetting(
    home,
    'decide.json',
    JSON.stringify({ enabled: true, provider: 'clef', model: 'clef-flash' })
  );

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'squad-decide-'));
  home = path.join(root, 'home');
  projectDir = path.join(root, 'project');
  await mkdir(home);
  await mkdir(projectDir);
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await rm(root, { recursive: true, force: true });
});

describe('decide', () => {
  it('sends the state and questions to Clef and returns the unwrapped answers', async () => {
    await enableClefFlash();
    fetchMock.mockResolvedValue(
      Response.json({
        success: true,
        errors: [],
        result: { answers, usage: { input_tokens: 259 } },
      })
    );

    const outcome = await decide(request, { env: credentials, home, projectDir });

    expect(outcome).toEqual({
      status: 'decided',
      provider: 'clef',
      model: 'clef-flash',
      answers,
      usage: { input_tokens: 259 },
    });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(
      'https://api.cloudflare.com/client/v4/accounts/account-1/ai/run/@cf/cloudflare/clef-flash'
    );
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer secret-token');
    expect(JSON.parse(String(init?.body))).toEqual({ model: 'clef-flash', ...request });
  });

  it('reports a provider error without echoing the credential', async () => {
    await enableClefFlash();
    fetchMock.mockResolvedValue(
      Response.json(
        { success: false, errors: [{ message: 'Authentication error for secret-token' }] },
        { status: 401 }
      )
    );

    const outcome = await decide(request, { env: credentials, home, projectDir });

    expect(outcome).toEqual({
      status: 'failed',
      reason: 'Clef request failed (HTTP 401): Authentication error for [redacted]',
    });
    expect(JSON.stringify(outcome)).not.toContain('secret-token');
  });

  it.each([
    { name: 'the user has not enabled it', setup: async () => {}, env: credentials },
    { name: 'credentials are missing', setup: enableClefFlash, env: {} },
    {
      name: 'the user names an unknown model',
      setup: () =>
        writeSetting(
          home,
          'decide.json',
          JSON.stringify({ enabled: true, provider: 'clef', model: 'x' })
        ),
      env: credentials,
    },
  ])('makes no network call when $name', async ({ setup, env }) => {
    await setup();

    const outcome = await decide(request, { env, home, projectDir });

    expect(outcome.status).toBe('disabled');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
