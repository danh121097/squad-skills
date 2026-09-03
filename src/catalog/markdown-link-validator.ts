import { access, readFile, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';

const inlineLinkPattern = /!?\[[^\]]*\]\(((?:[^()]|\([^()]*\))*)\)/g;
/** A definition line: up to three spaces of indent, then `[label]: target`. */
const referenceDefinitionPattern = /^[ \t]{0,3}\[([^\]]+)\]:[ \t]*(\S+)/gm;

export async function validateMarkdownLinks(
  skillRoot: string,
  projectRoot: string,
  errors: string[]
): Promise<void> {
  const markdownFiles = await findMarkdownFiles(skillRoot, skillRoot, projectRoot, errors);

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
  return source.replace(/^ {0,3}(```|~~~)[\s\S]*?^ {0,3}\1/gm, '').replace(/`[^`\n]*`/g, '');
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
  skillRoot: string,
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
    // `Dirent` answers from lstat, so a symlink is neither a file nor a
    // directory to it. Asking only those two questions skipped a symlinked
    // SKILL.md entirely: its frontmatter was read and its links never were.
    const kind = entry.isSymbolicLink()
      ? await resolveSymlink(entryPath, skillRoot, projectRoot, errors)
      : entry;

    if (kind === null) continue;

    if (kind.isDirectory()) {
      files.push(...(await findMarkdownFiles(entryPath, skillRoot, projectRoot, errors)));
    } else if (kind.isFile() && entry.name.endsWith('.md')) {
      files.push(entryPath);
    }
  }

  return files;
}

/** A symlink is followed only once it is known to land inside the skill. */
async function resolveSymlink(
  entryPath: string,
  skillRoot: string,
  projectRoot: string,
  errors: string[]
): Promise<{ isDirectory: () => boolean; isFile: () => boolean } | null> {
  try {
    if (escapes(await realpath(skillRoot), await realpath(entryPath))) {
      errors.push(
        `${relative(projectRoot, entryPath)}: symlink resolves outside its skill directory.`
      );

      return null;
    }

    return await stat(entryPath);
  } catch {
    errors.push(`${relative(projectRoot, entryPath)}: symlink could not be resolved.`);

    return null;
  }
}

function relative(projectRoot: string, filePath: string): string {
  return path.relative(projectRoot, filePath);
}
