import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { parseDocument } from 'yaml';

import {
  allowedCardFields,
  cardApplicabilityValues,
  cardEnumerations,
  cardRequiredSections,
  embeddedInstructionPatterns,
  maxCardBodyWords,
  maxCardFieldWords,
  requiredCardFields,
} from './knowledge-card-schema.ts';

export interface ValidateKnowledgeCardsOptions {
  /** Directory holding one card per source claim, relative to the project root. */
  cardsDirectory: string;
  errors: string[];
  /**
   * Invariant ids from the contract registry. A card's `gate` has to name one of
   * them: a card pointing at a gate that does not exist reads as covered and is
   * not, and a renamed invariant would otherwise leave its card behind silently.
   */
  invariantIds?: Set<string>;
  notes: string[];
  /** Injected so freshness expiry is testable; defaults to the current date. */
  now?: Date;
  projectRoot: string;
}

const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const identifierPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates reviewed knowledge cards: abstractions with provenance, never raw
 * dumps and never instructions.
 *
 * Everything here is decidable offline. Nothing fetches a source URL, including
 * the dead-link check — a card declares `source_status` at review time, so a
 * dead source is reported without any page content ever being ingested.
 */
export async function validateKnowledgeCards(
  options: ValidateKnowledgeCardsOptions
): Promise<void> {
  const { cardsDirectory, errors, notes, projectRoot } = options;
  const invariantIds = options.invariantIds ?? new Set<string>();
  const now = options.now ?? new Date();
  const absolute = path.join(projectRoot, cardsDirectory);

  let entries;

  try {
    entries = await readdir(absolute, { withFileTypes: true });
  } catch {
    notes.push(`${cardsDirectory}/: no knowledge cards found.`);
    return;
  }

  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort();

  const sourceUrls = new Map<string, string>();
  const claimIds = new Map<string, string>();

  for (const file of files) {
    const relativePath = path.posix.join(cardsDirectory, file);
    const source = await readFile(path.join(absolute, file), 'utf8');

    validateCard({ claimIds, errors, file, invariantIds, now, relativePath, source, sourceUrls });
  }

  notes.push(`${cardsDirectory}/: validated ${files.length} knowledge card(s).`);
}

function validateCard(options: {
  claimIds: Map<string, string>;
  errors: string[];
  file: string;
  invariantIds: Set<string>;
  now: Date;
  relativePath: string;
  source: string;
  sourceUrls: Map<string, string>;
}): void {
  const { claimIds, errors, file, invariantIds, now, relativePath, source, sourceUrls } = options;
  const frontmatterSource = source.match(frontmatterPattern)?.[1];

  if (frontmatterSource === undefined) {
    errors.push(`${relativePath}: card has no YAML frontmatter.`);
    return;
  }

  const document = parseDocument(frontmatterSource);

  if (document.errors.length > 0) {
    errors.push(
      `${relativePath}: invalid frontmatter: ${document.errors[0]?.message ?? 'unknown'}`
    );
    return;
  }

  const card = asRecord(document.toJS());

  if (!card) {
    errors.push(`${relativePath}: frontmatter must be a mapping.`);
    return;
  }

  validateFrontmatterShape(card, relativePath, errors);
  validateGateReference(card, relativePath, invariantIds, errors);
  validateProvenance(card, relativePath, file, errors);
  validateFreshness(card, relativePath, now, errors);
  validateBody(source, relativePath, errors);
  registerUniqueness({ card, claimIds, errors, relativePath, sourceUrls });
}

/**
 * Keys are allowlisted and values are bounded.
 *
 * Only named fields are ever read, so an unknown key was an unscanned place to
 * park text — a copy of the source page, or wording aimed at the grader — while
 * the card validated clean.
 */
function validateFrontmatterShape(
  card: Record<string, unknown>,
  relativePath: string,
  errors: string[]
): void {
  for (const key of Object.keys(card)) {
    if (!allowedCardFields.has(key)) {
      errors.push(
        `${relativePath}: unknown frontmatter key "${key}"; a card carries provenance, not free text.`
      );
    }
  }

  for (const [key, value] of Object.entries(card)) {
    const words = typeof value === 'string' ? value.trim().split(/\s+/).length : 0;

    if (words > maxCardFieldWords) {
      errors.push(
        `${relativePath}: ${key} is ${words} words; a provenance field is a citation, not a passage.`
      );
    }
  }
}

