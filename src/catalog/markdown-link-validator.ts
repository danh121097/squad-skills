import { access, readFile, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';

const inlineLinkPattern = /!?\[[^\]]*\]\(((?:[^()]|\([^()]*\))*)\)/g;
/** A definition line: up to three spaces of indent, then `[label]: target`. */
const referenceDefinitionPattern = /^[ \t]{0,3}\[([^\]]+)\]:[ \t]*(\S+)/gm;

/**
 * Resolves every relative Markdown link a skill states in prose, and refuses
 * one that escapes the skill directory.
 *
 * Both halves matter at install time rather than here: a skill is installed one
 * directory at a time, so a link to a sibling skill resolves in this repository
 * and not in an installation that took only this skill. A broken in-skill link
 * is the same failure one directory down. Called per skill by `validateSkills`,
 * which is what `pnpm validate` runs.
 */
export async function validateMarkdownLinks(
  skillRoot: string,
  projectRoot: string,
  errors: string[]
): Promise<void> {
  const markdownFiles = await findMarkdownFiles(skillRoot, projectRoot, errors);

  for (const markdownFile of markdownFiles) {
    // Code is stripped first so a path written as an example, or an index
    // expression like `rows[0][1]`, is not read as a link.
    const source = stripCode(await readFile(markdownFile, 'utf8'));
    // The definition is where a reference-style link keeps its path, so both
    // forms reach the same checks. Scanning only `](...)` left `[a][b]` with
    // `[b]: ../../outside.md` completely unexamined.
    //
    // Only definitions are checked, never uses: by CommonMark a reference with
    // no matching definition is literal text, so reporting one as a broken link
    // fires on ordinary prose like `rows[0][1]`.
    const targets = [
      ...[...source.matchAll(inlineLinkPattern)].map((match) => match[1]),
      ...[...source.matchAll(referenceDefinitionPattern)].map((match) => match[2]),
    ];

    for (const raw of targets) {
      await checkTarget({ errors, markdownFile, projectRoot, raw, skillRoot });
    }
  }
}

async function checkTarget(options: {
  errors: string[];
  markdownFile: string;
  projectRoot: string;
  raw: string | undefined;
  skillRoot: string;
}): Promise<void> {
  const { errors, markdownFile, projectRoot, raw, skillRoot } = options;
  const target = unwrap(raw?.trim().split(/\s+["'(]/)[0]);

  if (!target || target.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(target)) return;

  const localTarget = target.split(/[?#]/)[0];

  if (!localTarget) return;

  const targetPath = resolveLocalTarget(localTarget, target, markdownFile, projectRoot, errors);

  if (!targetPath) return;

  if (escapes(skillRoot, targetPath)) {
    errors.push(
      `${relative(projectRoot, markdownFile)}: local link escapes its skill directory: ${target}.`
    );

    return;
  }

  try {
    await access(targetPath);
  } catch {
    errors.push(`${relative(projectRoot, markdownFile)}: broken local link: ${target}.`);

    return;
  }

  // Containment again, on real paths this time. The check above compares the
  // path as written, so a symlink sitting inside the skill and pointing outside
  // it satisfies that one while resolving somewhere this skill does not ship.
  try {
    if (escapes(await realpath(skillRoot), await realpath(targetPath))) {
      errors.push(
        `${relative(projectRoot, markdownFile)}: local link resolves outside its skill directory: ${target}.`
      );
    }
  } catch {
    errors.push(`${relative(projectRoot, markdownFile)}: unresolvable local link: ${target}.`);
  }
}

/** `<./guide.md>` is a destination CommonMark spells with angle brackets. */
function unwrap(target: string | undefined): string | undefined {
  return target?.startsWith('<') && target.endsWith('>') ? target.slice(1, -1) : target;
}

/** Whether `targetPath` sits outside `root`. */
function escapes(root: string, targetPath: string): boolean {
  const within = path.relative(root, targetPath);

  return within === '..' || within.startsWith(`..${path.sep}`) || path.isAbsolute(within);
}

/**
 * Fenced blocks and inline spans removed, line count preserved for nothing in
 * particular — only the text matters here, not the positions.
 */
function stripCode(source: string): string {
  const lines = source.split('\n');
  let fence: { delimiter: '`' | '~'; length: number } | null = null;

  const visible = lines.map((rawLine) => {
    // A CRLF document arrives here with a trailing `\r` on every line, and `.`
    // never matches one. Testing the raw line let no fence open at all, so a
    // Windows-authored skill had every fenced example graded as live links.
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;

    if (fence) {
      const closing = line.match(/^ {0,3}(`+|~+)[ \t]*$/)?.[1];

      if (closing && closing[0] === fence.delimiter && closing.length >= fence.length) {
        fence = null;
      }

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

function resolveLocalTarget(
  localTarget: string,
  originalTarget: string,
  markdownFile: string,
  projectRoot: string,
  errors: string[]
): string | null {
  try {
    return path.resolve(path.dirname(markdownFile), decodeURI(localTarget));
  } catch {
    errors.push(`${relative(projectRoot, markdownFile)}: invalid local link: ${originalTarget}.`);

    return null;
  }
}

async function findMarkdownFiles(
  directory: string,
  projectRoot: string,
  errors: string[]
): Promise<string[]> {
  let entries;

  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    // Reported like every other fault here. Left to reject, one unreadable
    // subdirectory took down the whole validation run instead of failing it.
    errors.push(`${relative(projectRoot, directory)}: directory could not be read.`);

    return [];
  }

  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    // Package managers may omit symlinks while retaining their targets. Reject
    // them at authoring time so source validation and the extracted payload see
    // the same files.
    if (entry.isSymbolicLink()) {
      errors.push(
        `${relative(projectRoot, entryPath)}: packaged skill payloads cannot contain symlinks; replace the link with a regular file or directory.`
      );
      continue;
    }

    const kind = entry;

    if (kind.isDirectory()) {
      files.push(...(await findMarkdownFiles(entryPath, projectRoot, errors)));
    } else if (kind.isFile() && entry.name.endsWith('.md')) {
      files.push(entryPath);
    }
  }

  return files;
}

function relative(projectRoot: string, filePath: string): string {
  return path.relative(projectRoot, filePath);
}
