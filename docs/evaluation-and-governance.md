# How a change to these skills is evidenced

This repository publishes skills that other people's agents load and act on. A
sentence changed here changes behaviour in codebases nobody in this project will
ever see, and the usual signal for that kind of change — a reviewer agreeing
that the new wording reads better — measures nothing.

So the repository carries an evaluation apparatus: several thousand lines of
TypeScript under `src/eval/`, a set of fixtures under `evals/`, and a promotion
decision that no measurement in this repository can sign on its own. This page
explains that system to somebody who has never seen it. It is background, not
authority: [AGENTS.md](../AGENTS.md) is the binding contract, and
[`evals/squad-designer/eval-contract.md`](../evals/squad-designer/eval-contract.md)
is the human authority for the cycle currently in flight. Where this page and
either of those disagree, they are right.

## The short version

Two kinds of evidence exist here, and every change carries at least the first.

**The deterministic gate** is `pnpm test`. It is offline, needs no credentials,
calls no model, and is the definition of done for every change in the
repository. It runs type checking, formatting, unit tests, the catalog
validators, the cross-skill role contract, in-skill Markdown link resolution,
the evaluation-fixture contract, and catalog discovery through the pinned Skills
CLI.

**The evaluation cycle** is everything else on this page: lanes, a frozen
baseline, deterministic invariants over emitted output, cross-provider judging,
and a promotion decision. It is paid, nondeterministic, and never reachable from
`pnpm test`.

Which of the two a change owes is set by the tier of the skill it touches, and
that rule lives in [AGENTS.md](../AGENTS.md) under `Contribution boundary`.
This page does not restate it, because a second copy of a rule is a second thing
to drift.

## Lanes, and why one of them is private

A case is a task a candidate skill is run on. Every case belongs to exactly one
lane.

| Lane          | Where it lives                      | What it is for                              | Judged |
| ------------- | ----------------------------------- | ------------------------------------------- | ------ |
| `development` | public, `evals/<skill>/`            | iterating on a candidate, exercising schema | no     |
| `calibration` | private, behind `EVAL_PRIVATE_PATH` | scoring the judge against human labels      | yes    |
| `acceptance`  | private, behind `EVAL_PRIVATE_PATH` | held-out evidence a promotion is decided on | yes    |

The acceptance lane is held out because a change tuned against the set that
grades it measures the tuning rather than the change — a live risk precisely
because contributions are open. Holding it out is worth nothing if it can be
read, so:

- the bodies live in a separate private repository, addressed only through the
  `EVAL_PRIVATE_PATH` environment variable;
- a private case may carry exactly three keys here — `id`, `lane`, and
  `content_hash`. This is an allowlist, not a list of forbidden fields: any
  fourth key fails validation, because an unknown key is exactly how a held-out
  body leaks;
- held-out ids are opaque by convention (`acc-001`, `cal-001`), because a
  descriptive id publishes the subject of a held-out test to anything that reads
  this repository, including a future subject model. This one is practice rather
  than a gate: no validator checks that an id says nothing;
- the clone must sit outside this working tree, and validation fails when
  `EVAL_PRIVATE_PATH` resolves inside it, because a readable holdout is not a
  holdout;
- no workflow may reach the store. `pnpm validate:evals` asserts the three
  rules [AGENTS.md](../AGENTS.md) states, so the isolation is a failing gate
  rather than a promise. The one credential a public workflow may name is
  `GITHUB_TOKEN`, minted per run and scoped by that workflow's own permissions
  rather than stored.

Public CI never sets the variable. With it unset, `pnpm validate:evals` verifies
the public half of the contract and reports the private half as not checked —
which is different from reporting it as passing, and is printed differently.

## A cycle is pinned, and what pins it

One cycle is one baseline manifest plus one private-store commit. Baseline
artifacts predate any candidate patch. Changing a pinned subject model, a pinned
judge model, or the acceptance set does not amend the cycle; it starts a new one.
There are no mid-cycle swaps, because a number measured against a moved baseline
compares nothing. Those two are rules the maintainer keeps, not gates: nothing
in `src/eval/` can tell that a baseline was produced after a patch.

This is also why editing a `SKILL.md` interacts with a cycle at all: the
manifest records a payload hash per measured skill, and an arm produced against
one payload is not comparable to a later one. `pnpm validate:evals` recomputes
every measured value from the working tree, so a recorded number that no longer
reproduces fails the gate instead of surviving as a stale footnote.

## The deterministic invariants, and what they cannot prove

Before any judge is asked for a preference, emitted output is run through a
registry of machine-checkable gates. The registry is human authority in
[`evals/squad-designer/eval-contract.md`](../evals/squad-designer/eval-contract.md);
the implementations live in `src/eval/`.

They cover: the emitted code builds and, for native targets, compiles; axe-core
reports no critical or serious violation; text and UI contrast meets WCAG 2.2;
no horizontal overflow at the declared viewports; reduced motion is honoured;
target sizes and Tab reachability hold; transitions stay off the layout path;
the output owns no application state, data fetching, routing, or lifecycle; no
import outside the manifest's approved set; sources are fetched from the
registry rather than bundled; styling resolves to semantic tokens.

