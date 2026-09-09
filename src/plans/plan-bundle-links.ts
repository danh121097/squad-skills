import { access } from 'node:fs/promises';
import path from 'node:path';

import type { PlanDocument } from './plan-bundle-layout.ts';
import { planIndexFile } from './plan-bundle-layout.ts';

const inlineLinkPattern = /!?\[[^\]]*\]\(((?:[^()]|\([^()]*\))*)\)/g;
/** A definition line: up to three spaces of indent, then `[label]: target`. */
const referenceDefinitionPattern = /^[ \t]{0,3}\[([^\]]+)\]:[ \t]*(\S+)/gm;

export interface PlanLinkResult {
  errors: string[];
  /** Bundle-relative POSIX targets each document links, deduplicated. */
  linked: Map<string, Set<string>>;
}

/**
 * Resolves every relative Markdown link the bundle states, and refuses one that
 * leaves the bundle.
 *
 * Both halves matter once a plan moves — copied into a ticket, archived beside
 * the branch it describes, handed to someone who did not run the session that
 * wrote it. A link out to the surrounding repository resolves for the author
 * and for nobody after them, which is the same failure as a link to a file that
 * was never written.
 */
export async function validatePlanLinks(
  bundleRoot: string,
  documents: PlanDocument[]
): Promise<PlanLinkResult> {
  const errors: string[] = [];
  const linked = new Map<string, Set<string>>();

  for (const document of documents) {
    const targets = new Set<string>();
    const source = stripCode(document.body);
    const raw = [
      ...[...source.matchAll(inlineLinkPattern)].map((match) => match[1]),
      ...[...source.matchAll(referenceDefinitionPattern)].map((match) => match[2]),
    ];

    for (const candidate of raw) {
      const target = normalize(candidate);

      if (target === null) continue;

      const resolved = await resolveTarget(bundleRoot, document, target, errors);

      if (resolved !== null) targets.add(resolved);
    }

    linked.set(document.relativePath, targets);
  }

  return { errors, linked };
}

/**
 * Every phase file is reachable from `plan.md` and nothing else claims to index
 * the plan, because a second index is how two orders start disagreeing.
 */
export function validatePhaseIndex(
  documents: PlanDocument[],
  linked: Map<string, Set<string>>
): string[] {
  const errors: string[] = [];
  const indexLinks = linked.get(planIndexFile);

  if (!indexLinks) return errors;

  for (const document of documents) {
    if (document.kind !== 'phase') continue;

    if (!indexLinks.has(document.relativePath)) {
      errors.push(
        `${planIndexFile}: the phase index links no file for ${document.relativePath}, so that phase is unreachable from the plan's only entrypoint.`
      );
    }
  }

  return errors;
}

/**
 * A phase links the inputs it declared.
 *
 * Declaring an input and never linking it is the state a reader cannot detect:
 * the phase reads as self-contained while the decision or artifact it depends on
 * sits somewhere in the bundle with nothing pointing at it.
 */
export function validateDeclaredInputs(
  documents: PlanDocument[],
  inputsByDocument: Map<string, string[]>,
  linked: Map<string, Set<string>>
): string[] {
  const errors: string[] = [];

  for (const document of documents) {
    if (document.kind !== 'phase') continue;

    const declared = inputsByDocument.get(document.relativePath) ?? [];
    const links = linked.get(document.relativePath) ?? new Set<string>();

    for (const input of declared) {
      const resolved = toBundlePath(document.relativePath, input);

      if (resolved === null || !links.has(resolved)) {
        errors.push(
          `${document.relativePath}: declares input ${input} and links to it nowhere in the phase body.`
        );
      }
    }
  }

  return errors;
}

async function resolveTarget(
  bundleRoot: string,
  document: PlanDocument,
  target: string,
  errors: string[]
): Promise<string | null> {
  if (path.posix.isAbsolute(target) || path.win32.isAbsolute(target)) {
    errors.push(
      `${document.relativePath}: link ${target} is absolute; every link inside a plan bundle is relative.`
    );

    return null;
  }

  const resolved = toBundlePath(document.relativePath, target);

  if (resolved === null) {
    errors.push(`${document.relativePath}: link ${target} escapes the plan bundle.`);
    return null;
  }

  try {
    await access(path.join(bundleRoot, resolved));
  } catch {
    errors.push(`${document.relativePath}: broken relative link: ${target}.`);
    return null;
  }

  return resolved;
}

/** The bundle-relative POSIX path a link resolves to, or null when it escapes. */
export function toBundlePath(fromDocument: string, target: string): string | null {
  const decoded = safeDecode(target.split(/[?#]/)[0] ?? '');

  if (decoded === null || decoded.length === 0) return null;

  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(fromDocument), decoded));

  if (resolved === '..' || resolved.startsWith('../') || path.posix.isAbsolute(resolved)) {
    return null;
  }

  return resolved.replace(/\/$/, '');
}

/** Strips the parts of a link target that are not a path, or null to skip it. */
function normalize(raw: string | undefined): string | null {
  const first = raw?.trim().split(/\s+["'(]/)[0];
  const target = first?.startsWith('<') && first.endsWith('>') ? first.slice(1, -1) : first;

  if (!target || target.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(target)) return null;

  return target;
}

function safeDecode(value: string): string | null {
  try {
    return decodeURI(value);
  } catch {
    return null;
  }
}

/** Fenced blocks and inline spans removed, so a sample path is not a link. */
function stripCode(source: string): string {
  const lines = source.split('\n');
  let fence: { delimiter: '`' | '~'; length: number } | null = null;

  const visible = lines.map((rawLine) => {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;

    if (fence) {
      const closing = line.match(/^ {0,3}(`+|~+)[ \t]*$/)?.[1];

      if (closing && closing[0] === fence.delimiter && closing.length >= fence.length) fence = null;

      return '';
    }

    const openingMatch = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    const opening = openingMatch?.[1];
    const info = openingMatch?.[2] ?? '';

    if (opening && !(opening[0] === '`' && info.includes('`'))) {
      fence = { delimiter: opening[0] as '`' | '~', length: opening.length };

      return '';
    }

    return line;
  });

  return visible.join('\n').replace(/(`+)[^\n]*?\1/g, '');
}
