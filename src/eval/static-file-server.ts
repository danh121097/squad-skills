import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import path from 'node:path';

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

export interface StaticServer {
  close: () => Promise<void>;
  origin: string;
}

/**
 * Serves one built directory on loopback for the duration of a run.
 *
 * Loopback-only and read-only on purpose: the contract says the harness runs
 * without network access and without credentials, so grading must not depend on
 * anything the machine can reach. Port 0 lets the OS pick, which keeps parallel
 * runs from colliding.
 *
 * Every request is untrusted: it comes from a page built out of candidate
 * output. That makes two things load-bearing beyond the traversal check — no
 * request may crash the process, and no response may leave the served root.
 */
export async function serveDirectory(root: string): Promise<StaticServer> {
  const realRoot = await realpath(root);
  const server = createServer((request, response) => {
    // An unhandled rejection here terminates the eval process, and a candidate
    // can trigger one with a single `fetch("/%zz")`: a malformed escape throws
    // out of `decodeURIComponent` before any handler inside `respond` runs.
    respond(realRoot, request.url ?? '/', response).catch(() => {
      if (!response.headersSent) response.writeHead(400);
      response.end();
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  const port = typeof address === 'object' && address !== null ? address.port : 0;

  return {
    close: () => closeServer(server),
    origin: `http://127.0.0.1:${port}`,
  };
}

async function respond(
  realRoot: string,
  url: string,
  response: import('node:http').ServerResponse
): Promise<void> {
  const requested = safeDecode(url.split('?')[0] ?? '/');

  if (requested === null) {
    response.writeHead(400).end();
    return;
  }

  const relative = requested === '/' ? 'index.html' : requested.replace(/^\/+/, '');
  const resolved = path.resolve(realRoot, relative);

  if (escapesRoot(realRoot, resolved)) {
    response.writeHead(403).end();
    return;
  }

  try {
    const stats = await stat(resolved);

    if (!stats.isFile()) {
      response.writeHead(404).end();
      return;
    }

    // The lexical check above is blind to symlinks, and a link inside the built
    // output resolves anywhere on disk. Comparing real paths is what actually
    // confines the server to the directory it was asked to serve.
    if (escapesRoot(realRoot, await realpath(resolved))) {
      response.writeHead(403).end();
      return;
    }

    response.writeHead(200, {
      'cache-control': 'no-store',
      'content-type':
        contentTypes[path.extname(resolved).toLowerCase()] ?? 'application/octet-stream',
    });

    // `stat` succeeding does not mean `open` will: an unreadable file, or one
    // removed in between, emits on the stream after the try block has returned.
    // Without this listener that error is uncaught and the process exits.
    createReadStream(resolved)
      .on('error', () => response.end())
      .pipe(response);
  } catch {
    response.writeHead(404).end();
  }
}

/**
 * A path escapes when it is outside the root, not when its name starts with two
 * dots: `..config.json` is an ordinary file and was being refused.
 */
function escapesRoot(realRoot: string, candidate: string): boolean {
  const relative = path.relative(realRoot, candidate);

  return relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
}

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.closeAllConnections();
    server.close(() => resolve());
  });
}
