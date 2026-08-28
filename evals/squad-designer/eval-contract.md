# squad-designer evaluation contract

Human authority for the fixtures in this directory. Machine files
(`baseline-manifest.yml`, `case-manifest.yml`) must agree with this document;
where they disagree, this document is wrong until it is updated deliberately.

Scope: the evaluation cycle that moves `squad-designer` from a spec-only role to
a presentational-code role. Phase 1 defines the contract and freezes the
baseline. Phase 2 performs the role change itself and re-measures. Neither runs
models nor makes paid calls.

## Cycle rules

- One cycle is pinned to one baseline manifest and one private-store commit.
- Baseline artifacts predate any candidate patch or knowledge card.
- Any change to a pinned subject model, judge model, or the acceptance set
  starts a new cycle. There are no mid-cycle swaps.
- `pnpm test` stays deterministic: no network, no credentials, no model calls.

## Lanes

| Lane          | Visibility                   | Purpose                                    | Paid judging |
| ------------- | ---------------------------- | ------------------------------------------ | ------------ |
| `development` | public, in this repository   | iterate on candidates, exercise the schema | no           |
| `calibration` | private, `EVAL_PRIVATE_PATH` | align judges against human labels          | yes          |
| `acceptance`  | private, `EVAL_PRIVATE_PATH` | held-out evidence for promotion            | yes          |

A case belongs to exactly one lane. Overlap between lanes invalidates the
holdout and fails validation.

## Private store

The acceptance and calibration lanes live in the private repository
`danh121097/squad-skills-eval-acceptance`, cloned locally and addressed only by
the `EVAL_PRIVATE_PATH` environment variable.

- The clone must live outside this repository's working tree. Validation fails
  when `EVAL_PRIVATE_PATH` resolves inside the repository, because a readable
  holdout is not a holdout.
- Public CI never sets `EVAL_PRIVATE_PATH`. When it is unset, validation
  verifies the public half of the contract and reports the private half as not
  checked.
- The private commit hash is recorded in `baseline-manifest.yml`. Publishing the
  hash proves the set was frozen without revealing it.
- Private lanes appear here as an id plus a content hash only. Any inline
  `request`, `evidence_packet`, or `expected_source_decisions` on a private case
  is a leak and fails validation.

### Two settled questions about the store

Both were carried from the Phase 1 review and are answered here because a paid
lane is now runnable and their cost only grows with the store.

**The pinned commit gets an annotated tag.** `pnpm validate:evals` already fails
when the store is not parked on `private_store.commit`, so an accidental move is
caught today. What a tag adds is a named anchor that survives a force-push or a
deleted `develop` branch — the two ways a pinned hash becomes unreachable rather
than merely wrong. Tag the pinned commit `eval-cycle-designer-2026-08-27` in the
private repository before the first paid acceptance run. This is a maintainer
action in another repository; nothing in this one can perform or verify it, and
the hash remains the authority either way.

**Held-out case ids become opaque.** `acc-web-billing-usage-panel` and its
siblings publish the subject of a held-out case in a public manifest, which is
mild contamination: the topic of the test is readable by anything that reads this
repository, including a future subject model. Descriptive ids are worth less than
that costs, so held-out cases move to `acc-001`-style ids with the descriptive
title kept only in the private store.

Execution is deliberately deferred and deliberately atomic. Renaming rewrites the
store's files, all four `content_hash` values, and `private_store.commit`;
editing the public half alone fails the gate, which is the correct behavior. It
lands as one reviewed change across both repositories, before Phase 6 opens
contribution and while the store still holds four cases.

## Case schema

Every case declares:

