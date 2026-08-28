import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseDocument } from 'yaml';

/**
 * Checks that every knowledge card's `source_url` still resolves.
 *
 * `source_status: live` is otherwise an unfalsifiable claim: a person wrote it
 * at review time, nothing re-checks it, and a moved page keeps validating green
 * for as long as the card lives. This closes that hole without breaking the
 * contract's non-goal of autonomous ingestion — it reads a **status code and
 * nothing else**. No response body is ever consumed, so no source page can
 * reach the model, the cards, or the report through this script.
 *
 * Deliberately outside `pnpm test`: the repository gate is offline, and a check
 * that depends on seven third-party hosts is exactly the kind of flake the
 * contract keeps out of it. Run it when reviewing cards, and before a promotion
 * that consumes them.
 */
const knowledgeDirectories = ['evals/squad-designer/knowledge'];
const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const requestTimeoutMs = 20_000;

/** Some documentation hosts answer a bare programmatic request with 403. */
const requestHeaders = {
  accept: 'text/html,application/xhtml+xml',
  'user-agent': 'squad-skills-knowledge-card-check/1.0',
};

interface CardSource {
  declaredStatus: string;
  relativePath: string;
  url: string;
}

interface LivenessResult {
  card: CardSource;
  detail: string;
  state: 'live' | 'dead' | 'unreachable';
}

const projectRoot = process.cwd();
const cards: CardSource[] = [];

for (const directory of knowledgeDirectories) {
  cards.push(...(await readCards(directory)));
}

if (cards.length === 0) {
  console.log('No knowledge cards found.');
  process.exit(0);
}

const results: LivenessResult[] = [];

for (const card of cards) {
  results.push(await check(card));
}

let mismatches = 0;

for (const result of results) {
  const { card } = result;
  const agrees = result.state === card.declaredStatus;

  if (!agrees) mismatches += 1;

  console.log(
    `${agrees ? 'ok  ' : 'FAIL'} ${result.state.padEnd(11)} declared ${card.declaredStatus.padEnd(5)} ${result.detail}  ${card.url}`
  );
}

console.log(
  `\n${results.length} card source(s) checked; ${mismatches} disagree with their declared source_status.`
);

if (mismatches > 0) {
  console.error(
    'Re-review the cards above and update source_status, or correct the URL. ' +
      'A card whose source moved is stale even when every other field is right.'
  );
}

// `unreachable` is not `dead`: a network fault is this machine's problem, not
// the card's, and failing the run for it would train reviewers to ignore this.
process.exit(mismatches > 0 && results.some((result) => result.state !== 'unreachable') ? 1 : 0);

async function readCards(directory: string): Promise<CardSource[]> {
  const absolute = path.join(projectRoot, directory);

  let entries;

  try {
    entries = await readdir(absolute, { withFileTypes: true });
  } catch {
    return [];
  }

  const found: CardSource[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

    const relativePath = path.posix.join(directory, entry.name);
    const source = await readFile(path.join(absolute, entry.name), 'utf8');
    const frontmatter = source.match(frontmatterPattern)?.[1];

    if (frontmatter === undefined) continue;

    const card = parseDocument(frontmatter).toJS() as Record<string, unknown> | null;
    const url = card?.source_url;

    if (typeof url !== 'string') continue;

    found.push({
      declaredStatus: typeof card?.source_status === 'string' ? card.source_status : 'unset',
      relativePath,
      url,
    });
  }

  return found.sort((left, right) => (left.relativePath < right.relativePath ? -1 : 1));
}

/**
 * HEAD first, GET as a fallback for hosts that refuse it. The GET body is
 * cancelled rather than read: the status line is the entire result, and reading
 * further would turn this into the ingestion the contract forbids.
 */
async function check(card: CardSource): Promise<LivenessResult> {
  for (const method of ['HEAD', 'GET'] as const) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      const response = await fetch(card.url, {
        headers: requestHeaders,
        method,
        redirect: 'follow',
        signal: controller.signal,
      });

      await response.body?.cancel();

      if (response.ok) {
        // Fragments never reach the server, so `response.url` drops the anchor
        // on every card citing one. Comparing with the fragment stripped keeps a
        // real redirect visible instead of burying it in six false ones.
        const requested = card.url.split('#')[0];
        const moved = response.url !== requested && response.url !== `${requested}#`;

        return {
          card,
          detail: moved ? `${response.status} redirected to ${response.url}` : `${response.status}`,
          state: 'live',
        };
      }

      // A 4xx from HEAD is often the host refusing the method, not a missing
      // page, so only the GET verdict is allowed to declare a card dead.
      if (method === 'GET') {
        return { card, detail: `${response.status} ${response.statusText}`, state: 'dead' };
      }
    } catch (error) {
      if (method === 'GET') {
        return {
          card,
          detail: `request failed: ${(error as Error).message}`,
          state: 'unreachable',
        };
      }
    } finally {
      clearTimeout(timer);
    }
  }

  return { card, detail: 'no response', state: 'unreachable' };
}
