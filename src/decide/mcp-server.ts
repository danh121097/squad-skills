/**
 * A local stdio MCP server exposing one tool, `decide`, over the semantic
 * decision layer. Run it with `node src/decide/mcp-server.ts`; `dist/` does not
 * bundle it.
 *
 * The protocol is newline-delimited JSON-RPC 2.0, written by hand so the server
 * carries no dependency. stdout carries protocol messages only.
 *
 * The tool takes data only: `state` and `questions`. Provider and model come
 * from the user's settings, never from a tool call, so content that steers the
 * calling agent cannot choose where its context is sent.
 */
import os from 'node:os';
import process from 'node:process';
import readline from 'node:readline';

import { decide, readDecisionRequest } from './semantic-decision.ts';

// Only the versions with the `initialize` handshake. 2026-07-28 replaced it with
// per-request versions and `server/discover`, which this server does not speak.
const latestProtocolVersion = '2025-11-25';
const supportedProtocolVersions = new Set([
  latestProtocolVersion,
  '2025-06-18',
  '2025-03-26',
  '2024-11-05',
]);

const decideTool = {
  name: 'decide',
  description:
    'Ask a fast decision model a constrained question about a state and get back one typed answer per question ' +
    'with probabilities. Advisory only: an answer never authorizes an action, lowers a gate tier or drops a ' +
    'finding. Off unless the user enabled it in ~/.squad-skills/decide.json; when it reports "disabled", decide ' +
    'without it.',
  inputSchema: {
    type: 'object',
    properties: {
      state: { description: 'The context to decide on: a string, object or array.' },
      questions: {
        type: 'object',
        description:
          'Map of question id to a typed question: { "type": "noul" | "choice" | "score", "instructions": string, ' +
          '"criteria": object of option to description (choice) or ordered list of labels (score) }.',
        additionalProperties: { type: 'object' },
      },
    },
    required: ['state', 'questions'],
  },
};

type JsonRpcId = string | number | null;

interface JsonRpcMessage {
  id?: JsonRpcId;
  method?: string;
  params?: Record<string, unknown>;
}

function send(message: Record<string, unknown>): void {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', ...message })}\n`);
}

function toolResult(payload: unknown, isError: boolean) {
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }], isError };
}

async function callTool(params: Record<string, unknown> | undefined) {
  if (params?.name !== decideTool.name) {
    return toolResult(
      { status: 'failed', reason: `Unknown tool "${String(params?.name)}".` },
      true
    );
  }
  const request = readDecisionRequest(params.arguments);
  if (typeof request === 'string') return toolResult({ status: 'failed', reason: request }, true);

  const outcome = await decide(request, {
    env: process.env,
    home: os.homedir(),
    projectDir: process.cwd(),
  });
  return toolResult(outcome, outcome.status === 'failed');
}

async function handle(message: JsonRpcMessage): Promise<unknown> {
  switch (message.method) {
    case 'initialize': {
      const requested = message.params?.protocolVersion;
      return {
        protocolVersion:
          typeof requested === 'string' && supportedProtocolVersions.has(requested)
            ? requested
            : latestProtocolVersion,
        capabilities: { tools: {} },
        serverInfo: { name: 'squad-decide', version: '0.1.0' },
      };
    }
    case 'ping':
      return {};
    case 'tools/list':
      return { tools: [decideTool] };
    case 'tools/call':
      return callTool(message.params);
    default:
      throw Object.assign(new Error(`Method not found: ${String(message.method)}`), {
        code: -32601,
      });
  }
}

async function receive(line: string): Promise<void> {
  if (line.trim() === '') return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    send({ id: null, error: { code: -32700, message: 'Parse error' } });
    return;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    send({ id: null, error: { code: -32600, message: 'Invalid Request' } });
    return;
  }
  const message = parsed as JsonRpcMessage;
  const invalidRequest = (id: JsonRpcId) =>
    send({ id, error: { code: -32600, message: 'Invalid Request' } });
  // Only a string or number id is echoed; any other id cannot be read back.
  const readableId =
    typeof message.id === 'string' || typeof message.id === 'number' ? message.id : null;
  if (typeof message.method !== 'string') {
    // A response from the client carries a result or an error and gets no
    // reply; anything else without a method is an invalid request.
    if (!Object.hasOwn(message, 'result') && !Object.hasOwn(message, 'error')) {
      invalidRequest(readableId);
    }
    return;
  }
  // A notification has no id and gets no reply.
  if (message.id === undefined) return;
  if (message.id !== null && readableId === null) {
    invalidRequest(null);
    return;
  }
  try {
    send({ id: message.id, result: await handle(message) });
  } catch (error) {
    const code = (error as { code?: number }).code ?? -32603;
    send({
      id: message.id,
      error: { code, message: error instanceof Error ? error.message : 'Internal error' },
    });
  }
}

// The process ends on its own once stdin closes and in-flight calls finish.
readline.createInterface({ input: process.stdin, crlfDelay: Infinity }).on('line', (line) => {
  receive(line).catch(() => send({ id: null, error: { code: -32603, message: 'Internal error' } }));
});