| Field                       | Meaning                                                               |
| --------------------------- | --------------------------------------------------------------------- |
| `id`                        | stable, unique, lowercase kebab-case                                  |
| `lane`                      | `development`, `calibration`, or `acceptance`                         |
| `category`                  | one of the pre-registered categories below                            |
| `target_platform`           | `web`, `adaptive`, `react-native`, `flutter`, `swiftui`, or `compose` |
| `output_type`               | `presentational-code` for this cycle                                  |
| `request`                   | the task given to the author                                          |
| `evidence_packet`           | inputs supplied to the author; never acceptance expectations          |
| `allowed_capabilities`      | what the author may use during the run                                |
| `hard_invariants`           | machine-checkable gates, each an id plus severity                     |
| `qualitative_rubric`        | rubric ids scored by the judge                                        |
| `expected_source_decisions` | the source and reuse choices a correct run makes                      |
| `seed`                      | run seed for reproducibility                                          |
| `config`                    | pinned subject and judge provider, model, and effort                  |

Public cases carry every field. Private cases carry `id`, `lane`, and
`content_hash`; their bodies live behind `EVAL_PRIVATE_PATH`.

## Pre-registered categories

Categories are fixed before any candidate exists, so a later result cannot be
explained by choosing a favorable category mix.

`web-component`, `web-screen-responsive`, `adaptive-tablet-desktop`,
`design-system-tokens`, `motion-and-reduced-motion`,
`accessibility-remediation`, `native-react-native`, `native-flutter`,
`native-swiftui`, `native-compose`.

## Split policy

- Category coverage is declared before cases are authored. A category may exist
  in the public lane before it exists in the private lane; the reverse is never
  allowed to be inferred from public files.
- Development-lane cases are freely editable within a cycle. Private-lane cases
  are frozen for the cycle.
- Growing the private set means a new private commit, therefore a new cycle.

## Hard invariant registry

Promotion is blocked by a single failure at `critical` or `high`, by any
`unverified` result, and by an empty result set. Severity `medium` is always
reported and never blocks: it marks a house-style claim worth fixing rather than
a correctness failure. The verdict is the worst result in the set, never a mean,
so one blocking failure cannot be averaged away by passes elsewhere.

| Id                 | Check                                                    | Severity | Verification tier |
| ------------------ | -------------------------------------------------------- | -------- | ----------------- |
| `INV-BUILD-001`    | the emitted presentational code builds                   | critical | render-gated      |
| `INV-A11Y-001`     | axe-core reports no critical or serious violation        | critical | render-gated      |
| `INV-CONTRAST-001` | text and UI contrast meets WCAG 2.2                      | critical | render-gated      |
| `INV-OVERFLOW-001` | no horizontal overflow at the declared viewports         | critical | render-gated      |
| `INV-MOTION-001`   | reduced-motion preference is honored                     | critical | render-gated      |
| `INV-TOUCH-001`    | interactive targets meet the minimum target size         | high     | render-gated      |
| `INV-KEYBOARD-001` | every interactive element is reachable by Tab            | high     | render-gated      |
| `INV-ANIMCOST-001` | transitions stay off the layout path                     | high     | render-gated      |
| `INV-COMPILE-001`  | the native target compiles                               | critical | compile-tier      |
| `INV-SCOPE-001`    | no state, data fetching, routing, or lifecycle ownership | high     | static            |
| `INV-DEP-001`      | no dependency added without an approval marker           | high     | static            |
| `INV-SOURCE-001`   | sources are fetched from the registry, never bundled     | critical | static            |
| `INV-TOKEN-001`    | styling resolves to semantic tokens, not raw literals    | medium   | static            |

Verification tiers follow plan decision 10: web and adaptive are render-gated,
React Native and Flutter are compile plus partial render, SwiftUI and Compose
are compile plus human review. Native limits are stated, not implied.

Phase 4 implements the compile half of every native tier and the render tier for
web and adaptive only. The partial render for React Native and Flutter is not
built: those platforms currently receive the static gates plus `tsc --noEmit` or
`flutter analyze`, and no rendered gate result is produced for them at all.
That is a smaller claim than decision 10 describes, and it is recorded here
rather than left to be inferred from an absent row in a report.

A case's `hard_invariants` list declares which gates that case was written to
exercise. It is not a filter: the runner executes every gate that applies to the
case's platform, so a case cannot narrow what it is graded on by omitting a
row.

