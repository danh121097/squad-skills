# Repository instructions

## Toolchain

- Use Node.js 22.20 or newer.
- Use the pnpm version pinned in `package.json` for every dependency and script
  operation. Do not use npm, Yarn, or Bun, and do not create their lockfiles.
- Update `pnpm-lock.yaml` only through pnpm dependency commands.

## Change boundaries

- Preserve both supported distribution paths: the public GitHub source
  `danh121097/squad-skills` through `npx skills add`, and the public
  `squad-skills` npm CLI. Keep the npm CLI a thin adapter over the official
  `skills` runtime instead of reimplementing discovery or installation.
- Package only `dist/`, `bin/`, `skills/`, and `README.md`. Build the TypeScript
  CLI before packaging and keep npm-installed skills independent from temporary
  package-cache symlinks.
- Treat `skills/*/SKILL.md` and each skill's bundled files as the public product.
  Preserve their relative paths because the Skills CLI copies the whole skill
  directory during installation.
- Keep new skills at `skills/<kebab-case-name>/SKILL.md`. The YAML `name` must
  match the directory, and `description` must state what the skill does and when
  to use it.
- Keep references and other support files inside their owning skill directory.
  Cross-skill relative links are rejected by the validator.
- Do not configure CI to ignore Markdown changes. Skill payloads are Markdown,
  so every `SKILL.md` change must pass the repository gate.
- Keep durable user guidance in `README.md` or `docs/`. `plans/` is ignored local
  execution state and must not become product authority.

## Workflow

1. Read `README.md`, `docs/installation.md`, and every affected `SKILL.md` before
   editing.
2. Keep changes within the owning skill or validator boundary. Do not rewrite
   unrelated skills during tooling or documentation work.
3. Add or update the lowest-level Vitest case when validator behavior changes.
4. Run the focused command while iterating, then the full gate before reporting
   completion.

## Verification

- Focused unit test: `pnpm test:unit tests/skill-validator.test.ts`
- Catalog contract: `pnpm validate`
- Catalog discovery: `pnpm skills:list`
- Definition of done: `pnpm test`
- Pre-publication gate: `pnpm release:check`

Do not weaken tests, skip a failing gate, or hand-edit generated dependency
state to make verification pass.
