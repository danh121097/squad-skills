/**
 * Cloudflare Clef on Workers AI. The request body is the Jev-compatible
 * `{ model, state, questions }`; the REST API wraps the model's reply in the
 * usual `{ success, errors, result }` envelope, and `result.answers` is passed
 * through unchanged so no answer type is reshaped here.
 */
import { ProviderUnavailableError } from './provider-unavailable.ts';
import type { DecisionProvider } from './semantic-decision.ts';

const requestTimeoutMs = 15_000;
// Workers AI error 3036: the account used its daily free allocation, which
// resets at 00:00 UTC. Any other limit answers HTTP 429.
const dailyAllocationExceeded = 3036;
const defaultCooldownMs = 60_000;

interface CloudflareEnvelope {
  errors?: Array<{ code?: number; message?: string }>;
  result?: { answers?: Record<string, unknown>; usage?: unknown };
  success?: boolean;
}

function nextUtcMidnight(now: number): number {
  const today = new Date(now);
  return Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1);
}

/** When a rate-limited or exhausted account may be called again. */
function retryAt(response: Response, quotaExhausted: boolean): Date {
  const now = Date.now();
  const midnight = nextUtcMidnight(now);
  if (quotaExhausted) return new Date(midnight);
  // Retry-After is either seconds or an HTTP date.
  const header = response.headers.get('Retry-After')?.trim() ?? '';
  const at = /^\d+$/.test(header) ? now + Number(header) * 1000 : Date.parse(header);
  const wait = Number.isFinite(at) && at > now ? at : now + defaultCooldownMs;
  // The daily reset lifts every limit, so no header holds the breaker past it.
  return new Date(Math.min(wait, midnight));
}

export const clefProvider: DecisionProvider = {
  name: 'clef',
  models: ['clef', 'clef-flash'],
  credentialNames: ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'],

  async decide(request, model, credentials) {
    const accountId = encodeURIComponent(credentials.CLOUDFLARE_ACCOUNT_ID ?? '');
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/cloudflare/${model}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.CLOUDFLARE_API_TOKEN ?? ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, state: request.state, questions: request.questions }),
      signal: AbortSignal.timeout(requestTimeoutMs),
    });

    const envelope = (await response.json().catch(() => null)) as CloudflareEnvelope | null;
    const answers = envelope?.result?.answers;
    if (
      !response.ok ||
      envelope?.success !== true ||
      typeof answers !== 'object' ||
      answers === null
    ) {
      const token = credentials.CLOUDFLARE_API_TOKEN ?? '';
      // Relay Cloudflare's messages, but never a copy of the token inside one.
      const messages = (envelope?.errors ?? [])
        .map((error) => error.message)
        .filter((message): message is string => Boolean(message))
        .map((message) => (token ? message.replaceAll(token, '[redacted]') : message));
      const detail = messages.length > 0 ? `: ${messages.join('; ')}` : '';
      const reason = `Clef request failed (HTTP ${response.status})${detail}`;
      const quotaExhausted = (envelope?.errors ?? []).some(
        (error) => error.code === dailyAllocationExceeded
      );
      if (response.status === 429 || quotaExhausted) {
        throw new ProviderUnavailableError(reason, retryAt(response, quotaExhausted));
      }
      throw new Error(reason);
    }
    return { answers, usage: envelope?.result?.usage ?? null };
  },
};