`INV-KEYBOARD-001`, `INV-ANIMCOST-001`, and `INV-TOKEN-001` were added in Phase
4 for the three rows of its gate table that Phase 1 had named as gates but not
as invariants. Registering them makes each one addressable by a case and
blocking at a declared severity, rather than a check that runs and reports into
nothing.

`INV-COMPILE-001` reports twice on SwiftUI and Compose: once at `compile-tier`
for the toolchain result, once at `human-review` for the reviewer's record.
Splitting the tiers rather than the id keeps one invariant per claim while
making the depth of each verification visible in the report.

### What the compile and scope tiers do and do not prove

An absent toolchain is reported as `unverified`, never as a pass. A run on a
machine with no Flutter, no Kotlin, and no Xcode reports three unverified
compiles, and a report where nothing was verified must not be readable as a
report where everything passed.

`INV-SCOPE-001` forbids _owning_ application state, data, routing, and platform
lifecycle. It does not forbid presentation-local state — hover, expansion, focus
— because a component that cannot hold those is not a presentational component.
The static rule table matches network, routing, store, persistence, analytics,
and credential access; it deliberately does not match `useState`, `useEffect`,
`remember`, or `@State`.

## Qualitative rubric registry

Scored blind, order-swapped, and length-controlled. Rubric scores never override
a critical invariant failure.

| Id                | Dimension                                                    |
| ----------------- | ------------------------------------------------------------ |
| `RUB-HIER-001`    | visual hierarchy established before decoration               |
| `RUB-COHERE-001`  | system coherence and reuse of existing primitives            |
| `RUB-MOTION-001`  | motion has purpose, ownership, and a reduced-motion fallback |
| `RUB-CONTENT-001` | realistic content lengths and edge states hold up            |
| `RUB-SLOP-001`    | absence of generic AI-slop presentation patterns             |

## Judging protocol

Judging answers one question the deterministic gates cannot: between two
artifacts that both pass every invariant, is the candidate's presentation
better? It runs only in the paid lanes, only outside `pnpm test`, and only after
gates have already spoken. A case whose baseline or candidate is blocked by a
gate is never judged — a preference between a working screen and a broken one is
not information about the skill.

The pinned contract lives in the `judging:` block of `baseline-manifest.yml` and
is checked by `pnpm validate:evals`. It records the subject model, the judge
model, the sanity subset, the paid lanes, the budget, and the thresholds.

**Cross-provider judging is mandatory.** The judge may not belong to the
subject's provider family: `codex`/`openai` resolve to `openai`, and
`claude`/`anthropic` to `anthropic`. Self-preference is the largest known bias in
model-graded evaluation and is not correctable after the fact, so the runner
refuses to start rather than producing a number that would need an asterisk. The
validator refuses the same configuration offline, before any spend.

**Both orders, every case.** Each pair is judged twice, once with the candidate
presented first and once with the baseline presented first. Which order runs
first is decided by a seeded per-case coin, so the sequence is reproducible
without being the same for every case. The two orders must agree; when they do
not, the case is recorded `inconclusive` and is excluded from scoring
altogether. It is not scored as a tie, because a flip is evidence that the judge
responded to position rather than to the artifact, and averaging that into parity
would let instability read as equivalence.

**Blinding covers filenames as well as prose.** Arms are presented as `entry-a`
and `entry-b`; arm words and model names are redacted from the prompt, and
screenshots are copied to `judge/<case>/<order>/entry-<side>-<n>.png` before the
packet is built, because a path such as `dev-one.candidate/mobile.png` would
defeat prompt-level blinding on its own. An `assertBlind` backstop re-scans the
assembled prompt and every image path and refuses to send a packet that still
leaks an arm label. Redaction runs before the assertion so that candidate code
legitimately containing the word "candidate" does not produce a false refusal,
while a newly introduced leak still fails loudly.

**Evidence precedes preference.** The judge must fill a schema that requires one
entry per registered rubric, each with written evidence, before it may state an
overall winner. A response missing a rubric, or carrying blank evidence, is
`inconclusive` rather than a vote.