/** Missing or unregistered provenance means the claim cannot be traced back. */
function validateProvenance(
  card: Record<string, unknown>,
  relativePath: string,
  file: string,
  errors: string[]
): void {
  for (const field of requiredCardFields) {
    if (isEmpty(card[field])) {
      errors.push(`${relativePath}: missing required field "${field}".`);
      continue;
    }

    // Every check below this line is guarded on `typeof value === 'string'`,
    // so a field that arrives as a list or a number would skip validation
    // entirely rather than fail it. `review_status: [pending]` — one bracket —
    // used to ship an unreviewed card through a green gate.
    if (field !== 'applicability' && typeof card[field] !== 'string') {
      errors.push(
        `${relativePath}: ${field} must be a single string, not ${describeType(card[field])}.`
      );
    }
  }

  const id = card.id;

  if (typeof id === 'string' && (!identifierPattern.test(id) || `${id}.md` !== file)) {
    errors.push(`${relativePath}: id "${id}" must be kebab-case and match the file name.`);
  }

  if (typeof card.source_url === 'string' && !/^https:\/\/\S+$/.test(card.source_url)) {
    errors.push(`${relativePath}: source_url must be an https URL naming the first-party source.`);
  }

  for (const [field, allowed] of Object.entries(cardEnumerations)) {
    const value = card[field];

    if (typeof value === 'string' && !allowed.has(value)) {
      errors.push(
        `${relativePath}: ${field} "${value}" is not one of ${[...allowed].sort().join(', ')}.`
      );
    }
  }

  if (card.review_status === 'quarantined' || card.review_status === 'pending') {
    errors.push(
      `${relativePath}: review_status is "${card.review_status}"; only a reviewed card may ship.`
    );
  }

  // Reported, never fetched: a dead source is re-reviewed by a human, and the
  // page's content must not be pulled in to "fix" the card.
  if (card.source_status === 'dead') {
    errors.push(
      `${relativePath}: source_status is "dead"; re-review the claim against a live source rather than ingesting the page.`
    );
  }

  validateApplicability(card.applicability, relativePath, errors);
}

function validateApplicability(value: unknown, relativePath: string, errors: string[]): void {
  if (value === undefined) return;

  if (!Array.isArray(value)) {
    errors.push(
      `${relativePath}: applicability must be a list of platforms, not ${describeType(value)}.`
    );
    return;
  }

  for (const platform of value) {
    if (typeof platform !== 'string' || !cardApplicabilityValues.has(platform)) {
      errors.push(
        `${relativePath}: applicability entry ${JSON.stringify(platform)} is not a supported platform.`
      );
    }
  }
}

/**
 * A card whose freshness lapsed blocks promotion until a human re-reviews it.
 *
 * `freshness_expires_on` is the first day the card is stale, not the last day it
 * is good: dates parse as UTC midnight, so the card stops validating the moment
 * that day begins. Rounding the other way would let a card be cited on a date it
 * declares itself expired.
 */
function validateFreshness(
  card: Record<string, unknown>,
  relativePath: string,
  now: Date,
  errors: string[]
): void {
  const verified = readDate(card.published_or_verified_on, 'published_or_verified_on');
  const expires = readDate(card.freshness_expires_on, 'freshness_expires_on');

  for (const field of [verified, expires]) {
    if (field.error) errors.push(`${relativePath}: ${field.error}`);
  }

  if (!verified.value || !expires.value) return;

  if (expires.value <= verified.value) {
    errors.push(`${relativePath}: freshness_expires_on must fall after published_or_verified_on.`);
    return;
  }

  if (expires.value < now) {
    errors.push(
      `${relativePath}: freshness lapsed on ${card.freshness_expires_on}; re-review the source before this card can be used.`
    );
  }
}

