/**
 * Strips comments from candidate source while preserving string contents.
 *
 * This is the primitive every static gate sees the world through, so its
 * failure mode is not a wrong evidence line but a gate that silently stops
 * looking. The regex version this replaced treated any `/*` as a comment
 * opener, so a single glob string — `'**\/*.module.css'` — turned the scope,
 * dependency, and token gates off for the rest of the file.
 *
 * String bodies are kept, not blanked: an import specifier *is* a string, and
 * `INV-DEP-001` reads it.
 *
 * Two limits, stated because they are inherent to scanning without a parser:
 * a `/*` inside a JavaScript regex literal (`/a\/*b/`) still opens a block
 * comment, and nested block comments — legal in Dart, Swift, and Kotlin —
 * close at the first `*\/`. Both truncate a line rather than extend one, so
 * they can only produce a missed match in pathological source, never a false
 * one.
 */
export interface SourceLine {
  line: number;
  text: string;
}

type ScanState = 'block-comment' | 'code' | 'template' | 'text';

/** Quote characters that open a string. Backtick is tracked separately for `${}`. */
const quotes = new Set(["'", '"']);

/**
 * Source lines with comments removed, numbered from 1.
 *
 * A line that holds nothing but a comment is dropped, so evidence never points
 * at prose. `#` is deliberately *not* a comment marker: no language that ships
 * presentational output uses it, while CSS spends it on id selectors and hex
 * colors and Swift on `#Preview`. Treating it as one deleted real declarations
 * and kept real comments, depending on which letters a selector happened to
 * contain.
 */
export function executableLines(source: string): SourceLine[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const result: SourceLine[] = [];
  let state: ScanState = 'code';
  let quote = '';

  for (const [index, raw] of lines.entries()) {
    let text = '';

    for (let position = 0; position < raw.length; position += 1) {
      const character = raw[position] as string;
      const next = raw[position + 1];

      if (state === 'block-comment') {
        if (character === '*' && next === '/') {
          state = 'code';
          position += 1;
        }

        continue;
      }

      if (state === 'text' || state === 'template') {
        text += character;

        // A backslash escapes the next character, so an escaped quote does not
        // close the string and an escaped backslash does not escape the quote
        // after it.
        if (character === '\\') {
          if (next !== undefined) {
            text += next;
            position += 1;
          }

          continue;
        }

        if (
          (state === 'text' && character === quote) ||
          (state === 'template' && character === '`')
        ) {
          state = 'code';
          quote = '';
        }

        continue;
      }

      if (character === '/' && next === '/') break;

      if (character === '/' && next === '*') {
        state = 'block-comment';
        position += 1;
        continue;
      }

      if (quotes.has(character)) {
        state = 'text';
        quote = character;
      } else if (character === '`') {
        state = 'template';
      }

      text += character;
    }

    // An unterminated single-quoted string is a typo or an apostrophe in prose,
    // not a string spanning lines. Reset so one stray quote cannot blind the
    // scanner to the rest of the file the way `/*` used to.
    if (state === 'text') {
      state = 'code';
      quote = '';
    }

    if (text.trim().length > 0) result.push({ line: index + 1, text });
  }

  return result;
}
