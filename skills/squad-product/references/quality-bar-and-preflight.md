# Quality bar and pre-flight

Read before handing a plan to the user or the lead. Every check is answerable from the plan itself, so the
pass holds with no other skill installed.

## What weak framing output looks like

- A solution restated as an outcome, so no cheaper answer was ever considered.
- Criteria nobody can fail — "intuitive", "performant", "robust" — carried as if they were checks.
- Assumptions promoted to decisions between the first draft and the second, losing their labels.
- Phases that mirror a calendar rather than a dependency, so two of them cannot run in that order.
- Ceremony: nine artificial phases for a two-file change, or a bundle directory for a one-phase plan.

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

### Written plan

- Shape: a written plan of one or two phases is a single plan.md declaring layout: single; a larger one is
  one directory whose root holds only plan.md and the standard phases, artifacts, adr and references
  directories, with every phase file in phases/ named phase-XX-kebab-case-title.md and every link relative.
- No slot was filled to complete the shape: every ADR, artifact and reference records something that
  already exists. An artifact records its owning phase, owner, revision and status in frontmatter, never in
  a phase-XX- filename prefix, which phases/ alone reserves.
- Each phase file states its objective and deliverables, its roles and their distinct scopes, ordered work
  steps, and acceptance criteria with expected evidence; context, prerequisites, risks and handoff are added
  when they have content.
- Numbering, dependencies and status agree between the index and phase files, and each plan-wide criterion
  traces to expected evidence in at least one phase.

### Boundary

- Nothing was executed, assigned or gated.
- Plan files exist only because the user asked for them, where they chose or approved.

## Proof to hand over

Give the outcome, constraints and non-goals; the criteria with any marked unverified; the phases with roles,
responsibilities and preconditions; the labeled assumptions; the unknown register; and the decisions the
user still owes. Say plainly that nothing has been accepted and nothing has run.