**An inconclusive pair says why.** `inconclusive` covers four different events:
the judge flipped between orders, the deterministic gates blocked an arm so the
pair was never sent, a render could not be staged, or the budget stop halted the
run before the case. Each outcome carries the reason, so a maintainer is not sent
to debug judge instability for a case no judge ever saw.

**Length control.** Verbosity is a known confound: judges prefer longer answers
independently of quality. A length-matched rewording of one arm is judged
alongside the pair to estimate that bias, and the control must tie. An unmeasured
control is reported as `biased: true`, not as absence of bias — the honest
default when the measurement did not run.

`judging.length_control` names one case **per paid lane**, and each named case
must belong to the lane it is declared under. A single run-wide reference cannot
work, because a run grades one lane at a time and would find the control case
filtered out. The control's renders are produced by a separate grading pass that
writes only into `graded/`, so it never enters the deterministic verdict; its two
judge calls are still paid for out of the run budget and are counted in the
report's totals.

**Calibration.** A human-scored subset is compared against the judge on the same
pairs, reported as raw agreement and as Cohen's kappa so that agreement expected
by chance is not counted as skill. Human labels live in the run directory, not in
the frozen private store, because a label compares against a candidate that does
not exist at the time the store is frozen. Promotion refuses while calibration is
unscored, below `minimum_judge_human_agreement`, or resting on fewer than
`minimum_calibration_pairs` comparable pairs — a perfect agreement over two
pairs is not a measurement. Only pairs this run actually judged are compared; a
label for a case the run skipped is never counted as agreement.

**The calibration lane is not yet large enough to promote on.** It holds one
case (`cal-web-empty-state-card`) against a registered minimum of six, so the
first promotion is blocked until the private store grows to at least six
calibration cases and a human labels them. That is a prerequisite to record, not
a defect to work around: lowering the minimum to fit the store would make the
agreement figure unfalsifiable, which is what the minimum exists to prevent.

**Scoring and interval.** Judged outcomes score +1 for the candidate, -1 for the
baseline, and 0 for a tie; `inconclusive` is excluded. The reported interval is a
seeded percentile bootstrap over those scores, so it reproduces exactly from
`bootstrap_seed`. A verdict of "better" requires the interval's lower bound to
clear `equivalence_boundary`; an interval that straddles it is reported as "not
distinguishable at this sample size", which is a result, not a failure.

`thresholds.registered` is `false` until the first calibration is scored, and the
promotion gate refuses to state a verdict while it is false. The threshold is
meant to be set from measured judge-human agreement, not guessed before any
agreement exists; recording it as pre-registered before it is registered would be
the exact failure mode pre-registration exists to prevent.

**Cost and determinism are reported, never assumed.** Usage arrives per call and
any absent field stays `null`; a null propagates to a null total, and the report
prints "unknown", because an unknown cost recorded as zero is a false budget.
The hard stop triggers only on a _known_ total exceeding `hard_stop_usd`. No
temperature control is available on the judge, so no report may claim
determinism; order swaps and repeated runs absorb the residual variance and the
report says so explicitly.

**Two judge clients, one guarantee.** The Codex client uses `-i` for renders,
`--output-schema` for the rubric, `--json` for usage, and `-s read-only`; the
Claude CLI has neither `--output-schema` nor `-i`, so it carries the schema and
the render paths in the prompt and is allowed the `Read` tool only. What must not
differ is the guarantee: pixels as well as code, evidence before score, and no
write access from a process grading this repository's own output.

**The sanity subset is not judged.** Its provider is the judge's own family, and
judging it there would reintroduce precisely the self-preference the
cross-provider rule removes. It exists to catch a skill that only works on a top
tier, and deterministic gates answer that question without a preference.

### Promotion

