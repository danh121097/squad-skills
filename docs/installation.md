# Install the squad skills

This repository is a collection of open Agent Skills. The Skills CLI discovers
each directory under `skills/` containing a valid `SKILL.md`. The same catalog
can be installed directly from GitHub or through the `squad-skills` npm CLI.

## Requirements

- Node.js 22.20 or newer.
- pnpm 10.17.1, pinned by the project package metadata.
- A supported AI coding agent. The current Skills CLI supports Codex, Claude
  Code, Cursor, OpenCode, GitHub Copilot, Windsurf, and many others.

## Validate a local checkout

Run the repository contract and the Skills CLI discovery check:

```sh
pnpm install
pnpm test
```

To inspect the catalog without installing anything:

```sh
pnpm skills:list
```

## Install from this local checkout

Install one skill into selected agents for the current project:

```sh
pnpm exec skills add . --skill squad-frontend --agent codex --agent claude-code
```

Install the squad orchestrator globally into several agents:

```sh
pnpm exec skills add . --skill squads-team --global \
  --agent codex --agent claude-code --agent cursor --agent opencode
```

Use `--copy` if symlinks are unsuitable. Use `--all` only when every skill
should be installed into every detected agent.

## Install from GitHub

```sh
npx skills add danh121097/squad-skills --list
npx skills add danh121097/squad-skills --skill squads-team
npx skills add danh121097/squad-skills \
  --skill squad-frontend --global --agent codex
```

skills.sh lists public GitHub skills automatically after users install them
through the Skills CLI and anonymous telemetry records the
installation. No separate skills.sh submission step is required. See the
[publishing guide](publishing.md) for the local-to-public release sequence.

## Install from npm

Run the package without installing the CLI permanently:

```sh
npx squad-skills list
npx squad-skills add --skill squads-team
npx squad-skills add --skill squad-frontend --global --agent codex
```

Or install the CLI globally:

```sh
npm install --global squad-skills
squad-skills list
squad-skills add --skill squads-team
```

`squad-skills add` accepts the same options as `skills add`. The wrapper uses
the packaged `skills/` directory as its source and adds `--copy` by default so
the installation remains valid after an `npx` cache is cleaned.

## As a Claude Code plugin

Claude Code loads a plugin's `skills/` and `agents/` directories together, which
makes this the only single-command route to both:

```sh
/plugin marketplace add danh121097/squad-skills
/plugin install squad-skills@squad-skills
```

The agent definitions are committed at `agents/`, one per skill, and a plugin agent
reaches its role by skill name because a plugin installs both halves at once.
`pnpm test` regenerates each one from its `SKILL.md` and fails if the committed
file has fallen behind, so a skill description never drifts away from the agent
that carries it.

Codex has no equivalent plugin format; use the npm CLI for it.

## Subagent definitions

Each skill also has a role a coding agent can spawn by name. `squad-skills add`
generates one definition per installed skill:

| Tool        | Definition                  | Loaded by                                               |
| ----------- | --------------------------- | ------------------------------------------------------- |
| Claude Code | `.claude/agents/<name>.md`  | The file's presence                                     |
| Codex       | `.codex/agents/<name>.toml` | A `config_file` entry under `[agents]` in `config.toml` |

A definition carries the skill's own name and description and points at the
installed `SKILL.md`; it never copies the role's content, so editing a skill
changes what its agent does on the next install.

```sh
npx squad-skills add --skill squad-qa --global --agent claude-code --agent codex
npx squad-skills agents --global      # for a catalog installed by `npx skills add`
npx squad-skills add --no-agents      # skills only
```

Notes:

- Only the npm CLI can do this. `npx skills add` runs the official Skills CLI,
  which installs skills and has no concept of an agent definition, so a GitHub
  installation needs the separate `agents` command.
- Codex definitions are written at global scope only, because this CLI has not
  verified where a project-scope Codex config lives. Claude Code supports both.
- Registering a Codex agent edits `config.toml`. The CLI copies it to
  `config.toml.squad-skills-backup` before its first edit in a run, appends only
  entries that are missing, and never rewrites one that already exists.
- A file the CLI did not generate is never replaced. It is reported and kept
  unless `--force` is passed.
- A definition is written only where the matching skill is actually installed.

## Available skills

The machine-readable catalog is owned by the `skills/*/SKILL.md` files. Run
`pnpm skills:list` for the current list instead of maintaining a duplicate
inventory here.

## Add or update a skill

Keep each skill in its own `skills/<kebab-case-name>/` directory. Its `SKILL.md` must
have a matching lowercase kebab-case `name`, a non-empty `description`, and
valid relative links to any bundled references. Run `pnpm test` before sharing
the repository.

A change to what an agent reads at runtime carries maintainer review as well as
`pnpm test`. See [AGENTS.md](../AGENTS.md) for that rule and what the gate does
and does not establish.
