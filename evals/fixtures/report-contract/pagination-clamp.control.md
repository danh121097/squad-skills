Tests run cleanly with Node's built-in runner (type-stripping works out of the box on v22.20, no flags needed).

**Observed result: 18 tests, 11 pass, 7 fail.**

All 7 failures trace to a single real defect in `subject.ts:9`:

```ts
const current = Math.min(Math.trunc(page), totalPages);
```

The clamp is one-sided. It caps the page at `totalPages` but never floors it at 1, so acceptance criterion "A page number below 1 serves the first page" is unimplemented. `start` then goes negative and `Array.prototype.slice` reinterprets it as an offset from the end of the array, producing wrong or empty slices plus a nonsensical `page` value.

Concrete observations with `items = [1,2,3,4,5]`, `perPage = 2` (`totalPages = 3`):

| input `page` | expected | actual |
|---|---|---|
| `0` | `items [1,2]`, `page 1` | `items []`, `page 0` |
| `-1` | `items [1,2]`, `page 1` | `items [2,3]`, `page -1` |
| `-999` | `items [1,2]`, `page 1` | `items []`, `page -999` |
| `0.9` | `items [1,2]`, `page 1` | `items []`, `page 0` |

`paginate([], 0, 10)` also returns `page: 0` instead of `1`. The negative-page case (`-1` returning `[2,3]`) is the worst of these: it silently serves plausible-looking data from the wrong offset rather than failing loudly.

The other three acceptance criteria hold: page 1 and final-page remainder are correct, over-range pages clamp to the last page correctly, and `totalPages` is at least 1 for an empty list. Fractional pages above 1 truncate as expected. The source array is not mutated.

The fix would be `Math.min(Math.max(1, Math.trunc(page)), totalPages)`, but per the brief I did not modify `subject.ts`.

Test file written to `/Users/danhnguyen/Documents/Danh/BUILDER/squad-skills/.eval-runs/qa-baseline-260904/pagination-clamp/control/produced.test.ts` — 18 tests grouped by acceptance criterion, plus three contract-hygiene tests (served page always within `1..totalPages`, clamped pages never yield an empty slice from a non-empty list, no input mutation). No other files created.

Status: DONE
Summary: Wrote 18 tests against the four acceptance criteria; `node --test produced.test.ts` reports 11 pass / 7 fail, with every failure caused by one bug — `subject.ts:9` clamps the page number to an upper bound but not a lower one, so pages below 1 produce negative slice offsets instead of serving the first page.