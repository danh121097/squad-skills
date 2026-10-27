# Evaluate skill changes

The offline gate checks catalog integrity and evaluation tooling. It does not run
Claude or Codex, spend model credits, or establish that output improved. Keep the
current model/effort mapping until a repeated comparison supports changing it.

## Inspect reading cost

```sh
pnpm payload:report
pnpm payload:report --root /tmp/squad-baseline
pnpm payload:report --baseline-root /tmp/squad-baseline
```

`--root` selects the catalog to measure (the current checkout by default).
`--baseline-root` adds per-skill and per-path deltas against a saved catalog.
Both roots use the current harness's named paths; snapshot code is never executed.
`readingPathsHash` identifies that path population, and the comparison function
rejects reports whose path hashes differ. Keep the path manifest with a baseline
so later routing edits cannot be mistaken for content savings.

Before editing skill content, copy `skills/` and `README.md` into a new snapshot
directory, including pending changes. Record the base revision, pending diff/hash,
runtime versions and payload report beside it. An ignored directory under `plans/`
is suitable for local evidence. Keep this snapshot unchanged and use it for both
payload measurement and baseline packets; a Git revision alone misses dirty edits.

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
Frontend UI motion and interactive graphics/games have separate paths: ordinary
UI motion excludes the graphics-runtime reference. This split changes the median's
population; compare both catalogs on the same paths before attributing any delta.

## Prepare identical tasks

```sh
pnpm eval:skills list
pnpm eval:skills prepare proven-regression /tmp/squad-baseline-counter
```

The destination must be new and its parent must exist. Preparation snapshots the
catalog and creates `workspace/`, `skills/`, `README.md`, `prompt.txt`, `metadata.json` and a
separate `rubric.json`. It launches nothing. Preparation may leave a partial packet
on an I/O failure; discard that task-owned packet and prepare a new destination.
Keep runnable packets outside the product checkout: generic test discovery can
otherwise execute their deliberately failing fixtures. Only catalog snapshots,
reports and packet indexes belong under the checkout's ignored `plans/` directory.
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

## Domain and routing scenarios

The domain cases add three output checks:

- `product-partial-frame`: preserve settled requirements while exposing unresolved
  policy, acceptance and sequencing decisions.
- `mobile-offline-retry`: preserve persisted edits and IDs across timeout/restart,
  including restart while send is pending; reject unrelated acknowledgements and
  retain edits queued during send. The Node
  fixture proves shared logic only; native storage and device lifecycle need separate evidence.
- `devops-untrusted-pr`: repair an unsafe validation workflow for fork PRs. The
  workflow is inert fixture text; local tests and parsing cannot prove a GitHub run.

The [routing protocol](skill-routing-evaluation.md) defines 20 activation-only
queries, fixed train/validation splits, near-miss pairs and no-skill negatives.
These use metadata discovery rather than an explicitly named skill. Domain cases
name their role to isolate output quality from activation quality.

## Coordination trials

Packets with `setup.txt` require evaluator preparation before the worker starts. This file stays outside
the worker prompt, is included in the fixture hash, and is never executed by `prepare`. Its Git setup
applies only to disposable trial repositories; it grants no commit permission in the product repository.
The primary fixture repository stays inside the packet. Runtime-managed worktrees may live elsewhere;
record their absolute paths and trial ownership and clean only those verified resources after transfer
or explicitly authorized trial teardown. Never force a runtime to use an unsupported worktree location.
Do not launch these trials when the user forbids worker sessions or subagents.

The coordination cases cover light thread work, an unstarted valid launcher, a missing paired Review
subagent, parallel worktrees inheriting dirty changes, and integration against a changed target. The
existing high-risk no-delegation case now explicitly names main to test that direct-work overrides win.
Provision the stated capabilities or report the trial unavailable; a textual claim that a tool is missing
while it remains callable is not a controlled trial. Worktree trials need Git and isolated checkouts;
use each runtime's supported equivalent and record incompatibilities, not synthetic success.

The offline regression suite proves the math fixture fails for both defects and passes after both repairs,
packet separation and reading-path coverage. It does not execute the orchestration. Grade actual tool
calls, checkout paths, frozen diffs, verdicts, integrated contents and cleanup from authorized runtime runs.
Declared coordination payload paths use the Codex route; Claude comparisons use observed runtime usage,
not that static estimate. Keep model mappings fixed until repeated results support a change.

The `coordinator-follow-up-codex` and `coordinator-follow-up-claude` packets exercise a
single-role entrypoint after a completed worker task and context summary, including its route back to the
lead dispatch contract. Their follow-up prompt does not
repeat delegation instructions. Packet tests verify preparation, not actual model compliance.

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

## Observe reading behavior

Reading trials add `reading-rubric.json` beside the evaluator rubric, outside the worker workspace and
prompt. Its required/forbidden paths participate in the fixture hash. The new cases cover subagents
without chat/worktree reading, Claude sessions with unverifiable preferences, reuse across a follow-up,
and routing from shortened discovery descriptions. The compaction case also requires reading evidence.
Provision the setup exactly; unavailable runtime controls mean an unavailable trial.

For these cases, supply `reads` in each result. Every actual skill-file read has a canonical package path
such as `skills/squad-frontend/SKILL.md`, stable session/worker `context`, transcript `evidence`, and a
`reason`: `initial`, `file-change`, `context-recovery` or `scope-change`. Record the whole trace, including
unrelated reads, and justify each reread from the artifact history. Reuse of existing context is not a
new read. Separate workers legitimately read the same file, so repetition is counted within a context.
These observations stay in evaluator-owned artifacts, never handoff records in a user's repository.

The report counts observed reads, repeated reads, unjustified rereads, forbidden reads and missing
required files. Missing required or forbidden reads, and unjustified rereads, prevent a passing trial
even if all output checks pass. Legacy scenarios may omit reads; their reading statistics stay `null`,
not zero. The reporter checks record structure and declared expectations, not transcript authenticity;
reviewer evidence is still required. Total tokens and cache behavior remain runtime measurements.

Payload comparisons must use the same named task paths before and after a change. Adding explicit
subagent and shared-checkout paths changes the median's population; that change alone is not a saving. Designer motion,
accessibility and local-pattern paths now include their web platform and handoff references; native
paths keep their own platform. Use optional examples only when a concrete ambiguity calls for them.
