# Quality bar and pre-flight

Read before handing a plan to the user or the lead. Every check is answerable from the plan itself, so the
pass holds with no other skill installed.

## What weak framing output looks like

- A solution restated as an outcome, so no cheaper answer was ever considered.
- Criteria nobody can fail — "intuitive", "performant", "robust" — carried as if they were checks.
- Non-goals missing, so everything unmentioned is silently in scope.
- A stack, library or architecture chosen in passing by a role that does not own that decision.
- Assumptions promoted to decisions between the first draft and the second, losing their labels.
- Phases that mirror a calendar rather than a dependency, so two of them cannot run in that order.
- A required capability assigned to the nearest role, or several roles listed without distinct responsibilities.
- Ceremony: nine artificial phases for a two-file change, or repeated prose that adds no execution detail.
- Plan files written into the user's repository because they seemed tidy, not because the user asked.
- A monolithic written plan whose phase summaries hide the steps, checks, risks and handoffs an owner needs.
- Execution started — a file edited, a role invoked — by the role whose contract ends at the handover.

## Pre-flight

Pass every applicable check honestly.

### Frame

- The outcome is in the user's terms and names who it is for.
- What was already decided is recorded as given, and none of it was quietly re-opened.
- Non-goals are stated, with deferred distinguished from refused.
- Every criterion names an observable condition that can fail; anything that cannot is marked unverified
  with its reason rather than replaced by a proxy.

### Decisions

- No stack, architecture, data-model or UI/UX decision was made here; each one the plan depends on is listed
  as open with its owner named.
- Every assumption is labeled, in a list the user can correct in one pass.
- Each open fork carries a default, so the user can accept instead of composing an answer.

### Phases

- Each phase names one or more required Squad roles, gives each a distinct responsibility, and states what
  must be true before work starts.
- The order follows dependency, and no two parallel phases share the same files.
- The first slice is complete for someone, and the plan says whether it buys demand or feasibility evidence.
- Proportion: the plan is as small as the work.

### Written bundle

- `plan.md` links to exactly one zero-padded `phase-XX-kebab-case-title.md` file for every phase.
- The index carries plan-wide authority and navigation; phase details are not duplicated there.
- Every phase file states context, objective, deliverables, required roles, distinct role scopes,
  prerequisites, ordered steps, acceptance evidence, risks or recovery where applicable, and its handoff
  condition.
- `roles` is always a list. A multi-role phase includes a role-responsibility table with concrete
  deliverables and producer/consumer handoffs, while live file and agent-instance assignment stays with the lead.
- Numbering, dependencies and status agree between the index and phase files; each plan-wide criterion
  traces to expected evidence in at least one phase.
- Detail exposes omitted scope without inventing implementation choices, files, commands or measurements.

### Boundary

- Nothing was executed, assigned or gated.
- Plan files exist only because the user asked for them, where they chose or approved.

## Proof to hand over

Give the outcome, constraints and non-goals; the criteria with any marked unverified; the phases with roles,
responsibilities and preconditions; the labeled assumptions; the unknown register; and the decisions the
user still owes. Say plainly that nothing has been accepted and nothing has run.
