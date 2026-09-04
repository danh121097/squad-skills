import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseDocument } from 'yaml';

import { cardTemplateFileName } from '../src/eval/knowledge-card-schema.ts';
import {
  describeRegistryDiscoveryFailure,
  extractRegistryUrls,
  findSourceRegistries,
} from '../src/eval/source-registry-links.ts';

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
 *
 * 418 joined the set when discovery widened past one registry: freedesktop.org
 * sits behind a proof-of-work bot gateway that answers 418 with a challenge
 * page. It is intermittent — the same URL answered 418 on one run and 200 on
 * the next, and the host serves ordinary 404s when the gateway is off — so a
 * 418 says the challenge was up, not that the page is gone. Note the cost: a
 * removed page behind an active gateway also answers 418, so a real removal
 * reads as unreachable until the gateway lifts. That is the same trade the
 * other statuses here make, and it fails toward a report that stays readable.
 */
const accessControlledStatuses = new Set([401, 403, 418, 429]);

interface CitedSource {
  declaredStatus: string;
  /** Every file citing this URL. A source shared by two registries is one request. */
  relativePaths: string[];
  url: string;
}

interface RegistryRead {
  cards: CitedSource[];
  /** Registries that exist but yielded nothing checkable, one message each. */
  failures: string[];
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

const discovery = await findSourceRegistries(projectRoot);

const discoveryFailure = describeRegistryDiscoveryFailure(discovery);

if (discoveryFailure !== undefined) {
  console.error(discoveryFailure);
  process.exit(1);
}

const registryRead = await readRegistryLinks(discovery.registries);

// A registry that exists but yields nothing to check is the same blindness one
// level down: discovery counts it, the guard above cannot fire, and the run
// reports the remaining cards green without ever saying the file went unread.
if (registryRead.failures.length > 0) {
  for (const failure of registryRead.failures) console.error(failure);
  process.exit(1);
}

cards.push(...registryRead.cards);

if (cards.length === 0) {
  console.log('No cited sources found.');
  process.exit(0);
}

/**
 * Bounded, not serial and not unbounded.
 *
 * Serially each source can spend two 20-second attempts, so a catalog of this
 * size runs far past the 10-minute job — the report is killed rather than read.
 * A `Promise.all` over every card would instead open the whole catalog at once
 * and manufacture rate-limit responses from the few hosts that carry most of
 * it. Six in flight keeps the wall clock inside the cap without making a host
 * answer for the pace. Widening discovery from one registry to every skill's
 * multiplied the source count, so this bound now matters more than when it was
 * written, and the global dedup below is what keeps it affordable.
 */
const requestConcurrency = 6;

// Written by index, so the printed order stays the catalog order no matter
// which host answers first. Diffing one run against the next depends on that.
const results = new Array<LivenessResult>(cards.length);
let nextCard = 0;

await Promise.all(
  Array.from({ length: Math.min(requestConcurrency, cards.length) }, async () => {
    for (let index = nextCard++; index < cards.length; index = nextCard++) {
      const card = cards[index];

      if (card !== undefined) results[index] = await check(card);
    }
  })
);

let mismatches = 0;

for (const result of results) {
  const { card } = result;
  const agrees = result.state === card.declaredStatus;

  if (!agrees) mismatches += 1;

  console.log(
    `${agrees ? 'ok  ' : 'FAIL'} ${result.state.padEnd(11)} expected ${card.declaredStatus.padEnd(5)} ${result.detail.padEnd(24)} ${card.url}  (${card.relativePaths.join(', ')})`
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
 *
 * Deduplicated across files rather than within one. Roles deliberately share
 * sources — a bugfix registry routes to the owning layer's docs — so per-file
 * dedup asked the same host for the same page several times per run, which is
 * how a few hosts start answering 429 and real findings sink into the
 * non-blocking bucket.
 */
async function readRegistryLinks(files: string[]): Promise<RegistryRead> {
  const byUrl = new Map<string, CitedSource>();
  const failures: string[] = [];

  for (const file of files) {
    let source: string;

    try {
      source = await readFile(path.join(projectRoot, file), 'utf8');
    } catch (error) {
      failures.push(`Cannot read ${file}: ${(error as Error).message}`);
      continue;
    }

    const urls = extractRegistryUrls(source);

    if (urls.length === 0) {
      failures.push(
        `${file} cites no source. A registry with no entry is a registry nobody checks.`
      );
      continue;
    }

    for (const url of urls) {
      const existing = byUrl.get(url);

      if (existing === undefined) {
        byUrl.set(url, { declaredStatus: 'live', relativePaths: [file], url });
      } else {
        existing.relativePaths.push(file);
      }
    }
  }

  return {
    cards: [...byUrl.values()].sort((left, right) => (left.url < right.url ? -1 : 1)),
    failures,
  };
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
      relativePaths: [relativePath],
      url,
    });
  }

  return found.sort((left, right) =>
    (left.relativePaths[0] ?? '') < (right.relativePaths[0] ?? '') ? -1 : 1
  );
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
