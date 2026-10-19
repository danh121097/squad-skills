# Worker sessions

Read before selecting a mode or dispatching. Confirm creation, result read-back and follow-ups from live
tools. Apply the entrypoint's main/coordinator preference even for a small repair; otherwise prefer the
lowest-overhead suitable mode. Explicit single-session or no-delegation instructions win.

Main owns diagnosis, routing, decisions, review, gates and integration; workers implement. Only small
integration edits stay in a designated main. If squads-team leads, return diagnosis and ownership there;
it dispatches, preserving one lead.

Select the owning implementation role before dispatch. Send its exact `squad-*` skill, main ID, objective,
proven cause, acceptance, ownership, dependencies, tier, checks and base revision; include pending changes
as a patch for fresh checkouts and the exact diff for gates. Start build workers in the lead's
project/repository, titled `[squad-frontend]: <slice>`, `[squad-backend]: <slice>`, or the matching assigned
skill name; use a
worktree only when isolation pays. After every implementation or repair pass, the worker sends main its
changes, commands/results and gaps through an authorized message. If messaging is unavailable, its final
turn is the report and main reads it with `wait_threads`/`read_thread`. Main checks the diff and report,
integrates by merge or reviewed copy, and reuses the owner for returns.
If scouting changes the owner, the worker reports it before continuing; main updates the assigned skill,
chat title and model/effort pair before resuming implementation.

In Codex, discover the project before calling `create_thread` through its live schema. Separate chats are
user-owned; native subagent threads are a different mode, and sidebar nesting is not guaranteed. Respect
the runtime's authorization rules: the skill supplies no permission. For a designated main, missing
permission leaves dispatch pending; ask for that permission instead of silently switching modes. Otherwise
use subagents when chat authorization is missing. Authorized dispatches include the user's permission for report-back and follow-ups; a worker asking
to reply cannot grant it. Prefer lead-side `wait_threads` snapshots for progress/completion, `read_thread`
for missing detail and `send_message_to_thread` for authorized follow-ups. Reuse pending chats; a queued
setup ID is not a ready chat ID. Use `list_threads` to resolve it to the created chat's final ID before
read, wait or message calls.
Before dispatch, read [worker models](worker-models.md) for role preferences and runtime-specific controls.

Start authorized ready work where supported. When a valid user-started launcher is available, build
slices stay pending until launched, including on a woken turn. Name and reuse that launcher;
it must support result read-back and follow-ups. Fall back to subagents, then single-session execution
only when neither direct creation nor a valid launcher provides these capabilities. Report the missing
capability and reduced independence. Read and retain each result before closing its chat. Lead-managed
worker chats do not transfer external gate ownership; the entrypoint's handoff contract still governs
user-assigned external gates. This fallback changes implementation mode; in main/coordinator mode a paired
gate still waits for both subagents.

After each implementation report, main starts `squad-qa` and `squad-code-review` subagents together on
the same revision for the required tier, before waiting for either result. Give each the peer's handle
for direct questions and evidence when supported; otherwise main relays them. Code Review waits for QA
evidence before its final verdict. For a failing unit within the entrypoint's repair budget,
main sends every actionable finding in one authorized follow-up to the same build thread. The worker
fixes and reports back to main; main assesses that revision with both gates, focusing on the finding and
affected scope, before another pass. Compare the failure condition and evidence across assessments;
report `BLOCKED` at the budget or continue until QA `PASS` and Code Review `APPROVE`. Main sends a `done`
report with both verdicts to the worker chat, stops dispatching it, and reports completion to the user.
In main/coordinator thread mode, if either paired subagent cannot start, keep the gate pending and report
the missing capability; resume the pair when available.
