# Worker sessions

Read before selecting a mode or dispatching. Confirm creation, result read-back and follow-ups from live
tools. Apply the entrypoint's main/coordinator preference even for a small repair; otherwise prefer the
lowest-overhead suitable mode. Explicit single-session or no-delegation instructions win.

Main owns diagnosis, routing, decisions, review, gates and integration; workers implement. Only small
integration edits stay in a designated main. If squads-team leads, return diagnosis and ownership there;
it dispatches, preserving one lead.

Dispatch the role skill, main ID, objective, proven cause, acceptance, ownership, dependencies, tier, checks
and base revision; include pending changes as a patch for fresh checkouts and the exact diff for gates. Start workers in the lead's project/repository, titled `[squad] <role>: <slice>`; use a
worktree only when isolation pays. Each returns changes, commands/results and gaps in prose. Main reads the diff and report, integrates by merge or reviewed copy, and reuses the owner for returns.

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

Start authorized ready work where supported. When a valid user-started launcher is available, both build
slices and gates stay pending until launched, including on a woken turn. Name and reuse that launcher;
it must support result read-back and follow-ups. Fall back to subagents, then single-session execution
only when neither direct creation nor a valid launcher provides these capabilities. Report the missing
capability and reduced independence. Read and retain each result before closing its chat. Lead-managed
worker chats do not transfer external gate ownership; the entrypoint's handoff contract still governs
user-assigned external gates.
