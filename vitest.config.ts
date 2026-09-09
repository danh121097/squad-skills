import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // `.eval-runs/` holds the artifacts a judging cycle writes: baseline and
    // candidate output produced by a model, under names the cycle chooses. The
    // default glob collected them as this repository's own tests, so a run that
    // happened to produce `something.test.ts` failed `pnpm test` with every real
    // test passing — and worse, would have executed model-produced code inside
    // the gate that is supposed to be judging it.
    // `.claude/` is the same hazard from a different direction. It is consumer
    // install output, gitignored wholesale and tracked in no commit, and a
    // worktree under `.claude/worktrees/` is a full checkout of this repository
    // on another branch — the default glob collected its copy of this suite and
    // the gate reported roughly double this repository's own suite, another branch's
    // failures reading as this one's. Nothing here is ours to run.
    exclude: [...configDefaults.exclude, '.eval-runs/**', '.claude/**'],
    // Vitest's 5s default is a unit-test figure, and most of this suite is not
    // one: the catalog and manifest validators read every skill, reference and
    // manifest on disk, and the CLI tests spawn real processes. Adding four
    // subprocess tests was enough contention to time out three unrelated files
    // that had been passing, which made the definition-of-done gate report a
    // failure no assertion produced. A timeout here guards against a hang; the
    // budget that actually governs cost is `skill-payload-ceilings.ts`.
    testTimeout: 30_000,
  },
});
