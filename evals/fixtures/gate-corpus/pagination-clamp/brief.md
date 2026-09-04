# Paginate a result list

`paginate(items, page, perPage)` returns one page of `items`, the page number it
actually served, and the total number of pages.

Acceptance criteria:

- Page 1 returns the first `perPage` items; the final page returns the remainder.
- A page number above the last page serves the last page.
- A page number below 1 serves the first page.
- `totalPages` is at least 1, including for an empty list.
