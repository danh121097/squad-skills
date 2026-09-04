export interface PageResult<T> {
  items: T[];
  page: number;
  totalPages: number;
}

export function paginate<T>(items: readonly T[], page: number, perPage: number): PageResult<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(Math.max(Math.trunc(page), 1), totalPages);
  const start = (current - 1) * perPage;

  return { items: items.slice(start, start + perPage), page: current, totalPages };
}
