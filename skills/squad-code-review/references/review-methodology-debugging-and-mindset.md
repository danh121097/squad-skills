# Review methodology, debugging, and mindset

Use for any final review, especially AI-assisted code, broad diffs, ambiguous specs or disputed findings.

## Two-stage review

1. **Spec compliance:** compare request/plan/acceptance to behavior and diff. Identify omissions, scope drift,
   contract changes and user decisions. Do not begin taste/style review while requirements fail.
2. **Production quality:** inspect correctness, security, compatibility, performance, operations,
   maintainability and evidence using the relevant domain references.

Then run fresh verification appropriate to risk. QA PASS is evidence input, not permission to rubber-stamp.

## Blast-radius tracing

Start from changed public behavior and follow callers/consumers, state/data flow, permissions, caches,
events, migrations/config, deploy/rollback and tests. Search semantic siblings for asymmetric updates.
Review added/deleted/renamed paths and generated files, not only edited code hunks.

## Defect verification

For each suspected issue:

1. State exact input/state/environment triggering it.
2. Trace code/contract to incorrect outcome.
3. Run narrow repro/test/static check or authoritative docs lookup where cheap.
4. Confirm impact and affected scope.
5. Propose smallest cause-aligned remediation and regression evidence.

If evidence remains incomplete, phrase as question/NEEDS_EVIDENCE; do not inflate certainty. Reject abstract
concerns contradicted by fresh tests/source unless new evidence exists.

## AI-assisted code risks

Do not trust polished comments, broad try/catch, placeholder fallback, generated tests or invented APIs.
Check imports/dependencies/version, TODO/mock/fake data, skipped branches, happy-path-only state, swallowed
errors, unbounded resources, incorrect async/lifecycle cleanup, security boundary and unsupported claims.

## Reviewer mindset

- Protect users/system/contracts, not author comfort or reviewer cleverness.
- Technical evidence beats consensus and style preference.
- Respect explicit user decisions; surface trade-offs before proposing reversal.
- Review within requested scope but trace real blast radius.
- One root cause produces one finding with affected locations, not repeated noise.
- Prefer repository idioms; do not demand personal architecture.
- A no-finding review still reports scope, checks and residual risk.
- Advisory boundary matters: reviewer does not quietly fix what it is judging.

## Re-review

Verify the original finding, changed fix and neighboring regression. Material fixes return through QA before
final Review. Limit repeated cycles by escalating contradictory requirements/evidence, not by approving.
