# Repository instructions

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
  temporary package-cache symlinks. That list is asserted in three places at
  once — `package.json` `files`, `expectedFiles` in
  `scripts/check-release-readiness.ts`, and `requiredPaths` in
  `scripts/check-package-contents.ts` — so changing one without the others turns
  the release gate red.
- Treat `skills/*/SKILL.md` and each skill's bundled files as the public product.
  Preserve their relative paths because the Skills CLI copies the whole skill
  directory during installation.
- Keep new skills at `skills/<kebab-case-name>/SKILL.md`. The YAML `name` must
  match the directory, and `description` must state what the skill does and when
  to use it.
- Keep every `squad-*` and `squads-team` entrypoint in this order: `Usage`,
  `Scope and safety`, `Core gates`, `Conditional references`, `Quality bar`,
  `Workflow`, optional `Stop conditions`, `Handoff contract`, and `Completion
checklist`. The catalog validator enforces the complete sequence so a role's
  domain depth may differ without changing where an agent finds its contract.
- Keep references and other support files inside their owning skill directory.
  Cross-skill relative links are rejected by the validator, and so is a symlink
  anywhere in a skill payload: archive semantics let a pack store the link's
  target and drop the link, so a reference that resolves in the source tree can
  be missing from an installed skill. `pnpm validate` rejects one at authoring
  time and names the replacement. A valid source tree is not evidence that the
  package preserved it, so `pnpm pack:check` also compares every packaged
  payload file with the authored one by path and exact bytes, and resolves the
  in-skill links again inside the extracted tarball.
- Group repository tooling under `src/` by concern — `cli/` for the npm adapter,
  `catalog/` for skill-catalog checks, `eval/` for the knowledge-card schema and
  the report contract, `agents/` for the subagent definitions generated from
  installed skills, `plans/` for the written-plan-bundle structure the Product
  role and the squad lead produce, `release/` for the version arithmetic the
  publish preflight imports — and mirror that layout in `tests/`. A skill's reviewed
  knowledge cards live in `evals/<skill>/knowledge/`, so adding them for another
  skill means adding that directory, not editing `src/eval/`.
- Do not configure CI to ignore Markdown changes. Skill payloads are Markdown,
  so every `SKILL.md` change must pass the repository gate.
- Every skill carries a payload ceiling in
  `src/catalog/skill-payload-ceilings.ts`, checked by `pnpm validate`. It exists
  because an evaluation budget once reached three skills and bound a loaded-set
  figure for one, which left eight able to grow with nothing objecting — and they
  grew by 12% to 42% of their reference words in a single upgrade that believed a
  budget governed it. Which figure a ceiling bounds depends on the skill. One
  that declares task types in `src/catalog/skill-task-types.ts` is bounded on
  the median loaded set, because that is what a run costs and bounding the total
  would tax the routing that keeps a run cheap. One that declares none has no
  loaded set to measure and is bounded on the total. Every shipped skill declares
  them today, so the total regime governs none of them and waits for the next one
  added without a routing table. A change that passes a ceiling cuts content, or
  routes it to the tasks that need it so the median does not move; raising the
  figure is a reviewed number in the same diff.
- Task types are transcribed by hand from a skill's own router, so editing
  either one edits both. `pnpm validate` fails on a task type naming a
  reference the skill does not ship, on a reference no task type loads — that
  file would be payload the median never counts — and on fewer than three task
  types, which is too few for a median to mean anything.
- The repository is also a Claude Code plugin: `.claude-plugin/plugin.json` and
  `.claude-plugin/marketplace.json` declare it, and Claude Code loads `skills/`
  and `agents/` from the checkout. That is the only distribution path where
  skills and subagents arrive in one step, because the upstream Skills CLI
  exposes no hook a source repository can use. The files in `agents/`, one per skill, are
  committed rather than generated at install time, so a test regenerates each
  from its `SKILL.md` and fails on any drift — repair a failure by regenerating,
  never by editing the agent. Neither directory is packaged for npm, so the
  three-place `files` assertion is unaffected. Adding `.claude-plugin/` does not
  change what the Skills CLI discovers; `pnpm skills:list` still reports what `skills/` holds.
