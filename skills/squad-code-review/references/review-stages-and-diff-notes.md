# Review stages and diff notes

Use for any final review, especially AI-assisted code, broad diffs, ambiguous specs or disputed findings.
Do not demand a different framework or style from an established repository.

## Two-stage review

1. **Implementation alignment:** compare the diff to the accepted contract, scope and QA evidence. Identify
   omissions, scope drift, contract changes and user decisions without replaying behavioral QA.
2. **Production quality:** inspect the review dimensions against the diff, using the relevant domain references.

QA evidence is input, not permission to rubber-stamp or a suite to replay. Search semantic siblings
for asymmetric updates, and review added, deleted, renamed and generated paths, not only edited hunks.

## AI-assisted code risks

Do not trust polished comments, broad try/catch, placeholder fallback, generated tests or invented APIs.
Check imports/dependencies/version, TODO/mock/fake data, skipped branches, happy-path-only state, swallowed
errors, unbounded resources, incorrect async/lifecycle cleanup, security boundary and unsupported claims.

## Diff notes

- Maintainability vocabulary (feature envy, shotgun surgery, speculative generality and the like) is a
  labelled heuristic, never a hard violation; a documented repository standard wins, and tooling-enforced
  rules are skipped.
- React memo/effect rules do not transfer mechanically to Vue/Svelte/Solid/Angular; review against the
  actual framework's reactivity and routing/data model.
- Generated files: review the source generator/schema/config and the rendered diff for contract/security
  impact; vendor code gets provenance/license/integration review, not a stylistic rewrite.
- Test code: judge whether tests reproduce implementation rather than behavior; assertion strength and
  missing cases are QA's.
