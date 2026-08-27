import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  countWords,
  extractSection,
  findUnroutedReferences,
  hashContent,
  measureSkillPayload,
  type TaskTypeDefinition,
} from '../../src/eval/skill-payload-measurement.ts';

const temporarySkills: string[] = [];

const taskTypes: TaskTypeDefinition[] = [
  { id: 'wide', references: ['alpha.md', 'beta.md'] },
  { id: 'narrow', references: ['alpha.md'] },
  { id: 'other', references: ['gamma.md'] },
];

afterEach(async () => {
  await Promise.all(
    temporarySkills.splice(0).map((skillRoot) => rm(skillRoot, { force: true, recursive: true }))
  );
});

describe('countWords', () => {
  it('counts whitespace-delimited words like wc -w', () => {
    expect(countWords('one two  three\nfour\tfive')).toBe(5);
    expect(countWords('   ')).toBe(0);
    expect(countWords('windows\r\nline endings')).toBe(3);
  });

  it('splits on ASCII whitespace only, so a by-hand wc -w check still agrees', () => {
    // \s would also split U+00A0 and U+2028; wc -w in the C locale does not.
    expect(countWords('one\u00a0two')).toBe(1);
    expect(countWords('one\u2028two')).toBe(1);
  });
});

describe('extractSection', () => {
  it('returns the section body and stops at the next heading of the same level', () => {
    const source = '# Title\n\n## Scope\n\nowned work\n\n### Detail\n\nmore\n\n## Next\n\nother\n';

    expect(extractSection(source, '## Scope')).toBe('owned work\n\n### Detail\n\nmore');
    expect(extractSection(source, '## Missing')).toBeNull();
  });

  it('does not let a heading inside a fenced block truncate the section', () => {
    const source = [
      '## Scope',
      '',
      '```sh',
      '# not a heading',
      '```',
      '',
      'tail',
      '',
      '## Next',
      '',
    ].join('\n');

    expect(extractSection(source, '## Scope')).toContain('tail');
  });
});

