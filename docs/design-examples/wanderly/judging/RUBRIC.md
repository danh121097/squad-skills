You are judging two candidate implementations of the SAME design brief, built to
the SAME output contract from the SAME supplied imagery. They are labelled only
`Design 1` and `Design 2`. You are not told how either was produced, and you must
not speculate about it. Judge only what is in the source.

Score each design 1-5 on each rubric, then name a winner per rubric.

| Id                | Dimension                                                    |
| ----------------- | ------------------------------------------------------------ |
| `RUB-HIER-001`    | visual hierarchy established before decoration               |
| `RUB-COHERE-001`  | system coherence and reuse of existing primitives            |
| `RUB-MOTION-001`  | motion has purpose, ownership, and a reduced-motion fallback |
| `RUB-CONTENT-001` | realistic content lengths and edge states hold up            |
| `RUB-SLOP-001`    | absence of generic AI-slop presentation patterns             |

Notes on scoring:

- Length is not quality. A longer file is not a better design. Ignore volume and
  judge density of intent.
- `RUB-SLOP-001` asks whether the page reads as generic AI output: interchangeable
  card grids, hero-with-centred-subtitle, uniform border radius and drop shadows,
  evenly weighted sections, filler microcopy, decorative gradients standing in for
  hierarchy. High score = absent.
- For `RUB-MOTION-001`, weigh whether motion is compositor-only, whether it has a
  stated purpose, and whether `prefers-reduced-motion` is genuinely honoured.

Return ONLY this, no preamble:

```
RUB-HIER-001: D1=<n> D2=<n> winner=<1|2|tie> — <one line>
RUB-COHERE-001: D1=<n> D2=<n> winner=<1|2|tie> — <one line>
RUB-MOTION-001: D1=<n> D2=<n> winner=<1|2|tie> — <one line>
RUB-CONTENT-001: D1=<n> D2=<n> winner=<1|2|tie> — <one line>
RUB-SLOP-001: D1=<n> D2=<n> winner=<1|2|tie> — <one line>
OVERALL: winner=<1|2|tie> — <two lines max>
```
