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

After the GitHub source is public, authenticate once:

```sh
npm login
npm whoami
```

Set the version in `package.json` by hand, commit it alongside the change that
earned it, then publish:

```sh
pnpm release --otp 123456
```

That runs two steps. The first refuses the publish if npm already has the
version, in a second and before anything is built — npm would reject it anyway,
but only after `prepublishOnly` has run the whole gate and the one-time password
has been entered, and its E403 reads like a permissions problem rather than a
forgotten bump. The second is `pnpm publish --access public`, which runs
`prepublishOnly` and so repeats `pnpm release:check`.

`--otp` carries the npm one-time password and is required whenever the account
has two-factor auth on writes. To rehearse without publishing:

```sh
pnpm release --dry-run
```

Nothing here picks the version. A script cannot know whether a change is a patch
or a break, and one that guessed would eventually ship a major as a minor, so
the refusal prints the three candidates and leaves the choice with you.

## Tag and GitHub release

Neither is created locally. Once the version commit reaches `main` and the
validation gate passes, the `release` job in
[`.github/workflows/validate-skills.yml`](../.github/workflows/validate-skills.yml)
tags that commit and opens the GitHub release with generated notes — but only
when no tag matches the version yet, so a push that did not change the version
does nothing.

That job runs on a push to `main` and never on a pull request, because it holds
`contents: write` and a fork's pull request must not reach it. It uses the
runner's own `gh` with the automatic `GITHUB_TOKEN` rather than a third-party
action, and it writes no commit.

After publishing, verify both entry points:

```sh
npx squad-skills --version
npx squad-skills list
npx squad-skills add --skill squads-team --agent codex --yes
```

Increment the package version before every later release; npm does not allow a
published version to be overwritten.
