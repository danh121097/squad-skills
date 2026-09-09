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
its `plan.md`. Never write into an ignored path merely to avoid the location question, and never add the
bundle to a commit unless the user asked for that too.

## Required structure

Every written plan uses this shape, including a one-phase plan:

```text
<DDMMYYYY-HHmm>-<kebab-case-topic>/
├── plan.md
├── phases/
│   ├── phase-01-<kebab-case-title>.md
│   └── phase-02-<kebab-case-title>.md
├── artifacts/
│   ├── product-contract.md
│   ├── acceptance-traceability.md
│   ├── test-strategy.md
│   ├── qa-report.md
│   ├── code-review.md
│   └── handoff-to-phase-02.md
├── adr/
│   └── adr-001-<kebab-case-title>.md
└── references/
    ├── domain-model.md
    ├── feature-scope.md
    ├── decisions-and-risks.md
    ├── technical-stack.md
    └── ui-ux-direction.md
```

A written plan is one directory whose root holds only `plan.md` and the standard `phases`, `artifacts`,
`adr` and `references` directories, with every phase file in `phases/` named
`phase-XX-kebab-case-title.md` and every link relative.

Four rules give that tree its meaning, and each exists because a flat directory loses one of them:

1. **`plan.md` is the entrypoint and the only index.** Nothing else claims to order the plan, because a
   second index is how two orders start disagreeing. No other file sits at the root.
2. **Only `phases/` expresses implementation order.** A file's number is its position in the run, so only
   phase files carry the `phase-XX-` prefix. Nothing outside `phases/` may open with it.
3. **An artifact records its owning phase, owner, revision and status in frontmatter, never in a
   `phase-XX-` filename prefix, which `phases/` alone reserves.** A handoff to the next phase is its own
   artifact — `artifacts/handoff-to-phase-02.md`, not a `phase-02-` file that would read as a fourth phase.
4. **A shared input lives in `references/`.** Background every phase reads and none of them owns is the
   thing a flat root mixes with ordered work first.

`adr/` holds one decision per file as `adr-NNN-<kebab-case-title>.md`. The number is that decision's
identity — what a phase and a later ADR cite — and states nothing about when it is implemented. ADR numbers
may have gaps; phase numbers may not.

Create a directory when it has a file. An empty `adr/` says a plan made no decisions worth recording, which
is usually false and never checkable.

## What each file states

`plan.md` is the navigation and authority index. Its frontmatter states `title`, `description`,
`status: proposed`, `created` and `revision`. Its body states outcome, given constraints, deferred and
refused non-goals, plan-wide acceptance criteria, assumptions, unknowns, open decisions, and an ordered
phase table. Each phase title in the table is a relative link into `phases/` and states required Squad role
or roles, result and dependencies. Do not duplicate the full phase body in the index.

One `phases/phase-XX-<kebab-case-title>.md` exists for every phase, numbered continuously from `01` in
dependency order. Its frontmatter states `phase`, `title`, `status`, `revision`, `depends_on` as phase
numbers that all run earlier, `roles` always as a list such as `[squad-backend]` or
`[squad-backend, squad-devops]`, and `inputs` as the relative paths this phase reads. Each phase file states
context and current state; objective and concrete deliverables; required role or roles and their distinct
scope boundaries; prerequisites and blocking decisions; ordered work steps; phase-specific acceptance
criteria and expected verification evidence; applicable risks and recovery; and the handoff condition. Every
path in `inputs` — the references it reads, the ADRs that bind it, the artifacts it consumes — is linked
from the body where it is used, so a reader meets the input at the point it matters rather than in a list.

Each `artifacts/<kebab-case-title>.md` states `phase` (the owning phase number, or `plan` for a plan-wide
artifact), `owner`, `revision` and `status` of `draft`, `final` or `superseded`. An artifact recording a
quality gate adds `gate` (`qa` or `code-review`), `verdict` from that gate's own vocabulary, and `reviewed`:
every input it graded, each with the exact revision it graded. The verdict is a record for a reader, not the
mechanism that opens the next stage; the gate itself is the prose handoff it reports.

Each `adr/adr-NNN-<kebab-case-title>.md` states `adr`, `title`, `status` and `date`, then context, decision
and consequences. Each `references/<kebab-case-title>.md` states `title` and holds the shared background its
name promises.

When `roles` has multiple entries, add a role-responsibility table. Give every role a concrete deliverable,
the contract it produces or consumes, and the point where it hands off. Keep responsibilities
non-overlapping; the lead assigns live files and agent instances later.

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
- No verdict, no evidence, no sign-off from this role. Nothing has run yet, and `artifacts/` is empty of
  gate records until something does.
- No invented detail. A small plan may have one concise phase file, but it still makes that phase's scope,
  steps, checks and handoff explicit. Padding it with plausible specifics is how a reader ends up trusting a
  number nobody measured.

## What happens to it after work starts

The bundle outlives framing. Phases move through `proposed`, `in-progress`, `blocked` and `accepted`, and
`artifacts/` gains what each phase produced. Two rules keep that from turning the bundle into fiction.

**A change to structure or contract after a gate marks the recorded verdict superseded and requires QA then
Code Review again.** A verdict names the revisions it graded; raise a graded file's `revision` and the
verdict is now about a document that no longer exists, which reads exactly like a verdict about the current
one. Set the old record's `status: superseded` rather than editing its verdict, then rerun the gates in
pipeline order. A Code Review `APPROVE` names the QA `PASS` it followed under `reviewed`, because that is
the only thing in a file that shows the review ran second.

**A phase is not `accepted` while anything it left open is still open.** Not a required checkbox, and not an
approval only the user can give. Declare each one in the phase's `approvals` list and leave it `pending`
until the answer arrives. Put it to the user as named options with their consequences and a default they can
accept, from the session that can ask — never answered by the role that raised it, and never closed by a
status field asserting it is closed.

## Keeping it honest

Mark the index and every phase as proposals until the user accepts them. After revision, verify that every
phase row links to exactly one existing phase file, the numbering and dependencies agree, and plan-wide
criteria trace to at least one phase's expected evidence. Never restate an assumption as a decision once it
has been written down — a labeled assumption that loses its label on the second draft is the most common
way a plan starts lying.
