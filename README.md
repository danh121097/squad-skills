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

Use `--no-agents` to install skills alone. A catalog installed through
`npx skills add` never runs this CLI, so generate the definitions afterwards:

```sh
npx squad-skills agents --global
```

`--model` and `--effort` write those fields into each Claude Code subagent file,
so a spawned role runs on the model you picked and survives the next reinstall:

```sh
npx squad-skills agents --global --model opus --effort medium
```

No skill in this catalog names a model. Which one to run is a property of your
machine, not of the role, so it lives in the command that writes your files.
Codex takes no per-agent model; set `[agents] default_subagent_model` in
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

This route installs skills only. The upstream Skills CLI has no hook a source
repository can use, so generate the subagent definitions after it:

```sh
npx squad-skills agents --global
```

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

A gate returns work to its owner at most twice; a third `FAIL` or `CHANGES_REQUESTED` comes back to you as
blocked, with the evidence and two to four options. A build role or `squad-fix` called on its own verifies
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

When a user asks `squad-product` or `squads-team` to write a plan to disk, the plan is as small as the work.
One or two phases is a single `plan.md` whose frontmatter declares `layout: single`, with each phase a
`## Phase N — <title>` section. A larger plan is a navigable bundle:

```text
plans/<YYMMDD-HHmm>-<topic>/
├── plan.md
├── phases/
│   ├── phase-01-<kebab-case-title>.md
│   └── phase-02-<kebab-case-title>.md
├── artifacts/
│   ├── product-contract.md
│   ├── qa-report.md
│   ├── code-review.md
│   └── handoff-to-phase-02.md
├── adr/
│   └── adr-001-<kebab-case-title>.md
└── references/
    ├── domain-model.md
    └── technical-stack.md
```

`plan.md` is the entrypoint and the only index: it owns the outcome, boundaries, acceptance and the phase
table. Each linked phase file carries the context, deliverables, ordered work, phase-specific checks, risks
and handoff needed to execute that phase. A phase declares one or more required Squad roles—for example
`squad-backend` and `squad-devops`—and gives each a distinct responsibility; the lead assigns live files and
agent instances later. Conversational plans remain in the conversation unless the user asks for files.

Only `phases/` states the running order, so only phase files carry the `phase-XX-` prefix. `artifacts/`
holds what a phase produced, `adr/` one decision per file, and `references/` the background every phase
reads and none of them owns; each records its owning phase in frontmatter rather than in its name, which is
why a handoff is `artifacts/handoff-to-phase-02.md`. A gate recorded in `artifacts/` names the revisions it
graded — and once one of those moves, that verdict is marked superseded and the gates rerun. The record is
for a reader; the gate itself is still the prose handoff between roles.

Check a bundle against that contract:

```sh
pnpm validate:plan plans/<YYMMDD-HHmm>-<topic>
```

### Migrating from 0.2

- New plan directories are named `<YYMMDD-HHmm>-<topic>`; existing `<DDMMYYYY-HHmm>` directories still
  validate and need no rename.
- `--delegate` is gone; use `--coordinate-only`. `--allow-new-threads` and the thread registry are gone;
  ask for a separate task directly when you want one.
- QA and Code Review are no longer run on every change: `light` work closes on one combined verify pass.

A plan written under the earlier flat layout still reads fine and no longer validates. Migrate it by moving
each `phase-XX-*.md` into `phases/`, moving shared background into `references/` and produced work into
`artifacts/`, renaming any `phase-XX-` artifact to drop the reserved prefix, adding the frontmatter each
kind now states, and repointing the links in `plan.md`.

## License

MIT. See [LICENSE](LICENSE).

## Discovery

After this repository is public, run the documented GitHub smoke install once.
Public GitHub skills become eligible for skills.sh discovery through anonymous
Skills CLI installation telemetry; the npm package remains an additional
distribution path and does not replace the GitHub source.
