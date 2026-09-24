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
large, and not because a calendar has weeks in it. Each phase states what it delivers, checkable against its
own criteria; the Squad roles it requires, with each role's distinct responsibility and the contract or
handoff between them; what must be true first; and the unknown whose resolution would reorder the plan. The
phase never names agents, branches, files or execution mode — the lead splits ownership against the live
repository when it runs.

## Ordering rules

- A contract other roles code against comes before the roles consuming it: backend publishes the shape,
  frontend and mobile build against it.
- A design decision the user's material and the existing system leave open is preceded by a designer
  contract. A real dependency, not a courtesy.
- Infrastructure comes before the first thing that must run on it, and not one phase earlier.
- Two phases touching the same files are one phase, or they are serialized. Parallelism that ownership
  cannot isolate is not parallelism.
- Do not phase a thing that is one slice. A single-phase plan is a valid and common answer.
- Phases sharing no files and no unfinished dependency are independent: the user may run each in its own
  session or worktree, on its own gates.
