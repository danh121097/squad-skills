# The plan bundle

Read before writing a plan to files.

## Write one only when asked

A plan bundle is output the user requested. It is never a record this role leaves behind so a later stage
can find it, and never a handoff artifact between roles — squad handoffs are contracts stated in prose, and
a file records a claim rather than the work behind it.

So:

- The user asked for a written plan, or passed `--plan-file` / `--plan-dir` — write the bundle.
- Otherwise — state the plan in the conversation. It is the same content and it is complete there.

When unsure, ask in one line. Do not write the file speculatively and mention it afterwards.

## Where it goes

Where the user says. Failing that, use the repository's existing planning directory when it has an obvious
one. Inside it create `<DDMMYYYY-HHmm>-<kebab-case-topic>/`; use the session's local time and a topic that
identifies the outcome. If no planning location is established, ask rather than inventing one.

`--plan-dir` names the bundle directory. For compatibility, `--plan-file` may name either that directory or
its `plan.md`; phase files live beside the index. Never write into an ignored path merely to avoid the
location question, and never add the bundle to a commit unless the user asked for that too.

## Required structure

Every written plan uses this shape, including a one-phase plan:

```text
<DDMMYYYY-HHmm>-<kebab-case-topic>/
├── plan.md
├── phase-01-<kebab-case-title>.md
├── phase-02-<kebab-case-title>.md
└── ...
```

`plan.md` is the navigation and authority index. Its YAML frontmatter states title, short description,
`status: proposed`, and created date. Its body states outcome, given constraints, deferred and refused
non-goals, plan-wide acceptance criteria, assumptions, unknowns, open decisions, and an ordered phase
table. Each phase title in the table is a relative link to its file and states required Squad role or roles,
result and dependencies. Do not duplicate the full phase body in the index.

One `phase-XX-<kebab-case-title>.md` exists for every phase, numbered from `01` in dependency order. Its YAML
frontmatter states phase number, title, `status: proposed`, dependencies, and `roles`, always as a list such
as `[squad-backend]` or `[squad-backend, squad-devops]`. Each phase file states context and current state;
objective and concrete deliverables; required role or roles and their distinct scope boundaries;
prerequisites and blocking decisions; ordered work steps; phase-specific acceptance criteria and expected
verification evidence; applicable risks and recovery; and the handoff condition.

When `roles` has multiple entries, add a role-responsibility table. Give every role a concrete deliverable,
the contract it produces or consumes, and the point where it hands off. Keep responsibilities non-overlapping;
the lead assigns live files and agent instances later.

Detail means completeness, not invention. Leave implementation choices owned by a build role explicit as
open decisions; do not fill a section with guessed files, commands, architecture or measurements.

## What it contains

Only what framing produced — nothing discovered while writing it — in the order a reader needs. The
handoff contract says what each section carries; writing it down adds three obligations speaking it does
not.

- **Given stays marked as given.** A constraint the user settled reads as a choice this role made, once it
  is in a document with no one present to say otherwise.
- **Deferred and refused get separate headings.** Collapsed into one non-goals list, a refusal reads as a
  promise for later.
- **Assumptions stay in one list.** Scattered through prose they cannot be corrected in a single pass,
  which is the only reason to label them.

## What it does not contain

- No stack, framework, architecture or data-model decision. If the plan depends on one, it is listed under
  open decisions with its owner named, not settled in passing.
- No file assignments, branch names, execution mode or named agent instances. The phase declares required
  role capabilities; the lead splits live ownership and selects instances later.
- No verdict, no evidence, no sign-off. Nothing has run yet.
- No invented detail. A small plan may have one concise phase file, but it still makes that phase's scope,
  steps, checks and handoff explicit. Padding it with plausible specifics is how a reader ends up trusting a
  number nobody measured.

## Keeping it honest

Mark the index and every phase as proposals until the user accepts them. After revision, verify that every
phase row links to exactly one existing phase file, the numbering and dependencies agree, and plan-wide
criteria trace to at least one phase's expected evidence. Never restate an assumption as a decision once it
has been written down — a labeled assumption that loses its label on the second draft is the most common
way a plan starts lying.
