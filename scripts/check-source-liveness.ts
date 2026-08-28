import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseDocument } from 'yaml';

import { cardTemplateFileName } from '../src/eval/knowledge-card-schema.ts';

/**
 * Checks that every cited source still resolves: a knowledge card's
 * `source_url`, and every link in a skill's source registry.
 *
 * `source_status: live` is otherwise an unfalsifiable claim: a person wrote it
 * at review time, nothing re-checks it, and a moved page keeps validating green
 * for as long as the card lives. The registry has the same problem and no field
 * to declare it in — a contributor adds an entry, the vendor reorganizes its
 * documentation, and the skill keeps pointing agents at a 404. This closes both
 * without breaking the contract's non-goal of autonomous ingestion: it reads a
 * **status code and nothing else**. No response body is ever consumed, so no
 * source page can reach the model, the cards, or the report through this script.
 *
 * Deliberately outside `pnpm test`: the repository gate is offline, and a check
 * that depends on dozens of third-party hosts is exactly the kind of flake the
 * contract keeps out of it. It runs on pull requests as its own non-blocking
 * job, and before a promotion that consumes these sources.
 */
const knowledgeDirectories = ['evals/squad-designer/knowledge'];

/**
 * Source registries, named rather than globbed. Every link in one of these is a
 * source an agent is told to trust; links in ordinary references are prose.
 */
const sourceRegistryFiles = ['skills/squad-designer/references/official-sources.md'];

const markdownLinkPattern = /\]\((https:\/\/[^\s)]+)\)/g;
const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const requestTimeoutMs = 20_000;

/** Some documentation hosts answer a bare programmatic request with 403. */
const requestHeaders = {
  accept: 'text/html,application/xhtml+xml',
  'user-agent': 'squad-skills-source-liveness-check/1.0',
};

/**
 * Statuses that mean "this host declines to answer a script", not "this page is
 * gone". The registry deliberately lists sources behind an account or a paywall,
 * and a rate limit says nothing about the page. Calling these dead would make
 * the check cry wolf on every run, which is how a report stops being read.
 */
const accessControlledStatuses = new Set([401, 403, 429]);

interface CitedSource {
  declaredStatus: string;
  relativePath: string;
  url: string;
}

interface LivenessResult {
  card: CitedSource;
  detail: string;
  state: 'live' | 'dead' | 'unreachable';
}

const projectRoot = process.cwd();
const cards: CitedSource[] = [];

for (const directory of knowledgeDirectories) {
  cards.push(...(await readCards(directory)));
}

for (const file of sourceRegistryFiles) {
  cards.push(...(await readRegistryLinks(file)));
}

if (cards.length === 0) {
  console.log('No cited sources found.');
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
    `${agrees ? 'ok  ' : 'FAIL'} ${result.state.padEnd(11)} expected ${card.declaredStatus.padEnd(5)} ${result.detail.padEnd(24)} ${card.url}  (${card.relativePath})`
  );
}

console.log(
  `\n${results.length} cited source(s) checked; ${mismatches} disagree with the status they are recorded as having.`
);

// `unreachable` is not `dead`: a network fault is this machine's problem, not
// the source's, and failing the run for it would train reviewers to ignore this.
// The test is per-result — an earlier version asked whether *any* result was
// reachable, so one live source turned every network fault in the same run into
// a failure, which is exactly the noise this exemption exists to prevent.
const blocking = results.filter(
  (result) => result.state !== result.card.declaredStatus && result.state !== 'unreachable'
);

if (blocking.length > 0) {
  console.error(
    `${blocking.length} of them moved or went away. Re-review those entries and update ` +
      'source_status, or correct the URL. A card whose source moved is stale even when ' +
      'every other field is right, and a registry entry pointing at a dead page sends ' +
      'agents there.'
  );
}

process.exit(blocking.length > 0 ? 1 : 0);

/**
 * Registry links carry no declared status, so they are expected to be live: an
 * entry is a source this repository tells agents to use.
 */
async function readRegistryLinks(file: string): Promise<CitedSource[]> {
  let source: string;

  try {
    source = await readFile(path.join(projectRoot, file), 'utf8');
  } catch {
    return [];
  }

  const seen = new Set<string>();
  const found: CitedSource[] = [];

  for (const match of source.matchAll(markdownLinkPattern)) {
    const url = match[1] as string;

    if (seen.has(url)) continue;

    seen.add(url);
    found.push({ declaredStatus: 'live', relativePath: file, url });
  }

  return found.sort((left, right) => (left.url < right.url ? -1 : 1));
}

async function readCards(directory: string): Promise<CitedSource[]> {
  const absolute = path.join(projectRoot, directory);

  let entries;

  try {
    entries = await readdir(absolute, { withFileTypes: true });
  } catch {
    return [];
  }

  const found: CitedSource[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    // The contributor scaffold carries a placeholder URL, not a source.
    if (entry.name === cardTemplateFileName) continue;

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
async function check(card: CitedSource): Promise<LivenessResult> {
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
      // page, so only the GET verdict is allowed to declare a source dead.
      if (method === 'GET') {
        return {
          card,
          detail: `${response.status} ${response.statusText}`,
          state: accessControlledStatuses.has(response.status) ? 'unreachable' : 'dead',
        };
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
