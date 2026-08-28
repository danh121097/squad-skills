# Runtime capability pairing and fallbacks

Read before selecting tools for a phase, and whenever AgentKit or a preferred backend/data/security
capability is in question.

## AgentKit pairing

Detect AgentKit once per task by inspecting the live skill catalog for `ak:*` entries or an available
`ak` CLI.

- **Installed** — read this skill's task-relevant references first, then pair the phase-matched `ak:*`
  skill with this role's contract so it accelerates the phase. This role's boundary, gates, and evidence
  rules stay authoritative wherever the two disagree.
- **Absent** — run the native fallback for the same phase at the same standard.

Never auto-install AgentKit or any skill, and never report a skill as run when it does not exist.

## Rules

- Inspect live tools and skills; invoke only what exists.
- Preserve the same contract, data-safety, security, and verification outcomes with native tools.
- Never auto-install a skill, package, plugin, MCP server, database tool, or provider CLI.
- Consult current official docs for exact framework/provider versions; do not guess unstable APIs.
- Report missing evidence only when it limits the outcome, not because an optional alias is absent.

## Capability mapping

| Phase | Pair when installed | Native fallback |
|---|---|---|
| Frame/scout | `ak:brainstorm`, `ak:scout` | Search repository modules, configs, schemas, consumers, and tests |
| Plan/scenarios | `ak:plan`, `ak:scenario` | Write a proportional plan and enumerate failure/edge cases directly |
| API/server | `ak:backend-development` | Follow the repository framework and current official docs |
| Data | `ak:databases`, MongoDB specialists | Inspect schema/query plans; use native DB/ORM tooling and explain evidence |
| Auth | Auth specialist | Follow existing auth/session architecture and provider official docs |
| Security | Security skills/scanners | Manual threat pass plus repository secret/dependency scanners when present |
| Debug | `ak:debug`, `ak:fix` | Reproduce from request/log/test path, isolate cause, and fix directly |
| Verify | `ak:test` | Run repository unit/integration/contract/migration/type/build commands |
| Review gates | `squad-qa`, `squad-code-review` | Run separate native QA and diff-review passes; report reduced independence |

## Data tooling unavailable

Do not mutate data to compensate for missing inspection or recovery tools. For shared/persistent targets,
produce the migration/rollback plan and request the smallest safe backup/restore access or artifact needed.
For an isolated disposable local/test target, prove its recreation/reset and deterministic seed/fixture
path. A backup that cannot be restored or whose target/scope is unknown does not satisfy the persistent-data
gate. Never claim a migration or query plan was verified when it was only reasoned about statically.