/** The body must be an abstraction with provenance, not a copy of the page. */
function validateBody(source: string, relativePath: string, errors: string[]): void {
  const body = source.replace(frontmatterPattern, '');
  // Headings are read outside fenced blocks and at the start of a line: a body
  // whose whole content is a fence containing the two headings satisfied
  // `includes` while carrying no prose and no provenance at all.
  const headings = new Set(
    body
      .replace(/^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\2[^\n]*$/gm, '')
      .split('\n')
      .map((line) => line.trimEnd())
  );

  for (const heading of cardRequiredSections) {
    if (!headings.has(heading)) {
      errors.push(`${relativePath}: body is missing a "${heading}" section.`);
    }
  }

  const words = body.split(/[ \t\n\r\f\v]+/).filter((word) => word.length > 0).length;

  if (words > maxCardBodyWords) {
    errors.push(
      `${relativePath}: body is ${words} words, over the ${maxCardBodyWords}-word abstraction limit; store the principle, not the page.`
    );
  }

  // Scanned over the whole file, frontmatter included. A key nothing reads is
  // still text that ships, and the allowlist above only rejects the key name.
  for (const { label, pattern } of embeddedInstructionPatterns) {
    if (pattern.test(source)) {
      errors.push(
        `${relativePath}: body carries ${label} wording from its source; source pages are data, never instructions.`
      );
    }
  }
}

/**
 * A card's `gate` must name a registered invariant.
 *
 * The field is what makes a card auditable — it is the claim that this piece of
 * knowledge backs that gate. Left unchecked, `INV-TOUCH-002` or an id retired in
 * a later cycle reads exactly like coverage while pointing at nothing.
 *
 * An empty registry means the contract could not be read; that is already an
 * error on its own, and failing every card on top of it would only bury it.
 */
function validateGateReference(
  card: Record<string, unknown>,
  relativePath: string,
  invariantIds: Set<string>,
  errors: string[]
): void {
  const gate = card.gate;

  if (gate === undefined || invariantIds.size === 0) return;

  if (typeof gate !== 'string' || !invariantIds.has(gate)) {
    errors.push(
      `${relativePath}: gate ${JSON.stringify(gate)} is not in the contract's hard invariant registry.`
    );
  }
}

/**
 * Compares source URLs by origin and path rather than by exact string. Two cards
 * citing the same page through a trailing slash, a differently-cased host, or a
 * tracking query are the duplicate this check exists to catch.
 */
function normalizeSourceUrl(value: string): string {
  try {
    const url = new URL(value);

    return `${url.protocol}//${url.host.toLowerCase()}${url.pathname.replace(/\/+$/, '')}${url.hash}`;
  } catch {
    return value.trim().toLowerCase();
  }
}

/** Both halves of a duplicate are named, because either one may be the copy. */
function registerUniqueness(options: {
  card: Record<string, unknown>;
  claimIds: Map<string, string>;
  errors: string[];
  relativePath: string;
  sourceUrls: Map<string, string>;
}): void {
  const { card, claimIds, errors, relativePath, sourceUrls } = options;
  const sourceUrl = card.source_url;

  if (typeof sourceUrl === 'string') {
    const key = normalizeSourceUrl(sourceUrl);
    const existing = sourceUrls.get(key);

    if (existing) {
      errors.push(
        `${relativePath}: duplicates source_url "${sourceUrl}" already used by ${existing}.`
      );
    } else {
      sourceUrls.set(key, relativePath);
    }
  }

  const claims = card.claim_ids;

  // An empty list is not "no claims" — a card that carries no claim has nothing
  // to say and no way to be cited, so it passed every check while being inert.
  if (!Array.isArray(claims) || claims.length === 0) {
    errors.push(`${relativePath}: claim_ids must list at least one abstraction this card carries.`);
    return;
  }

  for (const claim of claims) {
    if (typeof claim !== 'string' || !identifierPattern.test(claim)) {
      errors.push(`${relativePath}: claim id ${JSON.stringify(claim)} must be kebab-case.`);
      continue;
    }

    const existing = claimIds.get(claim);

    if (existing) {
      errors.push(`${relativePath}: repeats claim "${claim}" already carried by ${existing}.`);
      continue;
    }

    claimIds.set(claim, relativePath);
  }
}

function readDate(value: unknown, field: string): { error?: string; value?: Date } {
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : value;

  if (typeof text !== 'string' || !isoDatePattern.test(text)) {
    return { error: `${field} must be an ISO date (YYYY-MM-DD).` };
  }

  const parsed = new Date(`${text}T00:00:00Z`);

  return Number.isNaN(parsed.getTime())
    ? { error: `${field} is not a real date.` }
    : { value: parsed };
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;

  return false;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Names what arrived instead of the expected type, so the fix is obvious. */
function describeType(value: unknown): string {
  if (Array.isArray(value)) return 'a list';
  if (value === null) return 'null';

  return `a ${typeof value}`;
}
