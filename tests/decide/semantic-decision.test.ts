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
  vi.useRealTimers();
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

    const outcome = await decide(request, { env: credentials, home, projectDir }, new Map());

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

  it('reports a provider error without echoing the credential, and calls again next time', async () => {
    await enableClefFlash();
    fetchMock.mockImplementation(async () =>
      Response.json(
        { success: false, errors: [{ message: 'Authentication error for secret-token' }] },
        { status: 401 }
      )
    );
    const cooldowns = new Map();

    const outcome = await decide(request, { env: credentials, home, projectDir }, cooldowns);
    await decide(request, { env: credentials, home, projectDir }, cooldowns);

    expect(outcome).toEqual({
      status: 'failed',
      reason: 'Clef request failed (HTTP 401): Authentication error for [redacted]',
    });
    expect(JSON.stringify(outcome)).not.toContain('secret-token');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('stops calling an exhausted account until the daily reset at 00:00 UTC', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-07T15:00:00Z'));
    await enableClefFlash();
    fetchMock.mockResolvedValueOnce(
      Response.json(
        {
          success: false,
          errors: [{ code: 3036, message: 'You have used up your daily free allocation' }],
        },
        { status: 429 }
      )
    );
    const context = { env: credentials, home, projectDir };
    const cooldowns = new Map();

    const first = await decide(request, context, cooldowns);
    const second = await decide(request, context, cooldowns);

    const unavailable = {
      status: 'unavailable',
      reason: 'Clef request failed (HTTP 429): You have used up your daily free allocation',
      retryAt: '2026-10-08T00:00:00.000Z',
    };
    expect(first).toEqual(unavailable);
    expect(second).toEqual(unavailable);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-10-08T00:00:00Z'));
    fetchMock.mockResolvedValueOnce(
      Response.json({ success: true, errors: [], result: { answers, usage: null } })
    );
    expect((await decide(request, context, cooldowns)).status).toBe('decided');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each<{ name: string; headers: Record<string, string>; retryAt: string }>([
    {
      name: 'Retry-After seconds',
      headers: { 'Retry-After': '30' },
      retryAt: '2026-10-07T15:00:30.000Z',
    },
    {
      name: 'a Retry-After date',
      headers: { 'Retry-After': 'Wed, 07 Oct 2026 15:05:00 GMT' },
      retryAt: '2026-10-07T15:05:00.000Z',
    },
    { name: 'no Retry-After', headers: {}, retryAt: '2026-10-07T15:01:00.000Z' },
    {
      name: 'a Retry-After past the reset',
      headers: { 'Retry-After': '86400' },
      retryAt: '2026-10-08T00:00:00.000Z',
    },
  ])('backs off a rate limit with $name', async ({ headers, retryAt }) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-07T15:00:00Z'));
    await enableClefFlash();
    fetchMock.mockResolvedValue(
      Response.json(
        { success: false, errors: [{ code: 3040, message: 'Capacity temporarily exceeded' }] },
        { status: 429, headers }
      )
    );

    const outcome = await decide(request, { env: credentials, home, projectDir }, new Map());

    expect(outcome).toMatchObject({ status: 'unavailable', retryAt });
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

    const outcome = await decide(request, { env, home, projectDir }, new Map());

    expect(outcome.status).toBe('disabled');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
