# Publish the skill collection and npm CLI

The collection has two public distribution paths:

- `npx skills add danh121097/squad-skills` reads the catalog from GitHub and
  enables skills.sh discovery.
- `npx squad-skills add` reads the same catalog from the published npm package
  and delegates installation to the official `skills` runtime dependency.

## Prepare locally

Use Node.js 22.20 or newer, then run the complete release-readiness gate:

```sh
pnpm install --frozen-lockfile
pnpm release:check
```

The gate verifies the TypeScript tooling, tests, skill catalog, Skills CLI
discovery, compiled CLI, GitHub metadata, npm metadata, and package contents.
It builds a tarball in a temporary directory, verifies its allowlist, deletes
the temporary artifact, and does not publish anything.

## Publish to GitHub

When ready, authenticate GitHub, create the public repository named
`squad-skills` under `danh121097`, commit the reviewed files, and push `main`.
Those external actions are intentionally not automated by this repository.

## Verify the public source

Check discovery without installing:

```sh
npx skills add danh121097/squad-skills --list
```

Then smoke-install one skill into an explicit agent:

```sh
npx skills add danh121097/squad-skills \
  --skill squads-team --agent codex --copy --yes
```

Review the copied `SKILL.md` and references before use. Once the public source is
installed with telemetry enabled, skills.sh can discover and rank its skills
automatically. There is no separate submission form.

## Publish to npm

After the GitHub source is public, authenticate with npm and confirm the package
identity before publishing:

```sh
npm login
npm whoami
pnpm view squad-skills
pnpm publish --access public
```

The package name is only reserved when the first publish succeeds. Do not run
the publish command until the repository contents, version, and account are
ready. Publishing runs `prepublishOnly`, which repeats `pnpm release:check`.

After publishing, verify both entry points:

```sh
npx squad-skills --version
npx squad-skills list
npx squad-skills add --skill squads-team --agent codex --yes
```

Increment the package version before every later release; npm does not allow a
published version to be overwritten.
