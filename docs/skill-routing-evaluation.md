# Evaluate skill routing

Routing trials measure the first squad skill selected from discovery metadata.
They do not measure delivery quality. Use the preparation and evidence format in
[skill evaluation](skill-evaluation.md).

The 20 fixed queries in `src/catalog/skill-routing-evaluation-cases.ts` contain
10 train and 10 validation cases. Each split has eight positive cases, one per
side of four near-miss pairs, and two no-skill negatives:

| Pair                | Distinction                                                    |
| ------------------- | -------------------------------------------------------------- |
| Frontend / Designer | Accepted UI integration / open interaction or layout decisions |
| Product / Team      | Missing scope or acceptance / accepted work across roles       |
| Fix / Backend       | Failure with an unproven cause / a new server feature          |
| QA / Code Review    | Behavioral verification / implementation inspection            |

English and Vietnamese prompts include direct-work and no-delegation constraints.
Negative cases cover a translation, Git explanation, typo and wording question.
Mobile and DevOps have output fixtures; this routing set does not claim positive
activation coverage for every role. Their entrypoints still count as incorrect
activations when another role or no skill is expected.

Expose the complete squad discovery catalog in a fresh context, with unrelated
skill packs disabled locally. Follow each packet's evaluator-only `setup.txt`:
allow read-only scouting, then stop at the first squad entrypoint read or the
first substantive answer/edit without one. For a trivial task, allow the requested
answer or edit. Retain the whole skill-read trace. The worker receives only its
prompt, workspace and discovery metadata, never a rubric or the split label.

Tune descriptions using train cases. Freeze the candidate before running the
validation cases; changing a description afterward requires a new held-out set.
`split` stays in packet metadata and summary output and participates in fixture
identity. Keep prompts, fixtures, environment and model settings identical across
arms, using the repeated-run protocol from the main evaluation guide. A separate
coexistence trial can test competition with other installed skill packs.

A passing trial needs both reviewer-graded criteria and reading evidence: the
expected entrypoint is required, all other squad entrypoints are forbidden, and
no-skill cases forbid every squad entrypoint. Preparation and unit tests verify
these contracts without running a model. Empty `loads` yield zero declared payload
words, not zero observed tokens; actual usage remains a runtime measurement.
