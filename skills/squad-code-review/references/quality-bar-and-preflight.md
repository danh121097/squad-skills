# Quality bar and pre-flight

Read before issuing a verdict. Every check is performed against the diff and the repository's own commands,
so the pass holds with no other skill installed. The review is the last gate, so its own failure modes cost
more than the ones it looks for.

## What weak review output looks like

- A blocker diluted into advice — "consider improving security" where the failing path, the trigger and the
  remediation are all concrete.
- A finding asserted without tracing the callee, so a race, a leak or a bypass is reported that the unread
  implementation may already prevent.
- Style stated as a defect, or a personal architecture demanded over a working repository idiom.
- One root cause reported as many findings, one per location, inflating the count and burying the cause.
- Approval through uncertainty; or `NEEDS_EVIDENCE` used for evidence the gate never required.
- Polished comments, generated tests, invented APIs and broad try/catch taken at face value.
- Only the edited hunks read, with renamed, deleted, generated and configuration paths skipped.
- The reviewer quietly fixing what it is judging.
- A self-review reported as an independent gate.

## Pre-flight

Pass every applicable check honestly.

### Scope

- Exact revision, base, acceptance criteria and QA evidence are resolved before the first finding.
- Blast radius traced: callers, contracts, data and permission paths, migrations, config, rollout, tests.
- Spec compliance settled first; taste review never precedes an unmet requirement.

### Evidence

- Every finding names the input or state that triggers it and the line where behavior goes wrong.
- Anything unproven is a question or `NEEDS_EVIDENCE`, not a defect stated with certainty.
- A cheap check was run where one existed, and a claim it contradicts was dropped rather than softened.
- A user decision is surfaced with its trade-off, not reversed inside a finding.

### Severity and shape

- Severity reflects user and system impact, not how unusual the pattern looks.
- Each finding carries file:line, failure condition, impact and one concrete remediation.
- Findings are deduplicated to one per cause, with the affected locations listed under it.

## Proof to hand over

State the verdict, what was inspected and what was not, the checks that ran, and the residual risk. A
review with no findings still reports all of it. Say whether this was independent-agent review or a
single-session logical pass; never present a self-review as independent evidence.
