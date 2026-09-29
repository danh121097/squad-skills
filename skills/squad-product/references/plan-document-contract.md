# The written plan

Read before writing a plan to files.

## Write one only when asked

A plan on disk is output the user requested, never a record left behind for a later stage — squad handoffs
are contracts stated in prose. Write it when the user asked for a written plan or passed `--plan-file` /
`--plan-dir`; otherwise state the same plan in the conversation. When unsure, ask in one line.

## Where it goes

Where the user says. Failing that, the repository's existing planning directory; inside it create
`<YYMMDD-HHmm>-<kebab-case-topic>/` from the session's local time. If no planning location is established,
ask rather than inventing one. A `--plan-file` path is the plan.md itself, and its directory holds any
`phases/`. Never write into an ignored path to avoid the question, and never commit the plan unless the user
asked for that too.

## Shape

A written plan is one plan.md; a plan too long to read as one file keeps plan.md as the only index and moves
each phase to phases/phase-XX-kebab-case-title.md, with every link relative. In a single file each phase is
a `## Phase N — <title>` section. Phases are numbered continuously from `01`, and no other file is created
unless the user asks for it.

`plan.md` frontmatter: `title`, `status: proposed` and `created`. Body: outcome, given constraints,
deferred and refused non-goals under separate headings, plan-wide acceptance criteria, one list of labeled
assumptions, unknowns, open decisions each with its owner, then the phases — as sections, or as a table
linking each phase file with its roles and dependencies. Given stays marked as given.

Each phase states its objective and deliverables, its roles and their distinct scopes, ordered work steps,
and acceptance criteria with expected evidence; context, prerequisites, risks and handoff are added when they
have content. It names the phases it depends on. A multi-role phase gives each role a deliverable and its
handoff point; the lead assigns live files and agents later.

## What it does not contain

No stack, architecture or data-model decision (list it as open with its owner), file assignment, branch,
execution mode, agent instance, gate verdict or review record. No invented files, commands or measurements:
detail means completeness, not guesses.

Mark every phase a proposal until the user accepts it, and never restate a labeled assumption as a decision.