Promotion is a separate decision from the run, and it is not automated.
`pnpm promote:designer` reads the run's reports and refuses for any of:
deterministic blocking, a per-case regression from `pass` to non-`pass`, order
instability, an unregistered threshold, calibration unscored or below its
minimum, a biased or unmeasured length control, a lower bound at or below the
equivalence boundary, a budget regression against `phase_1_reference`, a stale
knowledge card, a non-major version bump, or a missing approval record.

It collects every refusal rather than stopping at the first, so one run tells the
maintainer everything that stands in the way. It mutates nothing: it prints a
decision and exits non-zero.

**Evidence is read from one lane, and the lane is named.** Run artifacts live
under `.eval-runs/<cycle>/<lane>/`, and promotion reads the lane recorded as
`judging.promotion_lane` — which must itself be a paid lane. A report judged on
`calibration` is refused for promotion even when every threshold in it passes:
the calibration lane exists to score the judge, not the candidate.

**A report has to be the one the run produced.** `buildJudgingReport` hashes its
own body, and promotion recomputes that hash before reading a single number. A
report whose verdict, cost, or interval was edited afterwards no longer matches
and is refused. Promotion also refuses a report from a different cycle than the
one being promoted.

The approval record is the non-bypassable half. A maintainer must attest, in
`promotion-approval.yml`, to having reviewed the diff, the transcripts, the
source provenance, and the screenshots. The record also names `cycle_id`,
`candidate_version`, and `judging_report_hash`, and all three must match what is
being promoted: a signature that does not say what it signed can be reused
against a later, unreviewed candidate. No measurement in this repository can
substitute for that attestation, and no flag skips it.

## Budget metric

The governing budget is **entrypoint words plus the median words loaded per task
type**, not total payload (plan decision 5). Progressive disclosure means a
native reference never loads for a web task, so a total-payload cap would punish
correct platform routing.

Task-type routing in `baseline-manifest.yml` transcribes the conditional
reference rules in [`skills/squad-designer/SKILL.md`](../../skills/squad-designer/SKILL.md).
Each entry names the references a run of that task type loads. Routing is human
authority: changing it is a deliberate edit reviewed like any other contract
change, and the recorded word counts are recomputed by `pnpm validate:evals`.

**Known limitation.** The routing table and the skill it measures are edited by
the same party, so the gate cannot prove that a later cycle's routing still
reflects how the skill actually loads references. The gate proves internal
consistency — the recorded numbers reproduce from the tree it measured. What
proves the routing honest is the git history: a routing edit that lowers the
budget shows up as a diff to this cycle's frozen table, and reviewing that diff
is a required step before a cycle's numbers are compared against another's.

Words are counted as whitespace-delimited tokens over the whole file, matching
`wc -w`, so any recorded figure can be checked by hand. The median of an
even-length set is the mean of the two middle values, rounded half-up.

### Phase 2 re-measurement

Phase 2 rewrote the skill the budget governs, so the recorded figures no longer
describe the tree Phase 1 measured. They were recomputed rather than preserved,
because a recorded number that does not reproduce from the working tree turns
the gate off. What Phase 1 measured is kept as `phase_1_reference` in
`baseline-manifest.yml` so the comparison target is a stated number rather than
a git-history lookup:

| Figure                       | Phase 1 | Phase 2 | Delta |
| ---------------------------- | ------: | ------: | ----: |
| `squad-designer` entrypoint  |   1,014 |   1,126 |  +112 |
| median loaded words per task |   2,018 |   2,187 |  +169 |
| total payload words          |   5,055 |   5,285 |  +230 |

The overage is a Phase 3 input, not an accepted regression. Phase 3 owns the
1,014-word entrypoint cap and the no-regression rule on median loaded words, and
its planned work — merging two references away and turning the entrypoint into a
platform/source router — is what pays the overage back. Phase 2 stayed inside
the existing seven-reference structure on purpose: consolidating and changing
the role contract in one step would make a routing regression and a boundary
regression indistinguishable.

The pinned subject model, judge model, and acceptance set did not change, so
re-measurement stays inside this cycle rather than starting a new one.

### Phase 3 re-measurement

