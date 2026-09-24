# Maintainer notes

Why the rules in [AGENTS.md](../AGENTS.md) are shaped the way they are. Agents
working on the repository do not need this file to follow the rules; it exists
so a maintainer changing one knows what it was protecting against.

## Payload ceilings

Every skill has a ceiling, because a skill without one grows with nothing
objecting — skills once grew by 12% to 42% of their reference words in a single
upgrade that believed something else was bounding them.

The median loaded set is bounded rather than the total because that is what a
run costs, and bounding the total would tax the routing that keeps a run cheap.
The total regime exists for a skill added without a routing table.

Task types that name a missing reference, a reference no task type loads, or
fewer than three task types all fail validation: the first is a broken route,
the second is payload the median never counts, and the third is too few for a
median to mean anything.

## Symlinks and packaging

Archive semantics let a pack store a link's target and drop the link, so a
reference that resolves in the source tree can be missing from an installed
skill. A valid source tree is not evidence that the package preserved it, which
is why `pnpm pack:check` compares packaged bytes and resolves links again inside
the tarball.

## Generated agents

Copying a role's prose into its subagent definition would create a second
product surface bound by no ceiling and no clause, and the two would drift. The
upstream Skills CLI exposes no install hook and has no agent concept, which is
why `squad-skills agents` exists for the GitHub path.

## Handoffs are prose, not files

A file records a claim rather than the pass behind it, and a hook binds to one
runtime while the GitHub distribution path ships no `dist/`. So gates and their
sequence are bound as cross-skill clauses instead. Reopening this needs evidence
that a gate failed in a way a file-existence check would have caught.

A stage boundary is stated by both the sending and the receiving role: an edge
only its sender describes leaves the receiver no contract to refuse an
incomplete handoff, which is how every return edge stood before
`HANDOFF-REPRO-001`. `HANDOFF-*` members bind only entrypoints because both ends
of a boundary have to be readable without loading a reference. `PLAN-BUNDLE-*`
is its own family because the bundle schema is progressively disclosed.

## Gate tiers and loop caps

Until 2026-09, every slice — including a one-line change — ran QA and then Code
Review, a role invoked alone ran both itself, and nothing capped how many times
a gate could send work back. Only `squad-fix` stopped after three failed
attempts. Tiers make ceremony proportional to risk; the loop cap turns an
endless FAIL / CHANGES_REQUESTED cycle into a decision the user makes. Verify
evidence stays mandatory in every tier: the change removed procedure, not
proof.

## Quality bar and checklist

The quality bar is the copy a role runs in one piece before it hands over; a
pre-flight assembled from two files is one a run skips. The completion
checklist was cut to eight items so it points at the quality bar instead of
restating it.

## The greenfield fork

Product, frontend, backend, mobile and devops each name the existing-versus-
greenfield fork in their own words. A clause would force shared wording and cost
each the noun that makes the line actionable. It drifted once — frontend and
mobile carried the fork while backend and devops did not.

## Coverage

Coverage records what the test process executed, not what the tests verified.
`src/cli/cli.ts` is exercised end to end by subprocess tests and still measures
zero because coverage is collected in the child, so a floor would score the
faithful test below a shallow in-process one.

## Release job

The `release` job holds `contents: write`, so it runs only on a push to `main`
and never on a pull request a fork could open. It uses the runner's own `gh`
rather than a third-party action.

## Retired coordination features

The thread registry, `--allow-new-threads`, the `--delegate` alias, the
five-rung context ladder and the `ACK` / `BLOCKED` packets were removed in
2026-09. They were rarely used and cost every squad run payload; `BLOCKED` is now
a status of `RESULT`, and an acknowledgement is implicit.

## Payload ceiling history

Until 2026-09 each ceiling in `src/catalog/skill-payload-ceilings.ts` carried
the story of every raise: which clause or reference added how many words and
why that was median-path on purpose. Those notes were dropped when the catalog
was cut down and every ceiling was re-recorded; `git log -p` on that file still
holds them. What they taught stays true: a raise is stated as a reviewed number
in the same diff, and new content that only some tasks need is routed to those
tasks so the median does not move.
