/**
 * Graphemes, not code points: a reader counts `é` as one character whether it
 * arrives precomposed or as a letter followed by a combining mark, and counts
 * an emoji as one whether or not it fits in a UTF-16 unit.
 */
const characters = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

export function truncate(name: string, max: number): string {
  const graphemes = [...characters.segment(name)].map((entry) => entry.segment);

  if (graphemes.length <= max) return name;

  return `${graphemes.slice(0, max - 1).join('')}…`;
}
