# Squad Skills

[![skills.sh](https://skills.sh/b/danh121097/squad-skills)](https://skills.sh/danh121097/squad-skills)

Supports **OpenCode**, **Claude Code**, **Codex**, **Cursor**, and
[**73 more**](https://www.npmjs.com/package/skills#supported-agents).

Role-specialized engineering skills for AI coding agents. The collection covers
product design, frontend, backend, mobile, DevOps, QA, code review, bug fixing,
and coordinated squad delivery while preserving clear ownership boundaries.

The repository follows the open Agent Skills format and keeps each installable
skill under `skills/<skill-name>/SKILL.md`.

## Install

Choose either distribution path. Both routes install the same skill directories
through the upstream Skills CLI.

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

### From the npm package

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

See [the installation guide](docs/installation.md) for local-checkout commands,
installation scope, copy versus symlink behavior, and publishing notes.

## Develop

Requires Node.js 22.20 or newer. The repository pins pnpm through `package.json`.

```sh
pnpm install
pnpm test
pnpm release:check
```

`pnpm test` runs TypeScript type checking, formatting verification, Vitest,
skill-contract validation, and catalog discovery through the pinned Skills CLI.

Read [AGENTS.md](AGENTS.md) before contributing with a coding agent.
Use [the publishing guide](docs/publishing.md) when the local repository and npm
package are ready to be made public.

## Skill format

Each skill directory must contain a `SKILL.md` whose YAML `name` matches the
directory name and whose `description` explains when the skill applies. Bundle
supporting material inside that same skill directory so installations remain
self-contained.

The executable contract is owned by the TypeScript validator and tests. Run
`pnpm validate` for a focused catalog check or `pnpm test` for the full gate.

## Discovery

After this repository is public, run the documented GitHub smoke install once.
Public GitHub skills become eligible for skills.sh discovery through anonymous
Skills CLI installation telemetry; the npm package remains an additional
distribution path and does not replace the GitHub source.
