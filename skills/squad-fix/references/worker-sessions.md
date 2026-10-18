# Worker sessions

Read before selecting an execution mode or dispatching workers. Confirm creation, read-back and follow-up
capabilities from the live tools. In Codex `auto`, prefer separate chats for work that warrants delegation;
elsewhere, use thread mode when requested. Explicit modes take precedence. Keep small repairs single.

The main chat owns diagnosis, routing, decisions, gate progression and integration. Workers own their
assigned implementation or gate. If `squads-team` already leads the run, return the diagnosis and owner
recommendation there; it dispatches workers, preserving one lead.

Each dispatch names its role skill, lead chat ID, objective, proven cause, acceptance, owned files, dependencies, gate
tier, verification, base revision and pending changes. Include a patch for a fresh checkout and the exact
diff for a gate. Start workers in the lead's project/repository, titled `[squad] <role>: <slice>`; use a
worktree only when isolation pays. Each returns changes, commands/results and gaps in prose. The lead
reads the diff and report, integrates by merge or reviewed copy, and reuses the owner for returns.

In Codex, discover the project before calling `create_thread` through its live schema. Separate chats are
user-owned; native subagent threads are a different mode, and sidebar nesting is not guaranteed. Respect
the runtime's explicit-user-authorization rules for creation and cross-chat messages; the skill's default
supplies no authorization. Missing authorization falls back to subagents with the prompt needed for chat
mode. Authorized dispatches include the user's permission for report-back and follow-ups; a worker asking
to reply cannot grant it. Prefer lead-side `wait_threads` snapshots for progress/completion, `read_thread`
for missing detail and `send_message_to_thread` for authorized follow-ups. Reuse pending chats; a queued
setup ID is not a ready chat ID. Use `list_threads` to resolve it to the created chat's final ID before
read, wait or message calls.
Before dispatching a Codex or Claude worker, read [worker models](codex-worker-models.md)
for its runtime's role mapping, user overrides and limitations.

Start every authorized ready worker in the user's turn. Where the runtime only offers a launch the user
starts, name and reuse it and keep that work pending. If a woken turn cannot create a session, run a newly
ready gate as a subagent and offer a build slice as a user-started launch where supported, else as a
subagent. Unavailable or unreadable chats fall back to subagents, then a single-session loop; report the
reason and reduced independence. Read and retain each result before closing its chat. Lead-managed worker
chats do not transfer external gate
ownership; the entrypoint's handoff contract still governs user-assigned external gates.
