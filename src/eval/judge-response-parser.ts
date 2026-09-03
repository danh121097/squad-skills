import { unknownUsage, type JudgeResponse, type JudgeUsage } from './pairwise-judge.ts';

/**
 * One rubric schema and one response reader, shared by every judge client.
 *
 * It lives apart from the clients because the two providers disagree on shape
 * and agree on contract. Codex streams JSONL and can be handed a server-side
 * `--output-schema`; the Claude CLI returns a single object whose `result` is
 * free text that was merely *asked* for JSON. Letting one client own the other's
 * parsing is how a reader tuned for the first silently mis-reads the second.
 *
 * What the reader must never do is guess. An absent field stays `null` so the
 * report can say "unknown", and a wrong-shaped answer stays `null` so the pair
 * is `inconclusive` rather than a fabricated preference.
 */

/**
 * The schema the judge must fill.
 *
 * `criteria` is required and its rubric ids are enumerated, so a judge cannot
 * answer with a preference and no reasons; `evidence` is listed before `winner`
 * in the property order the schema declares, which is the order a structured
 * decoder emits.
 */
export function rubricOutputSchema(rubricIds: readonly string[]): Record<string, unknown> {
  return {
    additionalProperties: false,
    properties: {
      criteria: {
        items: {
          additionalProperties: false,
          properties: {
            evidence: { minLength: 1, type: 'string' },
            rubric: { enum: [...rubricIds], type: 'string' },
            winner: { enum: ['entry-a', 'entry-b', 'tie'], type: 'string' },
          },
          required: ['rubric', 'evidence', 'winner'],
          type: 'object',
        },
        // Bounded at both ends: exactly one row per declared rubric. Without the
        // ceiling a decoder may legally repeat a row or add one nobody asked
        // for, and the reader then has to reject an answer the schema allowed.
        maxItems: rubricIds.length,
        minItems: rubricIds.length,
        type: 'array',
      },
      overall: { enum: ['entry-a', 'entry-b', 'tie'], type: 'string' },
    },
    required: ['criteria', 'overall'],
    type: 'object',
  };
}

/** Reads a JSONL stream: one JSON value per line, non-JSON lines ignored. */
export function readJsonValues(stdout: string): unknown[] {
  const values: unknown[] = [];

  for (const line of stdout.split('\n')) {
    const trimmed = line.trim();

    if (trimmed.length === 0) continue;

    try {
      values.push(JSON.parse(trimmed));
    } catch {
      // A non-JSON line is banner output, not an error worth failing on.
    }
  }

  return values;
}

/**
 * Depth-first search for the schema-shaped payload, including JSON carried
 * inside a string — fenced, prefixed by prose, or both.
 */
export function findResponse(value: unknown): JudgeResponse | null {
  if (typeof value === 'string') {
    for (const candidate of jsonCandidates(value)) {
      let parsed: unknown;

      try {
        parsed = JSON.parse(candidate);
      } catch {
        continue;
      }

      const found = findResponse(parsed);

      if (found) return found;
    }

    return null;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findResponse(entry);

      if (found) return found;
    }

    return null;
  }

  if (typeof value !== 'object' || value === null) return null;

  const record = value as Record<string, unknown>;
  const response = readResponse(record);

  if (response) return response;

  for (const entry of Object.values(record)) {
    const found = findResponse(entry);

    if (found) return found;
  }

  return null;
}

/**
 * Merges every usage-shaped node in a payload, keeping the largest value seen
 * per field.
 *
 * Both providers report usage more than once — Codex emits a per-turn and a
 * cumulative object, Claude splits tokens into a nested `usage` and cost into a
 * top-level field. Taking the first match makes the recorded total depend on
 * JSON key order; taking the maximum is order-independent and picks the
 * cumulative figure, which is the one a budget is spent against.
 */
export function collectUsage(value: unknown): JudgeUsage {
  const usage: JudgeUsage = { ...unknownUsage };

  for (const node of usageNodes(value)) {
    for (const field of Object.keys(node) as Array<keyof JudgeUsage>) {
      const found = node[field];

      if (typeof found !== 'number') continue;

      const current = usage[field];

      usage[field] = current === null ? found : Math.max(current, found);
    }
  }

  return usage;
}

/** Fenced blocks first, then the widest brace-delimited span in the text. */
function jsonCandidates(text: string): string[] {
  const candidates: string[] = [];
  const fenced = text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g);

  for (const match of fenced) {
    const body = (match[1] ?? '').trim();

    if (body.startsWith('{') || body.startsWith('[')) candidates.push(body);
  }

  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');

  if (start !== -1 && end > start) candidates.push(trimmed.slice(start, end + 1));

  return candidates;
}

const sides = new Set(['entry-a', 'entry-b', 'tie']);

/**
 * Accepts a record only when every field is already the right type.
 *
 * Nothing is coerced. A numeric `evidence` stringified to `"0.5"` would clear
 * the blank-evidence check downstream, which is exactly the fabricated evidence
 * the schema exists to prevent.
 */
function readResponse(record: Record<string, unknown>): JudgeResponse | null {
  if (!Array.isArray(record.criteria) || record.criteria.length === 0) return null;
  if (typeof record.overall !== 'string' || !sides.has(record.overall)) return null;

  const criteria: JudgeResponse['criteria'] = [];

  for (const entry of record.criteria) {
    if (typeof entry !== 'object' || entry === null) return null;

    const criterion = entry as Record<string, unknown>;

    if (typeof criterion.rubric !== 'string' || criterion.rubric.trim().length === 0) return null;
    if (typeof criterion.evidence !== 'string' || criterion.evidence.trim().length === 0) {
      return null;
    }
    if (typeof criterion.winner !== 'string' || !sides.has(criterion.winner)) return null;

    criteria.push({
      evidence: criterion.evidence,
      rubric: criterion.rubric,
      winner: criterion.winner as JudgeResponse['criteria'][number]['winner'],
    });
  }

  return { criteria, overall: record.overall as JudgeResponse['overall'] };
}

function usageNodes(value: unknown): Array<Partial<Record<keyof JudgeUsage, number>>> {
  if (Array.isArray(value)) return value.flatMap((entry) => usageNodes(entry));
  if (typeof value !== 'object' || value === null) return [];

  const record = value as Record<string, unknown>;
  const fields: Partial<Record<keyof JudgeUsage, number>> = {};

  assign(fields, 'inputTokens', record, ['input_tokens', 'prompt_tokens']);
  assign(fields, 'outputTokens', record, ['output_tokens', 'completion_tokens']);
  assign(fields, 'cachedTokens', record, [
    'cache_read_input_tokens',
    'cached_input_tokens',
    'cached_tokens',
  ]);
  assign(fields, 'totalTokens', record, ['total_tokens']);
  assign(fields, 'costUsd', record, ['total_cost_usd', 'cost_usd']);

  const nested = Object.values(record).flatMap((entry) => usageNodes(entry));

  return Object.keys(fields).length > 0 ? [fields, ...nested] : nested;
}

function assign(
  target: Partial<Record<keyof JudgeUsage, number>>,
  field: keyof JudgeUsage,
  record: Record<string, unknown>,
  keys: readonly string[]
): void {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      target[field] = value;
      return;
    }
  }
}
