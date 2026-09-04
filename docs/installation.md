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

## Available skills

The machine-readable catalog is owned by the `skills/*/SKILL.md` files. Run
`pnpm skills:list` for the current list instead of maintaining a duplicate
inventory here.

## Add or update a skill

Keep each skill in its own `skills/<kebab-case-name>/` directory. Its `SKILL.md` must
have a matching lowercase kebab-case `name`, a non-empty `description`, and
valid relative links to any bundled references. Run `pnpm test` before sharing
the repository.

A change to what an agent reads at runtime carries more than `pnpm test`. See
[the evaluation and governance guide](evaluation-and-governance.md) for the
evidence behind that, and [AGENTS.md](../AGENTS.md) for the rule itself.
