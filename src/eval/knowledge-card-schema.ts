/**
 * The knowledge-card contract as data.
 *
 * A card is a reviewed abstraction of one external claim: what it says, where
 * it came from, how far it applies, and when it stops being trustworthy. The
 * plan's non-goal is autonomous ingestion, so every field here exists to make a
 * human review checkable rather than to describe a page.
 */
export const requiredCardFields = [
  'id',
  'source_url',
  'source_class',
  'authority',
  'published_or_verified_on',
  'freshness_expires_on',
  'applicability',
  'access_tier',
  'license_note',
  'review_status',
  'reviewed_by',
  'source_status',
] as const;

export const cardEnumerations: Record<string, Set<string>> = {
  access_tier: new Set(['agent-ready', 'human-only', 'paywalled']),
  authority: new Set(['standards-body', 'first-party', 'secondary']),
  review_status: new Set(['reviewed', 'pending', 'quarantined']),
  source_class: new Set([
    'standard',
    'vendor-documentation',
    'platform-changelog',
    'capability-data',
  ]),
  /** Declared at review time. Nothing here ever fetches a URL to determine it. */
  source_status: new Set(['live', 'dead']),
};

export const cardApplicabilityValues = new Set([
  'all',
  'web',
  'adaptive',
  'react-native',
  'flutter',
  'swiftui',
  'compose',
]);

/**
 * Wording that only appears when a source page's own directives were copied
 * across instead of abstracted. Source pages are data; a card carrying their
 * imperatives turns a fetched page into an instruction channel.
 */
export const embeddedInstructionPatterns: Array<{ label: string; pattern: RegExp }> = [
  {
    label: 'instruction override',
    pattern:
      /\b(?:ignore|disregard|forget)\s+(?:all\s+|any\s+|the\s+)?(?:previous|prior|preceding|above|everything)\b/i,
  },
  { label: 'assistant framing', pattern: /\bas an ai\b|\byou are an? (?:ai|assistant|agent)\b/i },
  { label: 'role injection', pattern: /^\s*(?:system|assistant|user|human)\s*:/im },
  { label: 'role injection', pattern: /^#{1,6}\s*(?:instruction|new instructions)\b/im },
  {
    label: 'prompt framing',
    pattern:
      /\b(?:system prompt|your instructions|new instructions|act as|override the (?:configuration|instructions))\b/i,
  },
  // Directed at the grader rather than the reader. A card states what a source
  // says; it never tells this harness what to conclude.
  {
    label: 'grader direction',
    pattern: /\b(?:never|always)\s+(?:fail|pass|skip|ignore|reject|approve)\b/i,
  },
  { label: 'grader direction', pattern: /\bskip\s+the\s+[\w-]+\s+(?:run|check|gate|scan)\b/i },
  {
    label: 'grader direction',
    pattern: /\b(?:mark|treat)\s+(?:every|all|each)\b[^.]{0,60}\b(?:pass|passing|approved)\b/i,
  },
];

/**
 * Frontmatter keys a card may carry. An allowlist rather than a blocklist:
 * every check below reads named fields, so an unknown key was a place to park
 * arbitrary text — including a copy of the source page — that nothing scanned.
 */
export const allowedCardFields = new Set<string>([...requiredCardFields, 'claim_ids', 'gate']);

/** A provenance value is a citation, not a passage. */
export const maxCardFieldWords = 60;

export const cardRequiredSections = ['## Abstraction', '## Provenance'];

/** Above this a card stops being an abstraction and starts being a copy of the page. */
export const maxCardBodyWords = 400;

/**
 * The contributor-facing scaffold, kept beside the cards it scaffolds.
 *
 * It is not a card and is never validated as one: its values are placeholders,
 * so the id, URL, date, and enumeration checks would all fail on text that is
 * meant to be replaced. It is checked as a template instead — it has to carry
 * every field a real card requires, so adding a field to the schema fails the
 * gate until the scaffold teaches it.
 */
export const cardTemplateFileName = 'TEMPLATE.md';
