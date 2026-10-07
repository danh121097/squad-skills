/**
 * Cloudflare Clef on Workers AI. The request body is the Jev-compatible
 * `{ model, state, questions }`; the REST API wraps the model's reply in the
 * usual `{ success, errors, result }` envelope, and `result.answers` is passed
 * through unchanged so no answer type is reshaped here.
 */
import type { DecisionProvider } from './semantic-decision.ts';

const requestTimeoutMs = 15_000;

interface CloudflareEnvelope {
  errors?: Array<{ message?: string }>;
  result?: { answers?: Record<string, unknown>; usage?: unknown };
  success?: boolean;
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
      throw new Error(`Clef request failed (HTTP ${response.status})${detail}`);
    }
    return { answers, usage: envelope?.result?.usage ?? null };
  },
};