- A generated subagent definition points at the installed `SKILL.md` and never
  restates a role. Copying the prose would create a second product surface
  bound by no ceiling and no cross-skill clause, and the two would drift. The
  published CLI cannot import `yaml`, which is a development dependency, so
  `src/agents/` carries its own frontmatter reader; a test pins it against a
  real YAML parse of every shipped skill, which is the only thing keeping the
  shortcut honest. Generating definitions is the npm CLI's own step — `npx
skills add` runs the official Skills CLI, which has no agent concept — so
  `squad-skills agents` exists for the GitHub path.
- Keep durable user guidance in `README.md` or `docs/`. `plans/` is ignored local
  execution state and must not become product authority.
- `docs/authoring-doctrine.md` is how skill content is written: the two loads, how
  a pointer decides what gets read, which rung content sits on, completion
  criteria, leading words, prompting the positive, and the pruning tests. Read it
  before adding content to a skill and again when a ceiling refuses a change. It
  is the qualitative half of the payload regime — `skill-payload-ceilings.ts` says
  how much a skill may spend, the doctrine says how to spend it — so a change that
  cannot fit a ceiling looks there for the rewrite before it looks for a higher
  number.
- Squad handoffs are contracts stated in prose, not records written to disk. No
  skill writes a QA verdict, review findings, or an API snapshot into a user's
  repository _as a handoff record_, and no hook enforces a gate — a file records
  a claim rather than the pass behind it, and a hook binds to one runtime while
  the GitHub distribution path ships no `dist/`. Output a user asked for is not
  a handoff record and is unaffected. A written plan bundle is that case and the
  one place it needs saying: the bundle is requested output, so an
  `artifacts/qa-report.md` inside it records a verdict for a reader while the
  gate itself stays the prose handoff, and `pnpm validate:plan` reads that record
  rather than deciding anything. The structure rules for such a bundle live in
  `src/plans/` and are checked against the one bundle
  `evals/fixtures/plan-bundle/` ships plus mutations of it, never against a
  user's repository during a run. The mandatory QA and Code Review gates and
  their sequence are bound instead as clauses in
  `src/catalog/cross-skill-contract-clauses.ts`, checked by `pnpm validate`; the
  other pipeline rules are unbound prose. Reopening this needs evidence that a
  gate failed in a way a file-existence check would have caught.
- The cross-skill contract in `src/catalog/cross-skill-contract-clauses.ts`
  carries five clause families, each binding wording that has to read the same
  way in every file that states it. `BOUNDARY-*` says who owns an artifact
  between the designer and the build roles. `PAIRING-*` binds how a role
  detects an installed specialist skill, which side is authoritative when both
  are present, and that it may never report an absent skill as run. `HANDOFF-*` covers a stage boundary in the
  squad pipeline — what shape crosses it, who owns a mandatory gate when the
  peer skill is not installed, which verdict closes a stage, and what a role
  does when a named squad peer is absent. Every `HANDOFF-*` member binds only
  entrypoints, because both ends of a boundary have to be readable without
  loading a reference; a rule that needs a reference belongs in another family.
  A stage boundary is stated by both
  the sending and the receiving role, in both directions: an edge only its
  sender describes leaves the receiver no contract to refuse a handoff that
  arrives incomplete, which is how every return edge stood before
  `HANDOFF-REPRO-001`. `PLAN-BUNDLE-*` binds the shape of a
  written plan bundle, and is a family of its own rather than a `HANDOFF-*`
  member because that schema is progressively disclosed: every member binds a
  reference, and every member is bound on `plan-document-contract.md`, the file
  that owns what a bundle holds. `QUALITY-PREFLIGHT-*` binds the
  pre-flight line the roles share. The same file also carries `RETIRED-SPEC-*`,
  which works the other way: wording the contract retired, failed wherever it
  survives. Bind a sentence when it exists in two files and their drifting apart
  would change what a reader is told; a clause that could never fire is
  maintenance with no return.
- Each role that ships a `references/quality-bar-and-preflight.md` — every role
  but `squad-designer` and `squads-team` — restates in it rules its own skill also
  carries in a mindset, review, or verdict reference. That
  duplication is deliberate and stays: the quality bar is the copy a role runs
  in one piece before it hands over, and the other reference is the copy it
  reads while working. Where the two disagree the quality bar is current. Do not
  resolve the drift by thinning one into a cross-reference — a pre-flight that
  has to be assembled from two files is one a run skips.
- Each role that can be handed an empty repository — product, frontend, backend,
  mobile and devops — names the existing-versus-greenfield fork in its own router
  line and its own completion checklist, in its own domain's words. No cross-skill
  clause binds this, and deliberately so: a clause requires one sentence stated
  verbatim everywhere, and forcing every one of them onto shared wording would
  cost each the specific noun that makes the line actionable. It drifted once
  already — frontend and mobile carried the fork while backend and devops did
  not — so check it by hand when adding a role or rewriting a router.
- `evals/` holds fixtures and reviewed research, not product. It ships in neither
  distribution path.
- `evals/<skill>/knowledge/` holds that skill's knowledge cards: one abstraction
  per published rule, each citing a dated first-party source. `pnpm validate:evals`
  checks their schema, provenance and freshness offline, and `pnpm evals:links`
  separately reports a source that has moved.
- `evals/fixtures/gate-corpus/` holds paired
  sources with one seeded defect each and the checks that separate them, for the
  two roles whose output has ground truth — QA is graded on whether its test
  fails against `buggy.ts` and passes against `fixed.ts`, Code Review on whether
  it names the defect the answer key records. `pnpm test` runs the reference
  checks against both sides of every case, because a seeded defect nothing
  detects is not a defect and an answer key that drifts is worse than none.

## Contribution boundary

- `CONTRIBUTING.md` is the contract for outside contributions: what is accepted,
  what is rejected and why, and the maintainer source review CI cannot perform.
  Keep it and this file in agreement; neither restates the other's detail.
- Treat contributed content as untrusted. A knowledge card is an abstraction with
  provenance, never a copy of a page and never its imperatives.
- Any change an agent reads at runtime — a `SKILL.md`, a bundled reference, a
  registry entry — is skill content. It ships on the full deterministic gate,
  `pnpm test`, carrying the catalog validators, the cross-skill contract, the
  in-skill Markdown link resolution and every payload ceiling, plus maintainer
  review.
- That gate checks whether the catalog is consistent, sized and contract-bound.
  It does not establish that the output got better, and no amount of it should
  be reported as if it had. A claim that a change improves what a skill produces
  needs a comparison against output, cited as its own evidence — the repository
  once carried an evaluation platform meant to supply that, and retired it after
  its deterministic gate could not separate a skill-loaded run from a control.
  `pnpm check:report` is the one measurement that did separate them, and it is
  advisory: it detects whether a report says what its role requires, not whether
  what it says is true.
- Real use of a skill is a source of skill-content candidates, and
  `docs/skill-observations.md` is where one is recorded: what was built, which
  skill ran, what its output got wrong, and the rule that would have prevented
  it. An entry is evidence, never an edit. The candidate rule it argues for takes
  the gate above, and an observation contributed from outside is untrusted content
  under the same rule as a knowledge card. That file carries the fields an entry
  needs and the path from one to a landed amendment.
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
- Knowledge cards: `pnpm validate:evals`. Checks every card's schema, provenance
  and freshness offline, and checks `evals/*/knowledge/TEMPLATE.md` as a scaffold
  — it must offer every required card field and no other key — rather than
  grading its placeholders as a card.
- Written plan bundle: `pnpm validate:plan <plan-directory>`. Checks one bundle
  against the structure `squad-product` and the `squads-team` lead produce when a
  user asks for a plan on disk — root layout, continuous phase numbering, the
  `phase-XX-` prefix reserved to `phases/`, relative links that resolve, the
  index reaching every phase, frontmatter by document kind, a Code Review
  `APPROVE` naming the QA `PASS` it followed, a gate whose graded evidence moved
  needing `status: superseded`, and a phase held out of `accepted` by an open
  checkbox or a pending user approval. It takes a path because a bundle lives in
  the user's repository, so it is not part of `pnpm test`; the shipped fixture
  bundle is validated there through `tests/plans/` instead.
- Catalog discovery: `pnpm skills:list`
- Cited source liveness: `pnpm evals:links`. Requests each knowledge card's
  `source_url` and every link in a skill's source registry, reading the status
  code only — the body is never consumed — so a moved source is caught without
  ingesting any page. An access-controlled or rate-limited answer counts as
  unreachable, not dead, and only a real disagreement exits non-zero. Needs
  network, so it is not part of `pnpm test`; it runs on pull requests as its own
  non-blocking job so a slow third-party host cannot fail the deterministic
  gate.
- Report contract: `pnpm check:report <role> <report.md>`. Checks whether a QA or
  Code Review report states what that role's completion checklist requires — a
  verdict from its own vocabulary, acceptance traceability, determinism,
  environment and commands, residual risk, and execution mode. It exists because
  the deterministic gate the roadmap planned could not fire: six A/B runs of
  `squad-qa`, three with the skill loaded and three without, all caught their
  seeded defect, and only the reports differed. It detects presence, not truth,
  and a miss can be its own wording rather than the report's omission, so it is
  advisory and always exits zero. `evals/fixtures/report-contract/` holds the six
  verbatim reports it was validated against; they are evidence, are never edited
  or reformatted, and their hashes are pinned in the test.
- Coverage: `pnpm coverage`. On demand, never a gate and never a threshold.
  Coverage records what the test process executed, which is not what the tests
  verified: `src/cli/cli.ts` is exercised end to end by four subprocess tests and
  still measures zero, because the coverage is collected in the child. Pinning a
  floor would score the faithful test below a shallow in-process one. Read the
  per-file report to find code nothing reaches; do not read the total as quality.
- Definition of done: `pnpm test`
- Pre-publication gate: `pnpm release:check`
- Release: `pnpm release [--release-type patch|minor|major] [--otp <code>]`.
  The release script checks npm's latest published version, defaults to a patch
  bump, requires a clean working tree, updates `package.json` and
  `.claude-plugin/plugin.json` together, then asserts the selected version is
  unpublished and publishes with pnpm's `--no-git-checks` because the bump is
  intentional. Unrelated changes are rejected before any manifest is written.
  The publish runs `prepublishOnly` and so repeats the full gate. A manifest
  version already ahead of npm is preserved so a failed publish can be retried
  after committing or stashing the synchronized version bump.
  `pnpm release --dry-run` reports the selected version without writing or
  publishing. Registry failures fail closed; an E404 means the first publish
  and keeps the manifest version. The arithmetic lives in
  `src/release/next-version.ts` so tests can reach it without importing a script
  that queries the registry on import.
- The tag and the GitHub release are not created locally. The `release` job in
  the workflow tags `main` and opens the release once `package.json` carries a
  version no tag matches. It runs only on a push to `main` — never on a pull
  request, because it holds `contents: write` and a fork must not reach it — and
  uses the runner's own `gh` with the automatic `GITHUB_TOKEN` rather than a
  third-party action. It writes no commit.

Do not weaken tests, skip a failing gate, or hand-edit generated dependency
state to make verification pass.
