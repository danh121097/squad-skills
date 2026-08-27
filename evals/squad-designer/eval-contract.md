# squad-designer evaluation contract

Human authority for the fixtures in this directory. Machine files
(`baseline-manifest.yml`, `case-manifest.yml`) must agree with this document;
where they disagree, this document is wrong until it is updated deliberately.

Scope: the evaluation cycle that moves `squad-designer` from a spec-only role to
a presentational-code role. Phase 1 defines the contract and freezes the
baseline. It runs no models and makes no paid calls.

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

Severity `critical` blocks promotion on its own. Severity `high` blocks
promotion in aggregate and is always reported.

| Id                 | Check                                                    | Severity | Verification tier |
| ------------------ | -------------------------------------------------------- | -------- | ----------------- |
| `INV-BUILD-001`    | the emitted presentational code builds                   | critical | render-gated      |
| `INV-A11Y-001`     | axe-core reports no critical or serious violation        | critical | render-gated      |
| `INV-CONTRAST-001` | text and UI contrast meets WCAG 2.2                      | critical | render-gated      |
| `INV-OVERFLOW-001` | no horizontal overflow at the declared viewports         | critical | render-gated      |
| `INV-MOTION-001`   | reduced-motion preference is honored                     | critical | render-gated      |
| `INV-TOUCH-001`    | interactive targets meet the minimum target size         | high     | render-gated      |
| `INV-COMPILE-001`  | the native target compiles                               | critical | compile-tier      |
| `INV-SCOPE-001`    | no state, data fetching, routing, or lifecycle ownership | high     | static            |
| `INV-DEP-001`      | no dependency added without an approval marker           | high     | static            |
| `INV-SOURCE-001`   | sources are fetched from the registry, never bundled     | critical | static            |

Verification tiers follow plan decision 10: web and adaptive are render-gated,
React Native and Flutter are compile plus partial render, SwiftUI and Compose
are compile plus human review. Native limits are stated, not implied.

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

## What the recorded commits mean

`repository.commit` names the commit whose `skills/` tree the baseline was
measured from. Phase 1 changed no skill content, so it stays at that commit and
is **not** re-recorded when later phase work lands; re-recording it would point
at a tree the measurement never ran against. It is a human-readable anchor, not
the freeze proof. The freeze proof is `payload_hash` and the recorded word
counts, which `pnpm validate:evals` recomputes from the working tree on every
run — a drifted skill fails the gate whatever the commit line says.

`private_store.commit` is the opposite: it is machine-checked. When
`EVAL_PRIVATE_PATH` is set, the gate reads the store's `.git` HEAD and fails if
the store is not parked on that commit.

## Boundary statements

Captured at baseline so Phase 2 can detect drift when the three skills change
their shared handoff contract in the same cycle (plan decision 7). The manifest
records a hash of each skill's `## Scope and boundary` section; the statements
themselves stay in the skills, which remain the single source.

- `squad-designer` produces specs, not production code, and hands the accepted
  contract to `squad-frontend` or `squad-mobile`. **Phase 2 changes this.**
- `squad-frontend` builds the client side and does not implement server APIs,
  schemas, server business logic, infrastructure, or deployment.
- `squad-mobile` owns screens, navigation, client state, persistence, and
  platform integration, and does not implement shared server APIs or web UI.

## What Phase 1 deliberately does not do

- No model runs, no judging, no scoring.
- No change to any skill's content or version.
- No render harness; that is Phase 4.
- No public `learn-skill` package (plan decision 4).
