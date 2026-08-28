# Runtime pairing and safe-delivery fallbacks

Read before selecting tools for a phase, and whenever AgentKit, provider specialists/CLIs, cloud
credentials, deployment access, observability, QA or Review capabilities are in question.

## AgentKit pairing

Detect AgentKit once per task by inspecting the live skill catalog for `ak:*` entries or an available
`ak` CLI.

- **Installed** — read this skill's task-relevant references first, then pair the phase-matched `ak:*`
  skill with this role's contract so it accelerates the phase. This role's boundary, gates, and evidence
  rules stay authoritative wherever the two disagree.
- **Absent** — run the native fallback for the same phase at the same standard.

Never auto-install AgentKit or any skill, and never report a skill as run when it does not exist.

## Rules

- Use only live capabilities; invoke nothing that is not installed.
- Never auto-install a CLI, skill, plugin, MCP server, operator, chart, provider or package.
- Use current official provider docs for mutable syntax and behavior.
- Missing apply/deploy access is not permission to work around controls. Complete static/plan work and
  state the live-verification gap.
- Never fabricate provider state, CI status, rollout health, or rollback proof.

## Capability mapping

| Phase | Pair when installed | Native fallback |
|---|---|---|
| Scout/plan | `ak:scout`, `ak:plan`, `ak:scenario` | Inspect repository/provider config and enumerate failures directly |
| Containers/IaC | DevOps/provider skills | Use repository-native CLI if present and current official docs |
| Security | Security scanners | Manual least-privilege/secrets/supply-chain pass plus existing scanners |
| Validate | Test/review skills | Run format/lint/schema/build/image/IaC checks directly |
| Deploy | Deploy/ship skill | Use approved provider/repository command only when authorization exists |
| Debug | Debug/fix skill | Trace pipeline/event/log path and reproduce at the safest scope |
| Review gates | `squad-qa`, `squad-code-review` | Run separate smoke/rollback QA and infra diff review; disclose independence |

## Access unavailable

Separate what can still be proven:

1. Static syntax/schema and repository consistency.
2. Local build or container execution.
3. IaC/provider dry-run or plan.
4. Deployed smoke/health verification.

Stop at the highest authorized level. Report the exact command/artifact the authorized operator should run
next and the expected health/rollback criteria.
