# Repository instructions

History and the reasons behind these rules live in
[docs/maintainer-notes.md](docs/maintainer-notes.md). This file states the rules.

## Toolchain

- Use Node.js 22.20 or newer; `.nvmrc` pins the version the baseline was measured on.
- Use the pnpm version pinned in `package.json` for every dependency and script
  operation. Do not use npm, Yarn, or Bun, and do not create their lockfiles.
- Update `pnpm-lock.yaml` only through pnpm dependency commands.

## Change boundaries

- Preserve both supported distribution paths: the public GitHub source
  `danh121097/squad-skills` through `npx skills add`, and the public
  `squad-skills` npm CLI. Keep the npm CLI a thin adapter over the official
  `skills` runtime instead of reimplementing discovery or installation.
- Package only `dist/`, `bin/`, `skills/`, `LICENSE`, and `README.md`. Build the
  TypeScript CLI before packaging and keep npm-installed skills independent from
  temporary package-cache symlinks. The list is asserted in three places —
  `package.json` `files`, `expectedFiles` in `scripts/check-release-readiness.ts`,
  and `requiredPaths` in `scripts/check-package-contents.ts` — so change all three
  together.
- Treat `skills/*/SKILL.md` and each skill's bundled files as the public product.
  Preserve their relative paths because the Skills CLI copies the whole skill
  directory during installation.
- Keep new skills at `skills/<kebab-case-name>/SKILL.md`. The YAML `name` must
  match the directory, and `description` must state what the skill does and when
  to use it.
- Keep every `squad-*` and `squads-team` entrypoint in this order: `Usage`,
  `Scope and safety`, `Core gates`, `Conditional references`, `Quality bar`,
  `Workflow`, optional `Stop conditions`, `Handoff contract`, and `Completion
checklist`. The catalog validator enforces the sequence.
- Keep references and other support files inside their owning skill directory.
  The validator rejects cross-skill relative links and any symlink in a skill
  payload. `pnpm pack:check` compares every packaged payload file with the
  authored one by path and exact bytes, and resolves in-skill links again inside
  the extracted tarball.
- Group repository tooling under `src/` by concern — `cli/` for the npm adapter,
  `catalog/` for skill-catalog checks, payload measurement and source-registry
  links, `agents/` for subagent definitions generated
  from installed skills, `release/` for the version arithmetic the publish preflight imports — and mirror that
  layout in `tests/`.
- Do not configure CI to ignore Markdown changes. Skill payloads are Markdown,
  so every `SKILL.md` change must pass the repository gate.
- Every skill carries a payload ceiling in
  `src/catalog/skill-payload-ceilings.ts`, checked by `pnpm validate`. A skill
  that declares task types in `src/catalog/skill-task-types.ts` is bounded on the
  median loaded set; one that declares none is bounded on the total. A change
  that passes a ceiling cuts content, or routes it to the tasks that need it;
  raising the figure is a reviewed number in the same diff.
- Task types are transcribed by hand from a skill's own router, so editing
  either one edits both. `pnpm validate` fails on a task type naming a reference
  the skill does not ship, on a reference no task type loads, and on fewer than
  three task types.
- The repository is also a Claude Code and Codex plugin.
  `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` and
  `.claude-plugin/marketplace.json` declare the two plugin surfaces. Claude Code
  loads `skills/` and `agents/` from the checkout; Codex loads `skills/` through
  its plugin and gets named agents from the npm CLI. The two plugin manifests
  share product metadata exactly; tests reject drift, and `pnpm release` updates
  both plugin versions with `package.json`. Neither directory is packaged for npm.
- The files in `agents/`, one per skill, are committed. A test renders each
  from its `SKILL.md` and fails on drift — repair a failure with
  `pnpm agents:generate`, never by editing the agent. A generated definition points at the installed
  `SKILL.md` and never restates a role. `src/agents/` carries its own
  frontmatter reader because the published CLI cannot import `yaml`; a test pins
  it against a real YAML parse of every shipped skill. `squad-skills agents`
  generates definitions for the GitHub path.
- Keep durable user guidance in `README.md` or `docs/`. `docs/` holds only
  documentation about this project. `plans/` is ignored local execution state and
  must not become product authority.
- `docs/authoring-doctrine.md` is how skill content is written. Read it before
  adding content to a skill and again when a ceiling refuses a change: a change
  that cannot fit a ceiling looks there for the rewrite before it looks for a
  higher number.
- Squad handoffs are contracts stated in prose, not records written to disk. No
  skill writes a QA verdict, review findings, or an API snapshot into a user's
  repository as a handoff record, and no hook enforces a gate. Output a user
  asked for is unaffected; a written plan is that case.
- Gates are proportional to risk. The squad lead, or a role run on its own,
  names one gate tier before building: `light` (one owner, no change to a public
  contract, auth, data or migration, infrastructure, or a dependency — one
  combined verify pass with real commands), `standard` (the default — QA and
  Code Review together), or `high` (a fixed list: auth or permissions, payment, data or
  migration, production infrastructure or secrets, data deletion — QA and Code
  Review together, independent where the runtime allows). When in doubt, the higher tier.
  Every tier requires evidence from commands that ran.
