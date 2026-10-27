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

`--all` differs between the two paths. Under `skills add .` it means every skill
into every detected agent, and an `--agent` given alongside it is overridden.
Under `squad-skills add` an explicit `--skill` or `--agent` wins, so
`squad-skills add --all --agent codex` installs every skill into Codex only.

## As a Claude Code plugin

Claude Code loads a plugin's `skills/` and `agents/` directories together, which
makes this the only single-command route to both:

```sh
/plugin marketplace add danh121097/squad-skills
/plugin install squad-skills@squad-skills
```

The agent definitions are committed at `agents/`, one per skill, and a plugin agent
reaches its role by skill name because a plugin installs both halves at once.
`pnpm agents:generate` rewrites each one from its `SKILL.md`, and `pnpm test`
fails if a committed file has fallen behind, so a skill description never drifts away from the agent
that carries it. Each plugin agent carries its role's default model and
reasoning effort; a plugin install takes no `--model` or `--effort` flag, so a
different value needs the npm CLI's agent files instead.

## As a Codex plugin

Codex reads `.codex-plugin/plugin.json` from the repository root and installs
the same `skills/` catalog through its plugin marketplace:

```sh
codex plugin marketplace add danh121097/squad-skills
codex plugin add squad-skills@squad-skills
```

The plugin supplies skills, not the generated Codex agent definitions. Generate
those separately when each role should also be spawnable by name:

```sh
npx squad-skills add --all --global --agent codex
```

Start a new Codex task after plugin installation so it discovers the catalog.

This command installs durable copied skills and generates their agents together.
The `agents` command alone finds standalone skill installations, not plugin-cache
payloads. Use `--skill <name>` instead of `--all` to install selected roles. Keep
the plugin and copied catalog on the same release, or use the npm path alone to
avoid two catalog versions.

## Subagent definitions

Each skill also has a role a coding agent can spawn by name. `squad-skills add`
generates one definition per installed skill:

| Tool        | Definition                  | Loaded by                                                      |
| ----------- | --------------------------- | -------------------------------------------------------------- |
| Claude Code | `.claude/agents/<name>.md`  | The file's presence                                            |
| Codex       | `.codex/agents/<name>.toml` | An `[agents.<name>]` table with `config_file` in `config.toml` |

A definition carries the skill's own name and description and points at the
installed `SKILL.md`; it never copies the role's content, so editing a skill
changes what its agent does on the next install.

`pnpm agents:generate` also refreshes the bundled worker model references for
Codex and Claude from the shared role defaults. Keep these generated files with their owning
skills so a GitHub-only installation can select the same defaults for worker
chats without the npm CLI. They are checked for drift by `pnpm test`.

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
  `config.toml.squad-skills-backup` before its first edit and keeps that first
  copy on later runs, appends only entries that are missing, and never rewrites
  one that already exists. A config that defines `agents` with dotted keys or an
  inline table is left unedited, and the entries to add are printed instead.
- Each Codex agent file carries its role's model and reasoning effort. Regenerate
  installed definitions with `squad-skills agents --global --agent codex` to apply
  the catalog defaults; `[agents]` defaults stay intact. Use `--model`, `--effort`,
  named overrides or `inherit` as described in the [README](../README.md#each-role-as-a-subagent-too).
- `add --list` and `add --help` only list or print help, so they write no agent
  definitions.
- A file the CLI did not generate is never replaced. It is reported and kept
  unless `--force` is passed.
- A definition is written only where the matching skill is actually installed.

## Available skills

The machine-readable catalog is owned by the `skills/*/SKILL.md` files. Run
`pnpm skills:list` for the current list instead of maintaining a duplicate
inventory here.

## Add or update a skill

Keep each skill in its own `skills/<kebab-case-name>/` directory. Its `SKILL.md` must
have valid relative links to any bundled references. The validator checks these
[Agent Skills frontmatter constraints](https://agentskills.io/specification):

- `name`: 1–64 characters, lowercase kebab-case, matching the directory.
- `description`: a non-blank string of at most 1024 characters.
- `compatibility`, when present: a non-blank string of at most 500 characters.
- `metadata`, when present: a mapping of string keys to string values. Quote
  numeric keys and version values when they must remain strings.

Character limits count Unicode code points. Runtime extension fields such as
`user-invocable`, `argument-hint`, `category` and `keywords` remain accepted;
their client-specific semantics are not validated here. Run `pnpm test` before
sharing the repository.

A change to what an agent reads at runtime carries maintainer review as well as
`pnpm test`. See [AGENTS.md](../AGENTS.md) for that rule and what the gate does
and does not establish.
