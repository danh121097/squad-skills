import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const skillsRoot = path.resolve(import.meta.dirname, '../../skills');

// Removed coordination features. The migration notes in README.md name them on
// purpose; a skill that names one again tells agents to use something gone.
const retired = ['--delegate', '--allow-new-threads', 'thread registry'];

describe('retired coordination features', () => {
  it('are named by no shipped skill file', async () => {
    const files = (await readdir(skillsRoot, { recursive: true })).filter((file) =>
      file.endsWith('.md')
    );
    const hits: string[] = [];

    for (const file of files) {
      const source = (await readFile(path.join(skillsRoot, file), 'utf8')).toLowerCase();
      for (const phrase of retired) if (source.includes(phrase)) hits.push(`${file}: ${phrase}`);
    }

    expect(hits).toEqual([]);
  });
});