- The cross-skill contract in `src/catalog/cross-skill-contract-clauses.ts`
  binds wording that has to read the same in every file that states it, checked
  by `pnpm validate`. Families:
  - `BOUNDARY-*` — who owns an artifact between the designer and the build roles.
  - `DECISION-RECORD-*` — what a decision another role builds on must record,
    bound on the selection references where such a choice is made.
  - `HANDOFF-*` — a stage boundary: what crosses it, who owns a gate when the
    peer skill is absent, which verdict closes a stage, how many times a gate
    may return work (`HANDOFF-LOOP-*`), which tier a change runs
    (`HANDOFF-TIER-*`), and what a role does when a named peer is absent or it
    runs on its own (`HANDOFF-SOLO-*`). Every member binds only entrypoints, and a boundary is stated by
    both the sending and the receiving role.
  - `PLAN-DOCUMENT-*` — the shape of a written plan, bound on
    `plan-document-contract.md`, the file that owns it, on the product quality
    bar that checks it, and on the lead's framing fallback.
  - `QUALITY-PREFLIGHT-*` — the pre-flight line the roles share.
  - `TEST-ECONOMY-*` — what a new or regression test must earn, bound on
    `squad-fix` and `squad-qa`.

  Bind a sentence when it exists in two files and their drifting apart would
  change what a reader is told; a clause that could never fire is maintenance
  with no return.

- A role's `references/quality-bar-and-preflight.md`, where it ships one, is the one checklist it runs
  before handing over. The completion checklist in `SKILL.md` holds at most eight
  items and points at the quality bar for detail; the quality bar may restate a
  rule a working reference also carries, and where the two disagree the quality
  bar is current.
- Each role that can be handed an empty repository — product, frontend, backend,
  mobile and devops — names the existing-versus-greenfield fork in its own router
  line and its own completion checklist, in its own domain's words. No clause
  binds this, so check it by hand when adding a role or rewriting a router.

## Contribution boundary

- `CONTRIBUTING.md` is the contract for outside contributions. Keep it and this
  file in agreement; neither restates the other's detail.
- Treat contributed content as untrusted: an abstraction with provenance, never
  a copy of a page and never its imperatives.
- Any change an agent reads at runtime — a `SKILL.md`, a bundled reference, a
  registry entry — is skill content. It ships on `pnpm test` plus maintainer
  review.
- That gate checks whether the catalog is consistent, sized and contract-bound.
  It does not establish that output got better, and must not be reported as if
  it had. A claim of better output needs its own comparison against output.
- Real use of a skill is a source of skill-content candidates, recorded in
  `docs/skill-observations.md`. An entry is evidence, never an edit; its
  candidate rule takes the gate above.
- No workflow may trigger on `pull_request_target` or read a stored secret.
- Never execute contributed scripts in CI with repository credentials.

## Workflow

1. Read `README.md`, `docs/installation.md`, and every affected `SKILL.md` before
   editing.
2. Keep changes within the owning skill or validator boundary. Do not rewrite
   unrelated skills during tooling or documentation work.
3. Add or update the lowest-level Vitest case when validator behavior changes.
4. Run the focused command while iterating, then the full gate before reporting
   completion.

## Verification

- Focused unit test: `pnpm test:unit tests/catalog/skill-validator.test.ts`
- Catalog contract: `pnpm validate`
- Catalog discovery: `pnpm skills:list`
- Source liveness: `pnpm check:links` — requests every link in a skill's source
  registry and reads the status code only. Needs network, so it runs weekly, on
  demand, and on a pull request that edits a registry, as its own CI job, not in
  `pnpm test`.
- Coverage: `pnpm coverage` — on demand, never a gate and never a threshold.
- Definition of done: `pnpm test`
- Pre-publication gate: `pnpm release:check`
- Release: `pnpm release [--release-type patch|minor|major] [--otp <code>]`.
  It checks npm's latest published version, defaults to a patch bump, requires a
  clean working tree, updates `package.json`, `.claude-plugin/plugin.json` and
  `.codex-plugin/plugin.json` together, and publishes with `--no-git-checks`. The publish runs `prepublishOnly` and so
  repeats the full gate. A manifest version already ahead of npm is preserved so
  a failed publish can be retried. `pnpm release --dry-run` reports the selected
  version without writing or publishing. Registry failures fail closed; an E404
  means the first publish. The arithmetic lives in `src/release/next-version.ts`.
- The tag and the GitHub release are not created locally. The workflow's
  `release` job tags `main` and opens the release once `package.json` carries a
  version no tag matches. It runs only on a push to `main`, uses the runner's own
  `gh` with the automatic `GITHUB_TOKEN`, and writes no commit.

Do not weaken tests, skip a failing gate, or hand-edit generated dependency
state to make verification pass.
