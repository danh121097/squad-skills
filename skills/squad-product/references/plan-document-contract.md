# The plan document

Read before writing a plan to a file.

## Write one only when asked

A plan file is output the user requested. It is never a record this role leaves behind so a later stage can
find it, and never a handoff artifact between roles — squad handoffs are contracts stated in prose, and a
file records a claim rather than the work behind it.

So:

- The user asked for a plan file, or passed `--plan-file` — write it.
- Otherwise — state the plan in the conversation. It is the same content and it is complete there.

When unsure, ask in one line. Do not write the file speculatively and mention it afterwards.

## Where it goes

Where the user says. Failing that, the location the repository already uses for planning documents, if it
has an obvious one. Failing that, ask rather than inventing a directory in someone's project.

Never write into a path the repository ignores in order to avoid the question, and never add the file to a
commit unless the user asked for that too.

## What it contains

Only what framing produced — nothing discovered while writing it — in the order a reader needs: outcome,
constraints, non-goals, acceptance criteria, phases, assumptions, unknowns, open decisions. The handoff
contract says what each carries; writing it down adds three obligations speaking it does not.

- **Given stays marked as given.** A constraint the user settled reads as a choice this role made, once it
  is in a document with no one present to say otherwise.
- **Deferred and refused get separate headings.** Collapsed into one non-goals list, a refusal reads as a
  promise for later.
- **Assumptions stay in one list.** Scattered through prose they cannot be corrected in a single pass,
  which is the only reason to label them.

## What it does not contain

- No stack, framework, architecture or data-model decision. If the plan depends on one, it is listed under
  open decisions with its owner named, not settled in passing.
- No file assignments, branch names, execution mode or agent roster. The lead splits ownership against the
  live repository; a plan that pre-empts it is stale on arrival.
- No verdict, no evidence, no sign-off. Nothing has run yet.
- No invented detail. A plan is allowed to be short. Padding it with plausible specifics is how a reader
  ends up trusting a number nobody measured.

## Keeping it honest

Mark the document as a proposal until the user accepts it, and never restate an assumption as a decision
once it has been written down — a labeled assumption that loses its label on the second draft is the most
common way a plan starts lying.
