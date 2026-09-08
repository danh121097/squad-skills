import { describe, expect, it } from 'vitest';

import { validateSkillEntrypointStructure } from '../../src/catalog/skill-entrypoint-structure.ts';

const required = [
  'Usage',
  'Scope and safety',
  'Core gates',
  'Conditional references',
  'Quality bar',
  'Workflow',
  'Handoff contract',
  'Completion checklist',
];

describe('validateSkillEntrypointStructure', () => {
  it('accepts the canonical order with or without stop conditions', () => {
    expect(validate(headings(required))).toEqual([]);

    const withStop = [...required.slice(0, 6), 'Stop conditions', ...required.slice(6)];
    expect(validate(headings(withStop))).toEqual([]);
  });

  it('rejects missing, renamed, reordered, and unexpected sections together', () => {
    const source = headings([
      'Scope and boundary',
      'Usage',
      'Core decisions',
      'Conditional references',
      'Quality bar',
      'Workflow',
      'Notes',
      'Handoff contract',
    ]);

    const [error] = validate(source);

    expect(error).toContain(required.join(' -> '));
    expect(error).toContain('Scope and boundary -> Usage -> Core decisions');
    expect(error).toContain('Notes');
  });

  it('ignores level-two headings inside code fences and non-squad skills', () => {
    const source = `${headings(required)}\n\n\`\`\`md\n## Unexpected\n\`\`\``;

    expect(validate(source)).toEqual([]);
    expect(validateSkillEntrypointStructure('# Anything', 'other-skill', 'SKILL.md')).toEqual([]);
  });
});

function headings(names: string[]): string {
  return names.map((name) => `## ${name}\n\nContent.`).join('\n\n');
}

function validate(source: string): string[] {
  return validateSkillEntrypointStructure(source, 'squad-example', 'skills/squad-example/SKILL.md');
}
