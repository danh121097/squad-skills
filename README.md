# Squad Skills

[![skills.sh](https://skills.sh/b/danh121097/squad-skills)](https://skills.sh/danh121097/squad-skills)

Supports **OpenCode**, **Claude Code**, **Codex**, **Cursor**, and
[**73 more**](https://www.npmjs.com/package/skills#supported-agents).

Role-specialized engineering skills for AI coding agents. The collection covers
product framing, design, frontend, backend, mobile, DevOps, QA, code review, bug
fixing, and coordinated squad delivery while preserving clear ownership
boundaries.

The repository follows the open Agent Skills format and keeps each installable
skill under `skills/<skill-name>/SKILL.md`.

## Install

Every path installs the same set of skills. They differ in how the matching
subagents arrive.

| Path               | Skills | Subagents        | Tools                               |
| ------------------ | ------ | ---------------- | ----------------------------------- |
| Claude Code plugin | ✅     | ✅ same step     | Claude Code                         |
| Codex plugin       | ✅     | one more command | Codex                               |
| npm CLI            | ✅     | ✅ same step     | Claude Code, Codex                  |
| `npx skills add`   | ✅     | one more command | every agent the Skills CLI supports |

### As a Claude Code plugin

The plugin ships the skills and the subagents together, so one command installs
both:

```sh
/plugin marketplace add danh121097/squad-skills
/plugin install squad-skills@squad-skills
```

Each role then exists twice over: as a skill you invoke, and as a subagent you
spawn by name.

### As a Codex plugin

Codex installs the skill catalog directly from the repository plugin:

```sh
codex plugin marketplace add danh121097/squad-skills
codex plugin add squad-skills@squad-skills
```

The Codex plugin manifest lives at `.codex-plugin/plugin.json` and exposes
`skills/`. Codex agent definitions remain a separate runtime surface, so add
them after plugin installation when named subagents are wanted:

```sh
npx squad-skills agents --global --agent codex
```

### From the npm package (recommended)

Run without a permanent CLI installation:

```sh
npx squad-skills list
npx squad-skills add --skill squads-team
npx squad-skills add --skill squad-frontend --global --agent codex
```

Or install the command globally first:

```sh
npm install --global squad-skills
squad-skills add --skill squads-team
```

The npm command delegates installation to the official `skills` package and
defaults to copied files, so installed skills do not depend on an ephemeral
`npx` package-cache path.

### Each role as a subagent too

`squad-skills add` also writes a subagent definition for every skill it
installs, so a role can be spawned by name instead of only loaded as a skill.
Claude Code reads `.claude/agents/<name>.md`; Codex reads
`.codex/agents/<name>.toml` and loads it only once `config.toml` names the file,
which the CLI registers after backing that config up. Each definition points at
the `SKILL.md` just installed rather than copying it, so the skill stays the one
source of truth.

`squads-team` and `squad-fix` dispatch other roles, and a Claude Code subagent cannot spawn
subagents. Invoke those two as skills in your main session; spawned by name they fall back to a
single-session loop and report their gates as not independent. The other eight roles do not spawn
anyone, so they run the same either way.

Use `--no-agents` to install skills alone. A catalog installed through
`npx skills add` never runs this CLI, so generate the definitions afterwards:

```sh
npx squad-skills agents --global
```

Each Claude Code subagent file carries a model and a reasoning effort for its
role. `squads-team`, `squad-product`, `squad-fix` and `squad-code-review` run on
`opus`; the other roles run on `sonnet`. Effort is `high` for every role except
`squad-designer` and `squad-qa`, which run at `medium`. `--model` and `--effort`
override them, with a bare value for every role or `<skill>=<value>` for one,
and `inherit` drops the field so the role follows the session:

```sh
npx squad-skills agents --global --model squad-qa=opus,squad-designer=inherit --effort squad-qa=high
```

Every install regenerates these files, so pass the same flags again to keep an
override. Codex takes no per-agent model or effort; set `[agents]`
`default_subagent_model` and `default_subagent_reasoning_effort` in
`~/.codex/config.toml` instead, and the CLI says so rather than dropping the
flag silently.

See [the installation guide](docs/installation.md) for local-checkout commands,
installation scope, copy versus symlink behavior, and publishing notes.

### From GitHub or skills.sh

List the available skills directly from the public repository:

```sh
npx skills add danh121097/squad-skills --list
```

Install the squad orchestrator globally for selected agents:

```sh
npx skills add danh121097/squad-skills \
  --skill squads-team --global \
  --agent codex --agent claude-code --agent cursor --agent opencode
```

Install a single role:

```sh
npx skills add danh121097/squad-skills \
  --skill squad-frontend --global --agent codex
```

This route installs skills only; generate the subagents afterwards with
`npx squad-skills agents --global`, as above.

## Choosing a skill

Every skill here is model-invocable, so an agent routes most work on its own. This table is for the moment
you want to pick the role yourself.

| Situation                                                                                                                             | Reach for           |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| An idea or goal with no acceptance criteria yet, or an empty repository to frame                                                      | `squad-product`     |
| A UI, UX, design-system or motion decision that your screenshot, link, brief or Figma and the existing system leave open              | `squad-designer`    |
| Web UI, client logic and API integration                                                                                              | `squad-frontend`    |
| APIs, data models, auth, migrations, queues and server logic                                                                          | `squad-backend`     |
| React Native, Expo, Flutter, SwiftUI or Compose screens and app logic                                                                 | `squad-mobile`      |
| CI/CD, containers, IaC, reverse proxy and TLS, observability, release and rollback                                                    | `squad-devops`      |
| A bug, regression, failing test, broken build or CI/deploy failure whose owner is unproven, or that wants a diagnosis-to-fix pipeline | `squad-fix`         |
| Test design, a reproduction, or a fix that needs an evidence-backed verdict                                                           | `squad-qa`          |
| A diff, PR or branch that needs a final review gate before it ships                                                                   | `squad-code-review` |
| Work spanning several roles, or work needing independent QA and review gates                                                          | `squads-team`       |

Two of these are gates rather than builders. `squad-qa` verifies observable behavior against acceptance and
risk, then issues `PASS`, `FAIL` or `NEEDS_ENVIRONMENT`. `squad-code-review` consumes that evidence, reviews
implementation quality and issues `APPROVE`, `CHANGES_REQUESTED` or `NEEDS_EVIDENCE`; it never implements
the fixes it asks for. Reach for the smallest role that fits and let it escalate.

## How the squad runs

`squads-team` names a gate tier in one line before building:

| Tier       | When                                                                                                 | Closes on                                              |
| ---------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `light`    | One owner; no change to a public contract, auth, data or migration, infrastructure or a dependency   | One combined verify pass with real commands            |
| `standard` | The default                                                                                          | QA `PASS`, then Code Review `APPROVE`                  |
| `high`     | Auth or permissions, payment, data or migration, production infrastructure or secrets, data deletion | Both gates, run independently where the runtime allows |

A gate returns work to its owner at most twice; a third return comes back to you as blocked, with the
evidence and two to four options. `APPROVE` closes a unit: its warnings and suggestions reach you as
options in the final report instead of going back to the owner, and a follow-up you ask for is tiered on
its own diff, so a docs or test tweak does not rerun both gates. A build role or `squad-fix` called on its own verifies
with real commands and ends by suggesting `/squad-qa` then `/squad-code-review`; `high` work still runs both.
Designer runs only for decisions your own references and the existing design system leave open.

`squads-team` flags, each overriding one default:

| Flag                                  | Default without it                                                  |
| ------------------------------------- | ------------------------------------------------------------------- |
| `--devs N`                            | every safe ready slice runs; `N` caps parallel build slices         |
| `--with-mobile`, `--with-designer`    | roles come from scope routing                                       |
| `--coordinate-only`                   | the lead may implement; with it, the lead only delegates            |
| `--plan-approval`                     | no pause for build plans; material decisions still go to the user   |
| `--mode auto\|team\|subagent\|single` | `auto`, the lowest-overhead safe mode                               |
| `--no-worktree`                       | worktrees used when isolation pays; otherwise overlap is serialized |

## Skill format

Each skill directory must contain a `SKILL.md` whose YAML `name` matches the
directory name and whose `description` explains when the skill applies. Bundle
supporting material inside that same skill directory so installations remain
self-contained.

The executable contract is owned by the TypeScript validator and tests. Run
`pnpm validate` for a focused catalog check or `pnpm test` for the full gate.

## Written plans

Plans stay in the conversation unless you ask `squad-product` or `squads-team` to write one to disk, or pass
`squad-product` a `--plan-dir` / `--plan-file`. A written plan is one `plan.md`, with each phase a `## Phase N — <title>`
section. A plan too long to read as one file keeps `plan.md` as the only index and moves each phase to
`phases/phase-XX-<kebab-case-title>.md`:

```text
plans/<YYMMDD-HHmm>-<topic>/
├── plan.md
└── phases/
    ├── phase-01-<kebab-case-title>.md
    └── phase-02-<kebab-case-title>.md
```

`plan.md` owns the outcome, constraints, non-goals, acceptance criteria, labeled assumptions, open decisions
and the phase list. Each phase names its required Squad roles — for example `squad-backend` and
`squad-devops` — with a distinct responsibility for each, its ordered work and the evidence that proves it
done; the lead assigns live files and agents later. A plan never records a gate verdict: gates hand off in
prose between roles.

## Upgrading

### From 0.3 to 0.4

- A written plan is one `plan.md`; phases move to `phases/` only when the plan is too long. A plan written
  by 0.3 still reads, but `artifacts/`, `adr/`, `references/` and gate records are no longer written.
- Claude Code agent files now carry a per-role `model` and `effort`. Pass `--model inherit` or
  `--effort inherit` to keep following the session's.
- `--model` and `--effort` both accept a bare value for every role or `<skill>=<value>` for one.

### From 0.2 to 0.3

- New plan directories are named `<YYMMDD-HHmm>-<topic>`; existing `<DDMMYYYY-HHmm>` directories still
  read and need no rename.
- `--delegate` is gone; use `--coordinate-only`. `--allow-new-threads` and the thread registry are gone;
  ask for a separate task directly when you want one.
- QA and Code Review are no longer run on every change: `light` work closes on one combined verify pass.
- A role invoked on its own names its own gate tier and suggests the gates it did not run; `high` work
  still runs both.

## License

MIT. See [LICENSE](LICENSE).

## Discovery

skills.sh discovers and ranks public GitHub skills from anonymous Skills CLI
installation telemetry; the npm package is an additional distribution path and
does not replace the GitHub source.
