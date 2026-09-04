import { type Check, expectEqual } from '../check.ts';

interface PaginateSubject {
  paginate<T>(
    items: readonly T[],
    page: number,
    perPage: number
  ): { items: T[]; page: number; totalPages: number };
}

const rows = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

export function defineChecks(subject: PaginateSubject): Check[] {
  return [
    {
      name: 'first-page',
      run: () => expectEqual(subject.paginate(rows, 1, 3).items, ['a', 'b', 'c'], 'page 1'),
    },
    {
      name: 'last-page-partial',
      run: () => expectEqual(subject.paginate(rows, 3, 3).items, ['g'], 'page 3'),
    },
    {
      name: 'page-above-range-clamps-to-last',
      run: () => expectEqual(subject.paginate(rows, 99, 3).page, 3, 'page 99'),
    },
    {
      name: 'page-zero-clamps-to-first',
      run: () => expectEqual(subject.paginate(rows, 0, 3).items, ['a', 'b', 'c'], 'page 0'),
    },
    {
      name: 'negative-page-clamps-to-first',
      run: () => expectEqual(subject.paginate(rows, -2, 3).items, ['a', 'b', 'c'], 'page -2'),
    },
  ];
}
