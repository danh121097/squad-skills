const requiredSections = [
  'Usage',
  'Scope and safety',
  'Core gates',
  'Conditional references',
  'Quality bar',
  'Workflow',
  'Handoff contract',
  'Completion checklist',
] as const;

const optionalStopSection = 'Stop conditions';

/** Enforces one navigable entrypoint shape across the role-specialized catalog. */
export function validateSkillEntrypointStructure(
  source: string,
  skillName: string,
  skillPath: string
): string[] {
  if (!isSquadSkill(skillName)) return [];

  const actual = readLevelTwoHeadings(source);
  const expected = actual.includes(optionalStopSection)
    ? [...requiredSections.slice(0, 6), optionalStopSection, ...requiredSections.slice(6)]
    : [...requiredSections];

  if (actual.length === expected.length && actual.every((heading, i) => heading === expected[i])) {
    return [];
  }

  return [
    `${skillPath}: squad entrypoint sections must be ${formatSections(expected)}; found ${formatSections(actual)}.`,
  ];
}

function isSquadSkill(skillName: string): boolean {
  return skillName === 'squads-team' || skillName.startsWith('squad-');
}

function formatSections(sections: readonly string[]): string {
  return sections.length === 0 ? '(none)' : sections.join(' -> ');
}

function readLevelTwoHeadings(source: string): string[] {
  const headings: string[] = [];
  let fence: { delimiter: '`' | '~'; length: number } | null = null;

  for (const rawLine of source.split('\n')) {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;

    if (fence) {
      const closing = line.match(/^ {0,3}(`+|~+)[ \t]*$/)?.[1];
      if (closing && closing[0] === fence.delimiter && closing.length >= fence.length) fence = null;
      continue;
    }

    const openingMatch = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    const opening = openingMatch?.[1];
    const info = openingMatch?.[2] ?? '';
    if (opening && !(opening[0] === '`' && info.includes('`'))) {
      fence = { delimiter: opening[0] as '`' | '~', length: opening.length };
      continue;
    }

    const heading = line.match(/^##(?!#)[ \t]+(.+?)[ \t]*$/)?.[1];
    if (heading) headings.push(heading);
  }

  return headings;
}
