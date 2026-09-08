# Scope, phasing and sequencing

Read when deciding what ships first, what waits, and in what order the work can be done.

## Cut, do not dilute

The wrong way to make work smaller is to keep every feature and lower the standard on all of them. That
ships nothing anyone can use, behind a full checklist.

Cut by whole outcomes instead. One flow that works end to end, including its error and empty states, beats
four flows that each stop at the happy path. The question is not "what can we leave out of each feature" but
"which single outcome, complete, is worth having next week".

## The first slice

The first slice is the smallest thing genuinely usable by the person the outcome named, and it proves the
risky assumption. Those pull in different directions often enough to name:

- If the risk is **whether people want it**, the first slice is the thinnest usable path, on unglamorous
  infrastructure.
- If the risk is **whether it can be built** — an untested integration, an unmeasured performance
  requirement — the first slice targets that unknown, even shipping no feature.

Say which of the two it buys. A plan that does not know tends to build the easy part first.

On an empty repository the first slice is the one that brings the repository into existence, and it spans
every layer at once. Give it its own phase: the lead owns the workspace layout, each package the role that
owns its layer.

## Phases follow dependency

A phase exists because something must be true before the next thing can start — not because the work is
large, and not because a calendar has weeks in it. For each phase state:

- **What it delivers** — an outcome, checkable against its own criteria.
- **Which roles it requires** — one Squad role for a single-domain phase, or every Squad role genuinely
  needed for a cross-domain result. With multiple roles, name each role's distinct responsibility and the
  contract or handoff between them. A required capability with no role in the roster is a coverage gap to
  report, not one to assign to whoever is nearest.
- **What must be true first** — the phase it depends on, the decision it assumes, the access it needs.
- **What would make it wrong** — the unknown whose resolution would reorder the plan.

## Ordering rules

- A contract other roles code against comes before the roles consuming it: backend publishes the shape,
  frontend and mobile build against it.
- Material UI/UX work is preceded by a designer contract. A real dependency, not a courtesy.
- Infrastructure comes before the first thing that must run on it, and not one phase earlier.
- Multiple roles may share a phase when its result requires their coordinated work. Their responsibilities
  remain separate; the lead later turns them into non-overlapping file ownership and execution slices.
- Two phases touching the same files are one phase, or they are serialized. Parallelism that ownership
  cannot isolate is not parallelism.
- Do not phase a thing that is one slice. A single-phase plan is a valid and common answer.

## Where the plan stops

A phase names its required Squad role or roles, each role's responsibility, and its precondition. It does
not select an agent instance or name the branch, files or execution mode. Splitting work into owned file
sets is the lead's job, done against the live repository at the moment it runs, and a plan that pre-empts it
is stale before it is read.
