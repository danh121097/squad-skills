# The plan bundle

Read before writing a plan to files.

## Write one only when asked

A plan on disk is output the user requested, never a record left behind for a later stage — squad handoffs
are contracts stated in prose. Write it when the user asked for a written plan or passed `--plan-file` /
`--plan-dir`; otherwise state the same plan in the conversation. When unsure, ask in one line.

## Where it goes

Where the user says. Failing that, the repository's existing planning directory; inside it create
`<YYMMDD-HHmm>-<kebab-case-topic>/` from the session's local time. If no planning location is established,
ask rather than inventing one. Never write into an ignored path to avoid the question, and never commit the
plan unless the user asked for that too.

## Shape

The plan is as small as the work: a written plan of one or two phases is a single `plan.md` declaring
`layout: single`; a larger one is one directory whose root holds only `plan.md` and the standard `phases`,
`artifacts`, `adr` and `references` directories, with every phase file in `phases/` named
`phase-XX-kebab-case-title.md` and every link relative. In a single file each phase is a
`## Phase N — <title>` section.

`plan.md` is the entrypoint and the only index. Only `phases/` expresses order, so only phase files carry
the `phase-XX-` prefix, numbered continuously from `01`. `artifacts/`, `adr/` and `references/` stay absent
until they hold something that already exists:

- an **ADR** records an accepted decision as `adr/adr-NNN-<kebab-case-title>.md`; an open decision stays
  in `plan.md` with its owner named. ADR numbers may have gaps; phase numbers may not.
- an **artifact** records something that ran, so `qa-report.md` exists once QA issued a verdict. An
  artifact records its owning phase, owner, revision and status in frontmatter, never in a phase-XX-
  filename prefix, which phases/ alone reserves; a handoff is `artifacts/handoff-to-phase-02.md`.
- a **reference** holds background a phase names under `inputs`.

## What each file states

`plan.md` frontmatter: `title`, `description`, `status: proposed`, `created`, `revision`, and `layout:
single` when it is the whole plan. Body: outcome, given constraints, deferred and refused non-goals under
separate headings, plan-wide acceptance criteria, one list of labeled assumptions, unknowns, open decisions,
then the phases — as sections, or as a table linking each `phases/` file with its roles, result and
dependencies. Given stays marked as given.

A phase file's frontmatter: `phase`, `title`, `status`, `revision`, `depends_on` (earlier phase numbers),
`roles` as a list such as `[squad-backend]`, and `inputs` as relative paths it reads, each linked from the
body where it is used. Each phase file states its objective and deliverables, its roles and their distinct
scopes, ordered work steps, and acceptance criteria with expected evidence; context, prerequisites, risks and
handoff are added when they have content. A multi-role phase adds a table giving each role a deliverable
and its handoff point; the lead assigns live files and agents later.

An artifact states `phase` (a number or `plan`), `owner`, `revision` and `status` of `draft`, `final` or
`superseded`. A gate record adds `gate` (`qa` or `code-review`), `verdict` in that gate's vocabulary, and
`reviewed`: every input it graded with the exact revision. An ADR states `adr`, `title`, `status` and `date`,
then context, decision and consequences. A reference states `title`.

## What it does not contain

No stack, architecture or data-model decision — list it as open with its owner. No file assignments,
branches, execution mode or agent instances. No verdict or sign-off from this role. No invented files,
commands or measurements: detail means completeness, not guesses.

## After work starts

Phases move through `proposed`, `in-progress`, `blocked` and `accepted`.

- A change to structure or contract after a gate marks the recorded verdict superseded and requires QA then
  Code Review again. Set the old record's `status: superseded` rather than editing its verdict. A Code
  Review `APPROVE` names the QA `PASS` it followed under `reviewed`.
- A phase is not `accepted` while a required checkbox or a user approval in its `approvals` list is still
  open. Put the approval to the user as named options with their consequences, from the session that can
  ask.

Mark every phase a proposal until the user accepts it, and never restate a labeled assumption as a decision.
