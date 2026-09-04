import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // `.eval-runs/` holds the artifacts a judging cycle writes: baseline and
    // candidate output produced by a model, under names the cycle chooses. The
    // default glob collected them as this repository's own tests, so a run that
    // happened to produce `something.test.ts` failed `pnpm test` with every real
    // test passing — and worse, would have executed model-produced code inside
    // the gate that is supposed to be judging it.
    exclude: [...configDefaults.exclude, '.eval-runs/**'],
  },
});
