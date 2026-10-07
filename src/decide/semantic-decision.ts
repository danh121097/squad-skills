/**
 * The provider-agnostic decision layer. A caller passes a state and a map of
 * typed questions; a provider returns one answer per question with
 * probabilities. No provider is named outside the registry below, so adding or
 * swapping one never touches a caller.
 *
 * A decision is advice. Nothing here acts on an answer.
 */
import { clefProvider } from './clef-provider.ts';
import {
  readCredentials,
  resolveDecisionSelection,
  type DecisionContext,
} from './decision-settings.ts';

export interface DecisionRequest {
  questions: Record<string, unknown>;
  state: unknown;
}

export interface ProviderAnswer {
  answers: Record<string, unknown>;
  usage: unknown;
}

export interface DecisionProvider {
  credentialNames: readonly string[];
  decide(
    request: DecisionRequest,
    model: string,
    credentials: Record<string, string>
  ): Promise<ProviderAnswer>;
  models: readonly string[];
  name: string;
}

export type DecisionOutcome =
  | ({ status: 'decided'; model: string; provider: string } & ProviderAnswer)
  | { status: 'disabled'; reason: string }
  | { status: 'failed'; reason: string };

const decisionProviders: Record<string, DecisionProvider> = {
  [clefProvider.name]: clefProvider,
};

/** Checks the request shape this layer relies on; the provider validates the questions themselves. */
export function readDecisionRequest(input: unknown): DecisionRequest | string {
  if (typeof input !== 'object' || input === null) return 'Arguments must be an object.';
  const { state, questions } = input as Record<string, unknown>;
  if (state === undefined || state === null) return '"state" is required.';
  if (typeof questions !== 'object' || questions === null || Array.isArray(questions)) {
    return '"questions" must be an object of named questions.';
  }
  if (Object.keys(questions).length === 0) return '"questions" must name at least one question.';
  return { state, questions: questions as Record<string, unknown> };
}

export async function decide(
  request: DecisionRequest,
  context: DecisionContext
): Promise<DecisionOutcome> {
  const selection = await resolveDecisionSelection(context);
  if (!selection.enabled) return { status: 'disabled', reason: selection.reason };

  const provider = Object.hasOwn(decisionProviders, selection.provider)
    ? decisionProviders[selection.provider]
    : undefined;
  if (provider === undefined) {
    const known = Object.keys(decisionProviders).join(', ');
    return {
      status: 'disabled',
      reason: `Unknown provider "${selection.provider}". Known: ${known}.`,
    };
  }
  if (!provider.models.includes(selection.model)) {
    const known = provider.models.join(', ');
    return {
      status: 'disabled',
      reason: `Unknown model "${selection.model}" for ${provider.name}. Known: ${known}.`,
    };
  }

  const credentials = await readCredentials(provider.credentialNames, context);
  if (credentials.missing.length > 0) {
    return {
      status: 'disabled',
      reason: `Missing ${credentials.missing.join(', ')}. Set them in the environment or ~/.squad-skills/.env.`,
    };
  }

  try {
    const answer = await provider.decide(request, selection.model, credentials.values);
    return { status: 'decided', provider: provider.name, model: selection.model, ...answer };
  } catch (error) {
    return { status: 'failed', reason: error instanceof Error ? error.message : String(error) };
  }
}
