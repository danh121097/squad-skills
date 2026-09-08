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

## Develop

Requires Node.js 22.20 or newer. The repository pins pnpm through `package.json`.

```sh
pnpm install
pnpm test
pnpm release:check
```

`pnpm test` runs TypeScript type checking, formatting verification, Vitest,
skill-contract validation, knowledge-card validation, and catalog discovery
through the pinned Skills CLI.

Read [AGENTS.md](AGENTS.md) before contributing with a coding agent.
Use [the publishing guide](docs/publishing.md) when the local repository and npm
package are ready to be made public.

## Contribute

[CONTRIBUTING.md](CONTRIBUTING.md) is the contract: the contribution types that
are accepted, the ones that are rejected and why, the provenance a knowledge
card must carry, and the evidence a skill-content change must carry before it
ships.

Two things are worth knowing before you start. Knowledge enters through a
reviewed card citing a dated first-party source, never through crawling or a
pasted page. And a change to anything an agent reads at runtime ships on the
full deterministic gate plus maintainer review — that gate shows the catalog is
consistent, contract-bound and within its payload ceiling, which is not the same
as showing the output got better, so a claim that it did needs its own evidence.
[AGENTS.md](AGENTS.md) states the rule.

If you used one of these skills on real work and its output got something wrong,
open the [skill output problem](https://github.com/danh121097/squad-skills/issues/new?template=skill-feedback.yml)
form. You do not need to know the fix.
[`docs/feedback-and-weekly-improvement.md`](docs/feedback-and-weekly-improvement.md)
is what happens to a report after that, and
[`docs/skill-observations.md`](docs/skill-observations.md) is how one becomes a
rule.

An optional daily GitHub Actions workflow can collect new redacted inbox items
and `skill-feedback` issues into a draft PR under `plans/feedback/daily/`. It
runs in the cloud at 00:00 Vietnam time, creates no PR when there is no new
feedback, and never merges automatically. Local usage logs stay on the machine.

For an individual maintainer observation, ask the agent to save it first, then
publish that one redacted file with the local helper when you explicitly want a
branch and draft PR. Running the helper without `--publish` is a no-op preview;
it requires an authenticated GitHub CLI for the publishing path.

## Skill format

Each skill directory must contain a `SKILL.md` whose YAML `name` matches the
directory name and whose `description` explains when the skill applies. Bundle
supporting material inside that same skill directory so installations remain
self-contained.

The executable contract is owned by the TypeScript validator and tests. Run
`pnpm validate` for a focused catalog check or `pnpm test` for the full gate.

## Written plans

When a user asks `squad-product` or `squads-team` to write a plan to disk, the result is a navigable bundle:

```text
plans/<DDMMYYYY-HHmm>-<topic>/
├── plan.md
├── phase-01-<kebab-case-title>.md
└── phase-02-<kebab-case-title>.md
```

`plan.md` owns the outcome, boundaries, acceptance and phase index. Each linked phase file carries the
context, deliverables, ordered work, phase-specific checks, risks and handoff needed to execute that phase.
A phase declares one or more required Squad roles—for example `squad-backend` and `squad-devops`—and gives
each a distinct responsibility; the lead assigns live files and agent instances later. Conversational plans
remain in the conversation unless the user asks for files.

## License

MIT. See [LICENSE](LICENSE).

## Discovery

After this repository is public, run the documented GitHub smoke install once.
Public GitHub skills become eligible for skills.sh discovery through anonymous
Skills CLI installation telemetry; the npm package remains an additional
distribution path and does not replace the GitHub source.