Three properties of the registry are worth knowing before reading a report:

- **A single blocking failure blocks.** The verdict is the worst result in the
  set, never a mean, so one `critical` or `high` failure cannot be averaged away
  by passes elsewhere. `medium` is always reported and never blocks, and of the
  thirteen only the semantic-token check is `medium`.
- **An absent toolchain is `unverified`, never a pass.** A run on a machine with
  no Flutter, no Kotlin, and no Xcode reports three unverified compiles, and a
  single `unverified` result blocks in its own right — as does an empty result
  set. A report where nothing was verified must not read like a report where
  everything passed.
- **Verification depth differs by platform, and is stated rather than implied.**
  Web and adaptive are render-gated. React Native and Flutter currently receive
  the static gates plus a type or analyzer pass, with no rendered gate result at
  all. SwiftUI and Compose are compile plus human review.

What the registry cannot do is tell two passing artifacts apart. Every gate here
answers a yes/no question about correctness; none of them answers whether the
presentation is better. That question is the judging protocol's, and it runs
only after the gates have spoken.

## Judging, and the biases it is built around

Judging is paid, nondeterministic, and lives behind `pnpm eval:judge`. Its
design is mostly a list of known ways model-graded evaluation produces a number
that means nothing:

- **Self-preference.** The judge may not belong to the subject's provider
  family. The runner refuses to start rather than produce a figure needing an
  asterisk, and the validator refuses the same configuration offline, before any
  spend.
- **Position bias.** Every pair is judged twice, in both orders, with the first
  order chosen by a seeded per-case coin. Disagreement between the two orders is
  recorded `inconclusive` and excluded from scoring — not scored as a tie, since
  a flip is evidence the judge responded to position rather than to the artifact.
- **Arm leakage.** Arms are presented as `entry-a` and `entry-b`; model names and
  arm words are redacted, screenshots are copied to neutral paths first, and a
  backstop re-scans the assembled prompt and every image path and refuses to send
  a packet that still leaks a label.
- **Preference without evidence.** The judge fills one entry per rubric the case
  declares, each with written evidence, before it may name a winner. A response
  missing a rubric, answering one twice, or naming a winner every rubric
  contradicts is `inconclusive` rather than a vote.
- **Verbosity.** Judges prefer longer answers independently of quality, so a
  length-matched rewording is judged alongside the pair and must tie. An
  unmeasured control is reported as biased, not as absence of bias.
- **An unmeasured judge.** A human-scored calibration subset is compared against
  the judge on the same pairs, reported as raw agreement and as Cohen's kappa so
  agreement expected by chance is not counted as skill.

An `inconclusive` pair carries why. Three reasons are distinguished by name —
the gates blocked an arm so the pair was never sent, a render could not be
staged, or the budget stop fired — so a maintainer is never sent to debug judge
instability for a case no judge ever saw. Everything that happened at the judge
itself shares the fourth: a flip between orders, a judge that returned nothing,
and an answer that failed the rubric schema all report under one label today,
and the pair's `detail` string is what separates them.

Cost and determinism are reported rather than assumed. Absent usage fields stay
null and propagate to a null total printed as "unknown", because an unknown cost
recorded as zero is a false budget. No temperature control is available on the
judge, so no report claims determinism.

### Thresholds, and what `registered: false` means

A threshold is a number a result has to clear before it counts as anything: the
equivalence boundary the interval's lower bound must clear, the minimum
judge-human agreement, and the fewest labelled pairs an agreement figure may
rest on. They live in the `judging.thresholds` block of the baseline manifest.

They are pre-registered so that a result cannot be explained afterwards by a
threshold chosen to fit it. But a threshold guessed before any agreement has
been measured is not pre-registration either — it is a number with nothing
behind it. So the block carries `registered: false` until the first calibration
is scored, and the promotion gate refuses to state a verdict at all while it is.

If you find `registered: false` in the manifest, read the numbers beside it as
placeholders rather than commitments, and read any promotion refusal naming them
as saying "this has not been calibrated yet", not "this candidate is worse". The
threshold is set from measured agreement, in the same reviewed edit that grows
the calibration set to its minimum. Lowering the minimum to fit the set that
exists would make the agreement figure unfalsifiable, which is what the minimum
is for.

## Why a promotion can be refused

`pnpm promote:designer` is a pure decision over recorded evidence. It mutates
nothing, prints a decision, and exits non-zero unless every gate and the human
approval checklist pass. It collects **every** refusal
rather than returning on the first, so one run tells a maintainer everything
standing in the way instead of revealing the blockers one paid cycle at a time.

