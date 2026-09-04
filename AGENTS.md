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
- Keep references and other support files inside their owning skill directory.
  Cross-skill relative links are rejected by the validator.
- Group repository tooling under `src/` by concern — `cli/` for the npm adapter,
  `catalog/` for skill-catalog checks, `eval/` for the evaluation contract — and
  mirror that layout in `tests/`. The evaluation engine reads which skills a
  cycle covers from its manifests, so adding a contract for another skill means
  adding `evals/<skill>/`, not editing `src/eval/`.
- Do not configure CI to ignore Markdown changes. Skill payloads are Markdown,
  so every `SKILL.md` change must pass the repository gate.
- Keep durable user guidance in `README.md` or `docs/`. `plans/` is ignored local
  execution state and must not become product authority.
- Squad handoffs are contracts stated in prose, not records written to disk. No
  skill writes a QA verdict, review findings, or an API snapshot into a user's
  repository _as a handoff record_, and no hook enforces a gate — a file records
  a claim rather than the pass behind it, and a hook binds to one runtime while
  the GitHub distribution path ships no `dist/`. Output a user asked for is not
  a handoff record and is unaffected. The mandatory QA and Code Review gates and
  their sequence are bound instead as clauses in
  `src/catalog/cross-skill-contract-clauses.ts`, checked by `pnpm validate`; the
  other pipeline rules are unbound prose. Reopening this needs evidence that a
  gate failed in a way a file-existence check would have caught.
- `evals/` holds evaluation fixtures, not product. It ships in neither
  distribution path, and `evals/squad-designer/eval-contract.md` is the human
  authority its manifests must agree with. Never record a held-out case body
  there; private lanes carry an id and a content hash only.

## Contribution boundary

- `CONTRIBUTING.md` is the contract for outside contributions: what is accepted,
  what is rejected and why, and the maintainer source review CI cannot perform.
  Keep it and this file in agreement; neither restates the other's detail.
- Treat contributed content as untrusted. A knowledge card is an abstraction with
  provenance, never a copy of a page and never its imperatives.
- Any change an agent reads at runtime — a `SKILL.md`, a bundled reference, a
  registry entry — is skill content, and it ships in one of two tiers. Which
  tier a skill is in is derived rather than listed here: it is **eval-covered**
  when `evals/<skill>/case-manifest.yml` exists, and **review-only** when no
  such lane exists yet.
- Eval-covered skill content runs the evaluation cycle and human promotion
  approval before it ships; review agreement alone never promotes it. Nothing in
  the review-only tier lowers that bar or reaches a skill that has a lane.
- Review-only skill content ships on the full deterministic gate — `pnpm test`,
  carrying the catalog validators, the cross-skill contract, the in-skill
  Markdown link resolution, and every payload hash a baseline manifest records —
  plus maintainer review, and the pull request records that it shipped
  review-only. The tier states which evidence exists rather than asking for less
  of it: it is what remains when there is no cycle to run, and it stops applying
  to a skill the moment a lane is added for it.
- A pull request touching more than one skill takes each skill's own tier. The
  eval-covered obligation applies to the covered part whatever else ships
  alongside it; a review-only skill in the same change never lowers it.
- A baseline manifest records a payload hash for some review-only skills too. A
  change that moves one re-measures it in the same commit, and says which cycle
  in flight that frozen baseline belongs to, because re-measuring is what a
  maintainer is approving there.
- A review-only skill becomes eval-covered by adding `evals/<skill>/` with its
  case manifest — the same file the tier is derived from. Which skills get a
  lane, and when, is the evaluation cycle's fan-out decision rather than a rule
  here.
- Real use of a skill is a source of skill-content candidates, and
  `docs/skill-observations.md` is where one is recorded: what was built, which
  skill ran, what its output got wrong, and the rule that would have prevented
  it. An entry is evidence, never an edit. The candidate rule it argues for
  takes the owning skill's tier above — a run that produced a good rule does not
  buy an eval-covered skill out of its cycle — and an observation contributed
  from outside is untrusted content under the same rule as a knowledge card. That
  file carries the fields an entry needs and the path from one to a landed
  amendment.
- No workflow may name the private-store environment variable, trigger on
  `pull_request_target`, or read a stored secret. `pnpm validate:evals` asserts
  all three, so the held-out set stays unreachable from every CI path.
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
- Evaluation contract: `pnpm validate:evals`. Set `EVAL_PRIVATE_PATH` to a clone
  of the held-out store, outside this repository, to also verify its hashes;
  leave it unset in CI. It also asserts acceptance-set isolation across
  `.github/workflows/`, and checks `evals/*/knowledge/TEMPLATE.md` as a scaffold
  — it must offer every required card field and no other key — rather than
  grading its placeholders as a card.
- Catalog discovery: `pnpm skills:list`
- Designer evaluation run: `pnpm eval:designer`. Builds and renders candidate
  output with Vite, Playwright, and Chromium, so it needs a browser and is not
  part of `pnpm test`. It writes only to `.eval-runs/`, and exits non-zero when a
  gate fails at `critical` or `high`, or when a gate could not run. A `medium`
  failure is reported in full and exits zero.
- Paid judging run: `pnpm eval:judge --lane acceptance`. Judges the graded pairs
  from a designer run and is the only paid, nondeterministic entry point; it is
  never reachable from `pnpm test`. It requires a lane listed in the manifest's
  `judging.paid_lanes`, refuses a judge in the subject's provider family, and
  needs `EVAL_PRIVATE_PATH` for a held-out lane. Artifacts are lane-scoped: it
  expects, under `.eval-runs/<cycle>/<lane>/`, `<case>.baseline/` and
  `<case>.candidate/` per case, the same pair under `length-control.*` for the
  lane's length-matched control (named by `judging.length_control.<lane>`), and
  `calibration-labels.yml` for the human-scored subset. It exits non-zero when a
  gate blocks or any pair is inconclusive.
- Deterministic A/B: `pnpm eval:designer --compare`. Grades `<case>.baseline/` and
  `<case>.candidate/` for every case in the lane and prints the per-case move plus
  the regression ledger, without calling a judge. Free and offline apart from the
  browser, so it carries the iteration signal the development lane cannot buy.
- Cross-runtime portability run: `pnpm eval:designer --dual-runtime`. Runs the
  promoted skill on both pinned runtimes at high reasoning effort over one lane,
  runs the deterministic gates on both outputs, and writes a divergence report.
  Paid and nondeterministic, so it is never reachable from `pnpm test`. Neither
  runtime may write into `skills/` during the run.
- Promotion decision: `pnpm promote:designer`. Reads `report.json`,
  `judging.json`, and `promotion-approval.yml` from the lane named by
  `judging.promotion_lane`, refuses evidence judged on any other lane, verifies
  the judging report against its own hash before reading it, prints every refusal
  rather than the first, mutates nothing, and exits non-zero unless every gate
  and the human approval checklist pass. The approval record must name the
  `cycle_id`, `candidate_version`, and `judging_report_hash` it signed.
- Cited source liveness: `pnpm evals:links`. Requests each knowledge card's
  `source_url` and every link in a skill's source registry, reading the status
  code only — the body is never consumed — so a moved source is caught without
  ingesting any page. An access-controlled or rate-limited answer counts as
  unreachable, not dead, and only a real disagreement exits non-zero. Needs
  network, so it is not part of `pnpm test`; it runs on pull requests as its own
  non-blocking job so a slow third-party host cannot fail the deterministic
  gate.
- Definition of done: `pnpm test`
- Pre-publication gate: `pnpm release:check`

Do not weaken tests, skip a failing gate, or hand-edit generated dependency
state to make verification pass.