describe('measureSkillPayload', () => {
  it('measures entrypoint, references, and per-task loaded words', async () => {
    const skillRoot = await createSkill({
      entrypoint: words(10),
      references: { 'alpha.md': words(4), 'beta.md': words(6), 'gamma.md': words(20) },
    });

    const measurement = await measureSkillPayload({ skillRoot, taskTypes });

    expect(measurement.entrypointWords).toBe(10);
    expect(measurement.referenceCount).toBe(3);
    expect(measurement.referenceWords).toBe(30);
    expect(measurement.totalPayloadWords).toBe(40);
    expect(measurement.taskLoads).toEqual([
      { id: 'wide', loadedWords: 20, references: ['alpha.md', 'beta.md'] },
      { id: 'narrow', loadedWords: 14, references: ['alpha.md'] },
      { id: 'other', loadedWords: 30, references: ['gamma.md'] },
    ]);
    // Odd-length median is the middle value, so the widest task never governs alone.
    expect(measurement.medianLoadedWords).toBe(20);
  });

  it('averages an even-length median and rounds half-up', async () => {
    const skillRoot = await createSkill({
      entrypoint: words(1),
      references: { 'alpha.md': words(2), 'beta.md': words(5) },
    });

    const measurement = await measureSkillPayload({
      skillRoot,
      taskTypes: [
        { id: 'low', references: ['alpha.md'] },
        { id: 'high', references: ['beta.md'] },
      ],
    });

    expect(measurement.taskLoads.map((load) => load.loadedWords)).toEqual([3, 6]);
    expect(measurement.medianLoadedWords).toBe(5);
  });

  it('reruns deterministically and changes the hash only when content changes', async () => {
    const skillRoot = await createSkill({
      entrypoint: words(3),
      references: { 'alpha.md': words(2) },
    });

    const first = await measureSkillPayload({ skillRoot, taskTypes: [] });
    const second = await measureSkillPayload({ skillRoot, taskTypes: [] });

    expect(second).toEqual(first);

    await writeFile(path.join(skillRoot, 'references', 'alpha.md'), words(3), 'utf8');
    const third = await measureSkillPayload({ skillRoot, taskTypes: [] });

    expect(third.payloadHash).not.toBe(first.payloadHash);
  });

  it('hashes every bundled file, including nested assets that carry no words', async () => {
    const skillRoot = await createSkill({
      entrypoint: words(3),
      extras: { 'assets/diagram.svg': '<svg />\n' },
      references: { 'alpha.md': words(2), 'nested/deep.md': words(4) },
    });

    const first = await measureSkillPayload({ skillRoot });

    // A nested reference still counts as a reference, addressed by its path.
    expect(first.referenceCount).toBe(2);
    expect(first.references.map((reference) => reference.file)).toEqual([
      'alpha.md',
      'nested/deep.md',
    ]);
    expect(first.referenceWords).toBe(6);

    await writeFile(path.join(skillRoot, 'assets', 'diagram.svg'), '<svg id="x" />\n', 'utf8');
    const second = await measureSkillPayload({ skillRoot });

    // The asset ships with the skill, so editing it must break the freeze.
    expect(second.payloadHash).not.toBe(first.payloadHash);
    expect(second.totalPayloadWords).toBe(first.totalPayloadWords);
  });

  it('measures a skill that bundles no references', async () => {
    const skillRoot = await createSkill({ entrypoint: words(7), references: {} });

    const measurement = await measureSkillPayload({ skillRoot });

    expect(measurement).toMatchObject({
      entrypointWords: 7,
      medianLoadedWords: 0,
      referenceCount: 0,
      referenceWords: 0,
      totalPayloadWords: 7,
    });
  });

  it('rejects a skill directory with no entrypoint', async () => {
    const skillRoot = await mkdtemp(path.join(tmpdir(), 'squad-skills-payload-'));
    temporarySkills.push(skillRoot);

    await expect(measureSkillPayload({ skillRoot })).rejects.toThrow('has no SKILL.md');
  });

  it('rejects a task type that routes to a reference the skill does not bundle', async () => {
    const skillRoot = await createSkill({
      entrypoint: words(3),
      references: { 'alpha.md': words(2) },
    });

    await expect(
      measureSkillPayload({ skillRoot, taskTypes: [{ id: 'bad', references: ['missing.md'] }] })
    ).rejects.toThrow('routes to unknown reference "missing.md"');
  });

  it('rejects a task type that lists the same reference twice', async () => {
    const skillRoot = await createSkill({
      entrypoint: words(3),
      references: { 'alpha.md': words(2) },
    });

    // Counting it twice would inflate the loaded budget without loading twice.
    await expect(
      measureSkillPayload({
        skillRoot,
        taskTypes: [{ id: 'bad', references: ['alpha.md', 'alpha.md'] }],
      })
    ).rejects.toThrow('lists reference "alpha.md" twice');
  });
});

describe('findUnroutedReferences', () => {
  it('reports references that no task type loads', async () => {
    const skillRoot = await createSkill({
      entrypoint: words(3),
      references: { 'alpha.md': words(2), 'orphan.md': words(2) },
    });

    const measurement = await measureSkillPayload({ skillRoot });

    expect(findUnroutedReferences(measurement, [{ id: 'only', references: ['alpha.md'] }])).toEqual(
      ['orphan.md']
    );
  });
});

describe('hashContent', () => {
  it('ignores line-ending differences', () => {
    expect(hashContent('a\r\nb')).toBe(hashContent('a\nb'));
  });
});

function words(count: number): string {
  return `${Array.from({ length: count }, (_, index) => `word${index}`).join(' ')}\n`;
}

async function createSkill(options: {
  entrypoint: string;
  extras?: Record<string, string>;
  references: Record<string, string>;
}): Promise<string> {
  const skillRoot = await mkdtemp(path.join(tmpdir(), 'squad-skills-payload-'));
  temporarySkills.push(skillRoot);

  await writeFile(path.join(skillRoot, 'SKILL.md'), options.entrypoint, 'utf8');

  for (const [name, content] of Object.entries(options.references)) {
    await writeBundledFile(skillRoot, path.join('references', name), content);
  }

  for (const [name, content] of Object.entries(options.extras ?? {})) {
    await writeBundledFile(skillRoot, name, content);
  }

  return skillRoot;
}

async function writeBundledFile(
  skillRoot: string,
  relativePath: string,
  content: string
): Promise<void> {
  const target = path.join(skillRoot, relativePath);

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
}