Phase 3 consolidated the reference set and expanded platform coverage, then
re-measured and paid the Phase 2 overage back under the Phase 1 figures:

| Figure                       | Phase 1 | Phase 2 | Phase 3 |
| ---------------------------- | ------: | ------: | ------: |
| `squad-designer` entrypoint  |   1,014 |   1,126 |   1,014 |
| median loaded words per task |   2,018 |   2,187 |   1,813 |

Structural changes: `official-sources.md` is the single source and capability
registry; `design-mindset-evaluation-and-official-sources.md` and
`runtime-capability-fallbacks.md` merged into their owning references and were
deleted; `ui-foundation-and-motion-selection.md` became
`platform-web-foundations-and-motion.md`; native cross-platform, Apple/Android,
and adaptive references were added with tiered verification (plan decision 10).
Total payload grew to 6,813 words — deliberately unbounded, because the loaded
set per task, not the payload, is the governed budget (plan decision 5).

The routing table changed with the consolidation; the manifest annotates each
routing edit with the consolidation that justifies it, and the diff review
required by the budget-metric limitation above is how those edits were
accepted. The same phase made `phase_1_reference` a machine-enforced ceiling,
closing the open question Phase 2 left about an unenforced comparison.

### In-cycle re-measurement: AgentKit pairing

The squad skills replaced the "AgentKit is optional" stance with an explicit
detect-then-pair contract: a role detects AgentKit once, reads its task-relevant
references, then pairs the phase-matched `ak:*` skill, or runs the native
fallback at the same standard. `ui-ux-pro-max` is named as consulted reference
data rather than a skill a role delegates to, and every skill gained a checklist
item requiring the report to name the references it loaded or say why one was
skipped. The change spans all nine squad skills; this cycle measures the three
it governs.

| Figure                       | Phase 1 | Phase 3 |   Now |
| ---------------------------- | ------: | ------: | ----: |
| `squad-designer` entrypoint  |   1,014 |   1,014 | 1,013 |
| median loaded words per task |   2,018 |   1,813 | 1,958 |
| total payload words          |   5,055 |   6,813 | 7,137 |

The entrypoint stayed under its cap without trimming knowledge: the intake
requirement folded into an existing checklist item, and a pointer the source
router already carried was removed. The median rose because the pairing contract
and the `ui-ux-pro-max` registry entry live in `official-sources.md`, which the
median-setting task type loads. It stays under the `phase_1_reference` ceiling,
so the no-regression rule holds without raising the number it is measured
against.

One routing edit, reviewed as its own diff under the budget-metric limitation
above: `design-system-tokens` now loads `anti-slop-quality-review.md`. The
reference's "System coherence" checks govern tokens, anatomy, variants, radii,
borders, shadows, icons, and state behavior — token work is what they are about,
and tokens are the foundation later screens inherit. The edit raises that task
type's load rather than lowering the budget, and the entrypoint condition reads
"material UI/design-system work" to match. `adaptive-split-view` was considered
and rejected: it is the lightest task type, so loading anti-slop there would make
it the median and push past the ceiling, and adapting an existing system to a
size class is layout and input work, not visual direction.

No reference was added, removed, or renamed, and no `boundary_hash` moved: role
boundaries did not change, only how each role sources knowledge and tools. The
pinned subject model, judge model, and acceptance set are unchanged, so this is
still the same cycle.

### Per-reference cap: from prose to gate

The same amendment broke a limit no code enforced. Phase 3 carried "no single
reference exceeds 800 words" as plan text; the pairing contract, the
`ui-ux-pro-max` registry row, and the widened fallback table pushed
`official-sources.md` to 945 words and `anti-slop-quality-review.md` to 802,
with `pnpm test` green from start to finish. That is the failure the Phase 3
review predicted when it accepted the convention as-is.

The limit is now `budget.max_reference_words` in the manifest, checked by
`pnpm validate:evals` against every reference of the governing skill. The field
is required rather than optional: an optional cap can be deleted to silence a
breach, which is the same hole in a different shape.

