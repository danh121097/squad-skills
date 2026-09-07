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

Then cut the release with one command:

```sh
pnpm release -- patch --otp 123456
```

The argument is `patch`, `minor`, `major`, or an explicit `x.y.z` that skips
ahead. `--otp` carries the npm one-time password and is required whenever the
account has two-factor auth on writes; `--yes` skips the confirmation prompt,
and `--dry-run` rehearses the whole path without publishing.

The command does, in this order:

1. **Preflight**, mutating nothing — on `main`, clean tree, in sync with
   `origin/main`, npm and `gh` authenticated, the target version free on the
   registry, and the tag free both locally and on `origin`.
2. **Write the new version** into `package.json`.
3. **Publish**, which runs `prepublishOnly` and so repeats the full
   `pnpm release:check` gate against the bumped version.
4. **Commit, tag and push** `main` with the tag.
5. **Open the GitHub release** for the tag with generated notes.

The order is what makes it safe to automate. Only step 3 is irreversible, and
everything that could fail cheaply happens before it. A publish that fails
restores `package.json` and leaves no commit, tag or release behind. A failure
after the publish is reported with the exact state it left — published, tagged
locally, not pushed — and is never undone by rewriting history, because the
version is already public by then.

To do it by hand instead:

```sh
pnpm publish --access public --otp 123456
git tag -a v0.1.1 -m v0.1.1 && git push --follow-tags origin main
gh release create v0.1.1 --title v0.1.1 --generate-notes
```

After publishing, verify both entry points:

```sh
npx squad-skills --version
npx squad-skills list
npx squad-skills add --skill squads-team --agent codex --yes
```

Increment the package version before every later release; npm does not allow a
published version to be overwritten.
