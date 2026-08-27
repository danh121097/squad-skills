# Runtime capability fallbacks

Read when AgentKit, role skills, multi-agent execution, browser/device/test tooling, Git history, CI or
provider access is unavailable.

## Rules

- Inspect the live catalog and repository; invoke only capabilities that actually exist.
- AgentKit, named debug/fix/test skills, MCPs, provider CLIs and multi-agent runtimes are optional.
- Never auto-install a tool or claim it ran. Preserve the diagnosis, ownership, verification and gate
  outcomes with native file search, commands, logs, tests and official docs.
- Missing an alias is not a blocker. Missing evidence required to prove cause or completion is.
- Do not bypass access, privacy, branch protection, deployment, database or production safety controls.

## Capability mapping

| Need | Preferred capability when available | Native fallback |
|---|---|---|
| Scout | Repository search/navigation | Search project guidance, files, callers, contracts and tests directly |
| Reproduce/debug | Debugger, browser/device, logs/traces | Run repository commands and inspect safe artifacts; state target gaps |
| Root-cause reasoning | Structured diagnosis capability | Write hypotheses, predicted observations and falsifying checks directly |
| Domain implementation | Matching squad role | Apply that role's inline boundary plus repository patterns and primary docs |
| Test | Test runner/QA capability | Use existing commands/manual path; never invent a passing environment |
| Review | Independent reviewer capability | Run a fresh logical review and disclose reduced independence |
| Coordination | Peer team/subagents | Serialize role passes in one controller with explicit ownership |

## Named role unavailable

Route by proven cause and use the corresponding inline boundary:

- Frontend: web UI/client logic/API consumption only.
- Backend: shared server API/auth/data/business contract only.
- Mobile: app UI/client/offline/lifecycle/native integration only.
- DevOps: pipeline/container/IaC/cloud/deployment/observability only.
- QA: tests/repro/evidence, never production implementation.
- Code Review: findings/verdict, never fixes.
- Designer: material UX/UI contract, never production implementation.

Consult the repository and current primary documentation for actual stack depth; these reminders are not a
replacement for framework/provider knowledge.

## Environment-specific degradation

- **No browser/device/service:** use static/unit evidence only when sufficient; otherwise name the exact
  missing target and do not close QA.
- **No Git history:** diagnose current behavior from code/contracts/tests; state that “why now” history is
  unavailable rather than inventing an introducer.
- **No CI/provider access:** validate configuration locally/static where possible; do not claim pipeline or
  deployed state. Request the smallest safe log/status/artifact when required.
- **No multi-agent runtime:** run Build → QA → Review as distinct passes. State that gates are logical, not
  independent-agent judgments.

Track task-owned processes, ports, watchers, browser/device sessions, tunnels, worktrees and temporary
resources. Reuse safe existing project processes; stop only what this run created or clearly owns.