**The cap is raised from 800 to 1,000 as a reviewed contract change.** The number
is derived, not chosen for comfort. Entrypoint 1,014 plus a 1,000-word reference
is 2,014, still under the 2,018 `phase_1_reference` median ceiling, so 1,000 is
the largest cap that cannot break the median through `degraded-runtime-fallback`
— the task type that loads the entrypoint and `official-sources.md` and nothing
else, and therefore sets the median. Above 1,000 the two limits would contradict
each other; below it, the cap would bind earlier than the governing metric
without a measured reason.

Why raise rather than trim back to 800: the median metric only guards the one
reference the median task type loads. The other eight are all routed above the
median, so they can grow without moving any measured number — the per-reference
cap is the only check they have. Trimming 145 words to restore a figure nothing
verified would have cost real content and left the same hole open for the next
edit. The governing metric itself is untouched: `phase_1_reference` still reads
1,014 and 2,018, and the measured budget still has to fit under both.

## What the recorded commits mean

`repository.commit` names the commit whose `skills/` tree Phase 1 measured, so
it anchors the `phase_1_reference` figures rather than the figures recorded
above them — those Phase 2 recomputed from a later tree. Nothing validates it:
`pnpm validate:evals` machine-checks `private_store.commit` and never reads this
one. The freeze proof for the current figures is `payload_hash` and the recorded
word counts, which the gate recomputes from the working tree on every run — a
drifted skill fails whatever the commit line says.

`phase_1_reference` is human-maintained but, since Phase 3, machine-enforced:
`pnpm validate:evals` fails when the measured budget's `entrypoint_words` or
`median_loaded_words` exceeds the recorded reference figures. The block is
optional in the schema — a first cycle has no predecessor — but once present it
is a ceiling, so a cycle that edits or removes it is editing the number it is
measured against, and reviewing that diff remains the control on the ceiling
itself.

`private_store.commit` is the opposite: it is machine-checked. When
`EVAL_PRIVATE_PATH` is set, the gate reads the store's `.git` HEAD and fails if
the store is not parked on that commit.

## Boundary statements

Captured at baseline so Phase 2 can detect drift when the three skills change
their shared handoff contract in the same cycle (plan decision 7). The manifest
records a hash of each skill's `## Scope and boundary` section; the statements
themselves stay in the skills, which remain the single source.

- `squad-designer` hands over presentational component code, not a written spec,
  with props and slots left open for the consumer to bind. state, data fetching,
  API integration, routing, forms submission, and platform lifecycle stay with
  the build role. **Changed in Phase 2; `boundary_hash` moved with it.**
- `squad-frontend` builds the client side and does not implement server APIs,
  schemas, server business logic, infrastructure, or deployment.
- `squad-mobile` owns screens, navigation, client state, persistence, and
  platform integration, and does not implement shared server APIs or web UI.

`squad-frontend` and `squad-mobile` keep their Phase 1 `boundary_hash`: what they
deliver did not change, only what they receive, which is stated in their design
intake references. Those references are held to the shared wording by
`src/catalog/cross-skill-contract-validator.ts`, which fails `pnpm validate` when
any one side of the handoff is edited alone.

## What Phase 1 deliberately does not do

- No model runs, no judging, no scoring.
- No change to any skill's content or version.
- No render harness; that is Phase 4.
- No public `learn-skill` package (plan decision 4).

## What Phase 2 deliberately does not do

- No model runs, no judging, no scoring; the invariant and rubric registries stay
  unexercised until Phase 4 builds the harness.
- No reference consolidation and no platform expansion; that is Phase 3.
- No enforcement of the forbidden-import rule `INV-SCOPE-001` names. Phase 2
  states the boundary in prose and gates the wording; proving emitted code obeys
  it needs the Phase 4 harness.

## What Phase 4 deliberately does not do

Phase 4 builds the harness that turns the invariant registry into measurements.
Four boundaries keep what it proves narrower than what it runs.

