# Design examples

Worked examples of the presentational layer, kept so the reasoning behind them can
be reused — how hierarchy gets established, how motion earns its place, and which
patterns read as generic AI output.

These are reference material for people and for agents reading the repository. They
are **not** skill content: nothing here is loaded at runtime by `squad-designer`.
A lesson that proves durable is distilled into `skills/squad-designer/references/`
as a candidate in a later cycle, where it passes the normal gates and human
promotion before it ships. Writing it straight into the skill would skip that.

## Index

| Example                   | Question it answers                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [`wanderly/`](./wanderly) | Does `squad-designer` improve a premium editorial landing page, and does the improvement hold on both published runtimes? |

## How to read an example

Each example folder holds:

- `BRIEF.md` and `OUTPUT-CONTRACT.md` — the exact input every arm received.
- `sources/<arm>/` — the source each arm produced, unedited, on the stack the
  brief actually names. This is the part to open and read.
- `renders/` — stitched screenshots at 1440×900 and 390×844, plus
  `renders/compare/` for the off-versus-on pairs.
- `matrix.md` — the measured result, with its limits stated.
- `lessons.md` — what generalizes, and what was specific to this brief.
- `judging/` — the rubric the judges were given and their unedited verdicts.
- `gated-arms/` — an earlier round of the same brief run under a
  dependency-free contract so the shipped gate harness could grade it. Kept for
  the gate numbers and for the lessons that came out of them. Its sources are
  vanilla HTML, CSS and ES modules, **not** the stack the brief asks for.

Read `lessons.md` first. The sources are evidence for it, not a pattern library to
copy.

## Standing caveat

The deterministic gates in this repository measure hygiene — contrast, hit area,
overflow, reduced-motion, token discipline. They do not measure whether a design is
good. Rubric scores here come from a blind, order-swapped, cross-provider read and
are **advisory**: they sit outside the judging protocol in
`evals/squad-designer/eval-contract.md`, which forbids judging a case whose arms
are gate-blocked. Treat them as a signal, never as a promotion input.
