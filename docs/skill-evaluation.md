# Evaluate skill changes

The offline gate checks catalog integrity and evaluation tooling. It does not run
Claude or Codex, spend model credits, or establish that output improved. Keep the
current model/effort mapping until a repeated comparison supports changing it.

## Inspect reading cost

```sh
pnpm payload:report
```

The JSON reports entrypoint, each declared path, median, maximum and total words
for each skill. Workflow scenarios additionally report unique payload words (each
file counted once) and fresh-invocation words (each declared role invocation pays
again). Neither is an actual token bill: runtime instructions, repository content,
tool output, repeated turns, cache behavior and reasoning are excluded. An empty
load list, such as installation advice, means no skill payload was declared, not
that the task costs zero tokens. Route overlap is explicit in the case definitions.

Lead and fix paths cover complete deliveries or repairs, not isolated stages.
Designer adaptive paths include their platform. The revised ceilings for these
three roles correct the accounting basis; their increases are not payload savings.
Keep the ceiling gate, review each path and maximum as well as the median, and
update router prose and `src/catalog/skill-task-types.ts` together.

## Prepare identical tasks

```sh
pnpm eval:skills list
pnpm eval:skills prepare proven-regression /tmp/squad-baseline-counter
```

The destination must be new and its parent must exist. Preparation snapshots the
catalog and creates `workspace/`, `skills/`, `README.md`, `prompt.txt`, `metadata.json` and a
separate `rubric.json`. It launches nothing. Preparation may leave a partial packet
on an I/O failure; discard that task-owned packet and prepare a new destination.
For `missing-peer`, only the lead skill is supplied. The plugin-only scenario is
installation advice; the installer behavior is independently covered by unit tests.

For a baseline, run the same preparation tool against the baseline checkout. For
a candidate, prepare from the candidate checkout. Keep the scenario prompt,
fixtures and rubric identical: mismatched fixture hashes cannot be compared. When
the baseline predates this harness, use the candidate harness with its exported
`prepareSkillEvaluation(baselineRoot, scenario, destination)` function so both arms
use the same fixtures while snapshotting different skill trees.

Run each packet in a fresh, explicitly authorized Claude or Codex session, using
`workspace/` as its working directory. Register only that packet's skill snapshot
using the runtime's supported project skill location, or explicitly load its role
entrypoint and relevant references from `../skills/`. Use the catalog metadata for
routing trials. Disable unrelated installed skills and agents for the controlled
comparison; run a separate coexistence trial if plugin competition is the question.
Do not change global configuration for a trial. Installation-advice trials also
receive the packet's README, since the recovery command lives there. The catalog
hash includes that README so documentation-only changes remain distinguishable.
Give the worker `prompt.txt`, never the rubric or expected results. Ensure that
capability restrictions in the prompt match the actual tools available.

Use the same model, effort, tool access, fixture and environment within each pair.
Start with at least three repetitions per arm and runtime, alternate run order,
and report the sample size; a small pilot is not a statistical guarantee. Preserve
transcripts, actual diffs and executed command output outside the product repo.
Do not launch evaluation sessions when the user has forbidden delegation or other
model sessions. Offline packet/tooling verification is still possible in that case.

## Grade observed behavior

A reviewer grades every criterion from the artifacts and transcript. A model's
claim that it passed is not evidence. Record actual runtime model and effort when
available; mark unconfirmed values explicitly and do not use them to justify a
mapping change. Use runtime-reported token totals consistently across the pair;
missing usage is `null`, never zero. Cache/reasoning breakdowns, tool calls and
repair rounds remain in the retained transcript when the runtime exposes them.

A result file is a JSON array. Each row has:

- `scenario`, `fixtureHash`, `catalogHash`: copied from the packet metadata.
- `runtime`: `claude` or `codex`; `model`, `effort`: actual settings or clearly
  labeled unconfirmed values.
- `sample`: positive repetition number, unique within scenario/runtime/settings/catalog.
- `elapsedMs`: observed end-to-end duration; `totalTokens`: observed total or `null`.
- `checks`: exactly the rubric's keys, each containing `passed` (boolean) and
  `evidence` (a non-empty transcript/artifact reference explaining the observation).

```sh
pnpm eval:skills report /tmp/squad-results.json
```

The report groups by scenario, runtime, model, effort and catalog. It reports pass
rate and duration, and includes failed runs' tokens in cost per passing task.
Unknown usage and zero passing tasks produce no cost-per-pass figure. Incomplete
criteria, duplicate samples or different fixtures are rejected. The reporter
validates records; it cannot authenticate a transcript or judge evidence itself.

Accept a content change only after reviewing safety, acceptance failures and
quality, then comparing cost and latency. Do not average away an authorization or
external-gate violation. Keep runtime versions and tool availability with the
comparison, and do not pool unlike model configurations into a claimed saving.

## Runtime compatibility

Runtime claims are capability-dependent. As checked on 2026-10-19:

- [Claude subagents](https://code.claude.com/docs/en/sub-agents) support nesting
  subject to version, depth limits and tool availability.
- [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)
  document project-scoped agents. The CLI still retains its tested global
  registration path; project installation support needs a separate runtime
  compatibility test before changing that installation contract.

Native design verification similarly reports the actual compiler, renderer,
device checks or human review used, rather than assuming a fixed tier by framework.
