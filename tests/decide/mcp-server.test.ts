import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const entrypoint = path.join(projectRoot, 'src', 'decide', 'mcp-server.ts');

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'squad-decide-server-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

/**
 * Writes newline-delimited JSON-RPC to a real server process, with an empty
 * HOME so no user settings or credentials exist, and returns every reply once
 * stdin closes and the process exits on its own.
 */
function exchange(
  lines: string[]
): Promise<{ code: number; replies: Array<Record<string, unknown>> }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [entrypoint], {
      cwd: root,
      env: { PATH: process.env.PATH, HOME: root },
      stdio: ['pipe', 'pipe', 'inherit'],
    });
    let stdout = '';
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
    child.once('error', reject);
    child.once('close', (code) =>
      resolve({
        code: code ?? -1,
        replies: stdout
          .split('\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line) as Record<string, unknown>),
      })
    );
    // Two messages in one write exercises splitting a chunk into lines.
    child.stdin.end(lines.join('\n') + '\n');
  });
}

const rpc = (id: number | undefined, method: string, params?: unknown) =>
  JSON.stringify({
    jsonrpc: '2.0',
    ...(id === undefined ? {} : { id }),
    method,
    ...(params ? { params } : {}),
  });

describe('decide MCP server', () => {
  it('answers the handshake, lists a data-only decide tool, and reports disabled by default', async () => {
    const { code, replies } = await exchange([
      rpc(1, 'initialize', {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 't', version: '0' },
      }),
      rpc(undefined, 'notifications/initialized'),
      rpc(2, 'tools/list'),
      rpc(3, 'tools/call', {
        name: 'decide',
        arguments: { state: 'x', questions: { q: { type: 'noul', instructions: 'Is it?' } } },
      }),
      rpc(4, 'unknown/method'),
      rpc(5, 'initialize', { protocolVersion: '1999-01-01' }),
      '{not json',
      'null',
      '[]',
      JSON.stringify({ jsonrpc: '2.0', id: 9, result: {} }),
      JSON.stringify({ jsonrpc: '2.0', id: 10, method: 5 }),
      '{}',
      JSON.stringify({ jsonrpc: '2.0', id: { a: 1 }, method: 'ping' }),
      rpc(6, 'ping'),
    ]);
    const byId = new Map(replies.map((reply) => [reply.id, reply]));
    const unidentified = replies.filter((reply) => reply.id === null).map((reply) => reply.error);

    // The malformed lines are answered without stopping the server, which still
    // answers the ping after them; the client's own response gets no reply, but a
    // request with a non-string method is answered with its id, and one with an
    // unreadable id is answered with a null id.
    expect(code).toBe(0);
    expect(replies).toHaveLength(12);
    expect(byId.get(6)?.result).toEqual({});
    expect(byId.has(9)).toBe(false);
    expect(byId.get(10)?.error).toMatchObject({ code: -32600 });
    expect(byId.get(1)?.result).toMatchObject({
      protocolVersion: '2025-06-18',
      capabilities: { tools: {} },
    });

    const tools = (
      byId.get(2)?.result as { tools: Array<{ name: string; inputSchema: { properties: object } }> }
    ).tools;
    expect(tools.map((tool) => tool.name)).toEqual(['decide']);
    expect(Object.keys(tools[0]?.inputSchema.properties ?? {}).sort()).toEqual([
      'questions',
      'state',
    ]);

    const call = byId.get(3)?.result as { content: Array<{ text: string }>; isError: boolean };
    expect(call.isError).toBe(false);
    expect(JSON.parse(call.content[0]?.text ?? '{}')).toMatchObject({ status: 'disabled' });

    expect(byId.get(4)?.error).toMatchObject({ code: -32601 });
    expect(byId.get(5)?.result).toMatchObject({ protocolVersion: '2025-11-25' });
    expect(unidentified).toEqual([
      { code: -32700, message: 'Parse error' },
      { code: -32600, message: 'Invalid Request' },
      { code: -32600, message: 'Invalid Request' },
      { code: -32600, message: 'Invalid Request' },
      { code: -32600, message: 'Invalid Request' },
    ]);
  });
});
