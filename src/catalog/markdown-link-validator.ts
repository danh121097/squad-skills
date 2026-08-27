import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const markdownLinkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;

export async function validateMarkdownLinks(
  skillRoot: string,
  projectRoot: string,
  errors: string[]
): Promise<void> {
  const markdownFiles = await findMarkdownFiles(skillRoot);

  for (const markdownFile of markdownFiles) {
    const source = await readFile(markdownFile, 'utf8');

    for (const match of source.matchAll(markdownLinkPattern)) {
      const target = match[1]?.trim().split(/\s+["']/)[0];

      if (!target || target.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(target)) {
        continue;
      }

      const localTarget = target.split(/[?#]/)[0];
      if (!localTarget) continue;

      const targetPath = resolveLocalTarget(localTarget, target, markdownFile, projectRoot, errors);
      if (!targetPath) continue;

      const pathWithinSkill = path.relative(skillRoot, targetPath);
      const escapesSkill =
        pathWithinSkill === '..' ||
        pathWithinSkill.startsWith(`..${path.sep}`) ||
        path.isAbsolute(pathWithinSkill);

      if (escapesSkill) {
        errors.push(
          `${relative(projectRoot, markdownFile)}: local link escapes its skill directory: ${target}.`
        );
        continue;
      }

      try {
        await access(targetPath);
      } catch {
        errors.push(`${relative(projectRoot, markdownFile)}: broken local link: ${target}.`);
      }
    }
  }
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

async function findMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findMarkdownFiles(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(entryPath);
    }
  }

  return files;
}

function relative(projectRoot: string, filePath: string): string {
  return path.relative(projectRoot, filePath);
}