- **No judging and no scoring.** Every rubric row in this contract stays
  unexercised. The harness emits `pass`, `fail`, or `unverified` per invariant
  and a max-over-severity verdict; nothing weighs one invariant against another
  and nothing produces a number. Rubric judging is a later phase.
- **No model runs.** The harness grades output that already exists in a run
  directory. Producing that output — invoking the skill against a case — is not
  part of this phase, which is why a case with no candidate reports
  `unverified` rather than passing.
- **No browser inside `pnpm test`.** The repository gate stays offline and
  deterministic: it exercises gate _decisions_ against fixture snapshots. Vite,
  Playwright, and Chromium run only under `pnpm eval:designer`, so a machine
  without a browser can still verify the contract, and a run that could not
  reach one reports `unverified`.
- **No autonomous knowledge ingestion.** Cards under `knowledge/` are written and
  reviewed by a person. The validator never fetches a `source_url`; a dead
  source is declared at review time through `source_status`, and an unreviewed
  card fails the gate rather than being read.

What `review_status: reviewed` guarantees is bounded, and the bound is worth
stating. It is an attestation: `reviewed_by` names a person, and nothing in this
repository can confirm that person read the source. Two parts of it are
checkable and are checked — `published_or_verified_on` may not be in the future,
and freshness lapses on the declared date, after which the card blocks promotion
until someone re-reviews it. The rest is trust, deliberately, because the
alternative is the autonomous ingestion this cycle rules out.

`pnpm evals:links` closes the one remaining unfalsifiable half of that trust. It
requests each `source_url` and reads **the status code only** — the response body
is cancelled, never consumed — so a moved or deleted page is caught without any
source content reaching the model, the cards, or a report. It is outside
`pnpm test` for the same reason the browser is: the repository gate does not
depend on third-party hosts. Run it when reviewing cards, and before a promotion
that consumes them.

Two limits are worth stating because they look like coverage and are not.
`INV-ANIMCOST-001` gates the deterministic half of animation cost — whether a
transition or keyframe touches a layout property. It does not measure frame
timing at all: a wall-clock threshold is machine-dependent and would make the
gate flaky rather than strict, so the harness observes no timing and the gate
claims none. And `INV-COMPILE-001` on SwiftUI and Compose proves the candidate
compiles, not that it looks right; the second, `human-review` result stays
`unverified` until a person records a verdict in `manual-review.yml`.

One threshold deliberately exceeds the standard. `INV-TOUCH-001` holds web
targets to 44px, which is Apple's minimum and roughly WCAG 2.2's 2.5.5 Target
Size (Enhanced) at AAA — not the 24px of 2.5.8 at AA. This is house policy, not
a transcription error: a control sized for the strictest platform the designer
ships to is correct everywhere, and sizing to the AA floor would make the same
component fail its own iOS case. Anything meeting 44px meets 24px, so the
stricter number never produces a result the standard would call wrong.

## What Phase 5 deliberately does not do

Phase 5 builds the judging and promotion machinery. Five boundaries keep what it
proves narrower than what it can run.

- **No paid run was performed.** Every module here is offline-tested against
  injected runners; no subject model produced an artifact and no judge graded
  one. The harness is verified, the skill is not yet measured. Running a cycle
  needs provider credentials and budget, and is a maintainer operation.
- **No number is promoted.** `thresholds.registered` is `false`, so the gate
  refuses to state a verdict. The first scored calibration is what turns
  judging from a mechanism into a measurement.
- **No automated promotion.** Nothing in this repository can promote a
  candidate. The gate can only refuse; a maintainer's reviewed attestation is
  the only path forward, and there is no flag that skips it.
- **No paid or nondeterministic work inside `pnpm test`.** The repository gate
  stays offline, free, and deterministic. `pnpm eval:judge` and
  `pnpm promote:designer` are separate entry points, and a machine with no
  credentials still verifies the whole contract.
- **No claim of judge determinism.** Temperature is not controllable on the
  pinned judge. Order swapping and repeated runs bound the variance; they do not
  remove it, and the report states this rather than implying reproducibility the
  contract cannot enforce.
