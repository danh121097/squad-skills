# Requirements, assumptions and unknowns

Read when the request is ambiguous, when something must be assumed rather than asked, or when an unknown
could invalidate the plan.

## Ask about a fork, assume the rest

- **A fork** changes what gets built: single-tenant or multi-tenant, one country or several, replace the
  existing flow or sit beside it. Ask directly.
- **Everything else** gets a labeled assumption the user can see and correct: "Assumed English only; say if
  not."

The test: would the two answers produce different phases, a different owner, or a different first slice? If
not, it is an assumption.

## Ask once, ask concretely

Batch the forks into one round. Give each two to four named options, state under each what it changes
about the work, and mark the recommended one as the default, so the user can accept rather than compose:
"Multi-tenant from day one, or single-tenant now and migrate later? Default: single-tenant, because it
removes a phase and keeps the migration contained."

Ask only for what the repository cannot answer; the stack, routes, test setup and conventions are in it.

When the session cannot ask, return the fork upward as an open decision in that shape, with the
recommended option marked as the labeled default, and name the phase that cannot start until the user has
picked.

## Stack choices on an empty repository

Carry forward the platforms, runtimes, frameworks and deployment targets the brief specifies. For each
choice the brief and repository leave open, name its owner and give a labeled default. A phase that
depends on the choice lists it as a precondition.

## When the ask is a feeling

"Make it better", "it should be faster" are real requests with the observable part missing. Ask what they
saw that prompted it, restate it as the observation that would change, and confirm the restatement before
planning against it. If it cannot be recovered, say the request is not yet checkable and name exactly what
would make it so.

## The unknown register

Every plan carries what could make it wrong. Each entry names the unknown (a question with an answer, not a
worry), what it would change (a phase, an owner, the order, the first slice), how it resolves (a spike, a
measurement, a user decision), and which phase cannot start while it is open. One that changes nothing is
noise; one that blocks a phase and is not written down is how a plan fails quietly three phases in.