| Refusal                                            | What it means                                                                                                                            | What to do                                                                              |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Evidence came from the wrong lane                  | The report was judged on a lane other than the promotion lane                                                                            | Judge the promotion lane. A calibration report scores the judge, not the candidate      |
| Deterministic gates block                          | A `critical` or `high` invariant failed on the candidate                                                                                 | Fix the output. A rubric score never overrides a failed invariant                       |
| Critical regression on a case                      | A case moved from `pass` to non-`pass` against the baseline                                                                              | Fix the regression, or withdraw the candidate                                           |
| A pair is inconclusive                             | Gates blocked, staging failed, the budget stop fired, or something happened at the judge                                                 | Read the reason, then the detail: only the last covers several distinct events          |
| No promotion threshold is registered               | `thresholds.registered` is still `false`                                                                                                 | Score the first calibration, then register the threshold from measured agreement        |
| Calibration unscored, too small, or too low        | Judge-human agreement is unmeasured, rests on too few pairs, or is below the minimum                                                     | Grow and label the calibration set. Revise the rubric or the judge, never the threshold |
| Length and style control biased                    | The length-matched control did not tie, or was not measured                                                                              | Re-run the control; an unmeasured control is reported as biased by design               |
| No decided comparison produced an interval         | Every pair came back inconclusive, so there is no interval at all                                                                        | Upstream of any threshold: fix what made the pairs inconclusive                         |
| Lower confidence bound does not clear the boundary | The lower bound sits at or below the equivalence boundary                                                                                | A positive mean with a wide interval is not evidence. More pairs, or a better candidate |
| Context budget regression                          | The measured budget exceeds the recorded ceiling                                                                                         | Cut content. The ceiling is not raised to fit the change                                |
| Stale knowledge card                               | A cited source passed its freshness date                                                                                                 | Re-read the source and re-review the card                                               |
| Not a major version bump, or an unreadable version | The candidate is not a major bump over the baseline, or one of the two is not a semantic version                                         | Bump the major version, or fix the version string                                       |
| No, or mismatched, approval record                 | Nobody signed, or the signature names another cycle, version, or report                                                                  | A human reviews the diff, transcripts, source provenance and screenshots, and signs     |
| An approval checklist item is unsigned             | One of the four required boxes is not ticked                                                                                             | Do the review the box names, or say why it does not apply and record that               |
| The approval record cannot be read                 | Not valid YAML, not a mapping, missing a reviewer, a non-ISO date, or a missing `cycle_id`, `candidate_version` or `judging_report_hash` | Fill the record out; a partially filled one asserts less than it appears to             |

The approval record is the non-bypassable half. It names the `cycle_id`, the
`candidate_version`, and the `judging_report_hash` it signed, and all three must
match what is being promoted — a signature that does not say what it signed can
be reused against a later, unreviewed candidate. An unticked checklist box is a
refusal rather than a warning. No flag skips it and no measurement substitutes
for it.

Both reports are verified before a single number is read from either. Each
hashes its own body when it is written, and `pnpm promote:designer` recomputes
that hash for the deterministic gate report and for the judging report, and
checks that each names the cycle being promoted. A report edited after its run,
or carried over from another cycle, ends the command before the gate is reached
— so those four exits are not collected alongside the refusals above. Neither
are the earlier ones: a missing or unparseable `report.json` or `judging.json`,
or a flag given without a value, ends the command before any of this. A run that
printed almost nothing and exited 1 failed at one of those, not at the gate.

## The payload budget

Every word a skill ships is a word an agent loads and pays attention over, so
size is governed rather than left to grow.

The governed figure is **entrypoint words plus the median words loaded per task
type**, not total payload. Progressive disclosure means a native reference never
loads for a web task, and a total-payload cap would punish exactly the routing
that keeps a run cheap. Words are whitespace-delimited tokens over the whole
file, matching `wc -w`, so any recorded figure can be checked by hand.

Two rules follow from it, and both bite in ordinary work:

- **Re-measure in the same change.** A change that moves a payload hash a
  baseline manifest records re-measures it in that commit, never in a follow-up,
  and says which cycle in flight that frozen baseline belongs to. Re-measurement
  is part of what a maintainer approves.
- **Cut the content, never raise the ceiling.** There are two ceilings, both
  enforced by `pnpm validate:evals`: the per-skill entrypoint and median-loaded
  figures recorded for the measured skills, and a single cap on how long any one
  reference file may be. Raising either is a deliberate, reviewed contract
  change — and for the reference cap the manifest additionally requires it to be
  recorded in the eval contract. Neither is a step in landing a change that did
  not fit.

There is a stated limit here worth repeating: the routing table and the skill it
measures are edited by the same party, so the gate proves the recorded numbers
reproduce from the tree, not that the routing still reflects how the skill
actually loads references. What keeps routing honest is review of the diff.

## Where to take a change

- **Contributing anything:** [CONTRIBUTING.md](../CONTRIBUTING.md) — what is
  accepted, what is rejected and why, and the maintainer source review CI cannot
  perform.
- **Which evidence your change owes:** [AGENTS.md](../AGENTS.md),
  `Contribution boundary`.
- **A skill got something wrong on real work:**
  [`skill-observations.md`](./skill-observations.md) — how an observation is
  recorded and how it becomes a rule.
- **The cycle currently in flight:**
  [`evals/squad-designer/eval-contract.md`](../evals/squad-designer/eval-contract.md).
- **Installing any of this:** [`installation.md`](./installation.md).
