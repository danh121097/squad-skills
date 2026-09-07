import { type Check, expectEqual } from '../check.ts';

interface TruncateSubject {
  truncate(name: string, max: number): string;
}

/**
 * Every ASCII check here passes against both sources on purpose. A name is
 * user-supplied text, so the risk lives in the data domain rather than in the
 * parameters — and a test suite that only varies `max` never reaches it.
 */
export function defineChecks(subject: TruncateSubject): Check[] {
  return [
    {
      name: 'short-name-unchanged',
      run: () => expectEqual(subject.truncate('Ada', 10), 'Ada', 'name shorter than the room'),
    },
    {
      name: 'name-at-the-limit-unchanged',
      run: () =>
        expectEqual(subject.truncate('Alexander', 9), 'Alexander', 'name exactly the room'),
    },
    {
      name: 'long-ascii-name-truncated',
      run: () =>
        expectEqual(
          subject.truncate('Alexandria Ocasio', 8),
          'Alexand…',
          'name longer than the room'
        ),
    },
    {
      name: 'astral-name-that-fits-is-unchanged',
      run: () =>
        expectEqual(subject.truncate('😀😀😀', 4), '😀😀😀', 'three characters in room for four'),
    },
    {
      name: 'astral-name-cut-between-characters',
      run: () =>
        expectEqual(
          subject.truncate('😀😀😀😀😀', 4),
          '😀😀😀…',
          'five characters in room for four'
        ),
    },
    {
      // A decomposed accent is one character to a reader and two code points to
      // a program, so counting code points is not enough either.
      name: 'combining-mark-name-that-fits-is-unchanged',
      run: () =>
        expectEqual(
          subject.truncate('e\u0301e\u0301e\u0301', 4),
          'e\u0301e\u0301e\u0301',
          'three accented characters in room for four'
        ),
    },
    {
      name: 'combining-mark-name-cut-between-characters',
      run: () =>
        expectEqual(
          subject.truncate('e\u0301e\u0301e\u0301e\u0301e\u0301', 4),
          'e\u0301e\u0301e\u0301…',
          'five accented characters in room for four'
        ),
    },
  ];
}
