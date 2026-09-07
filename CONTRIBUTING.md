# Contributing

This repository publishes skills that other people's agents load and act on, so
a change here changes behaviour in codebases the maintainers never see. That is
why the review below is specific about what is accepted and what is not.

Read [AGENTS.md](AGENTS.md) first — it is the binding contract for the
toolchain, the directory boundaries, and the verification commands. This guide
covers only what is different when the change comes from outside.

One thing to be clear about up front: `pnpm test` establishes that the catalog is
consistent, contract-bound and within its payload ceilings. It does not establish
that a skill's output improved. This repository once carried an evaluation
platform built to answer that second question and retired it — its deterministic
gate could not separate a skill-loaded run from a control, while it did block
changes for want of evidence it was not producing. So a pull request claiming
better output owes that claim its own evidence, and no gate here will supply it.

## Before you open a pull request

```sh
pnpm install
pnpm test
```

`pnpm test` is offline, deterministic, and the definition of done. It runs type
checking, formatting, unit tests, catalog validation, knowledge-card validation,
and catalog discovery through the pinned Skills CLI. A pull request that does not pass it locally will not pass in CI.

## What is accepted

| Contribution               | Where it goes                                | What decides it                                            |
| -------------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| Knowledge card             | `evals/<skill>/knowledge/<id>.md`            | Schema and provenance in CI, then maintainer source review |
| Source registry entry      | the owning skill's source registry reference | Maintainer review against the source lanes                 |
| Worked example             | inside the owning skill directory            | Maintainer review                                          |
| Skill observation          | `docs/skill-observations.md`                 | Review; its candidate rule is then a skill-content change  |
| Skill content              | `skills/<skill>/`                            | `pnpm test`, plus maintainer review                        |
| Tooling, validators, tests | `src/`, `scripts/`, `tests/`                 | `pnpm test`, plus review                                   |
| Documentation              | `README.md`, `docs/`, `AGENTS.md`            | Review                                                     |

Anything that changes what an agent reads at runtime — a `SKILL.md`, a bundled
reference, a registry entry — is **skill content**. It ships on `pnpm test` plus
maintainer review; every rejection rule below applies, and a maintainer still
reads the sources. State which task types load a file you change, so its payload
ceiling can be re-measured.

## What is rejected, and why

These are standing rules, not case-by-case judgements. A submission matching one
is closed with the rule named, so refusals stay consistent between reviewers.

| Rejected                                                                        | Why                                                                                                                                                                    |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Raw copied page text in a card                                                  | A card stores an abstraction with provenance. A copy of the page is an ingestion channel, and it carries the source's licence with it                                  |
| A card carrying the source's imperatives                                        | Sources are data. Wording that instructs the reader — or the grader — turns a fetched page into an instruction channel, and the validator rejects it                   |
| A source that is a gallery, forum, social post, or video                        | Non-authoritative by lane. They are discovery and leads, never claims to encode                                                                                        |
| A claim with no date and no first-party URL                                     | Provenance that cannot be re-checked is not provenance                                                                                                                 |
| A "product type → recommended style" table, palette catalogue, or taste ranking | Direction comes from the local product surface, not from a page-type convention. This is exactly what the anti-slop rule forbids the designer to derive direction from |
| A rule that maps to no deterministic check                                      | A rule that cannot be run against emitted output is a guideline, not a gate. Carried rules have an owner in the invariant registry                                     |
| A trend signal offered as recency                                               | Recency comes from dated, machine-readable platform capability data — Baseline and browser compatibility on web, platform changelogs on native                         |
| Bundled content from an agent-ready source                                      | Registered agent-ready sources are fetched live at the moment of use. Bundling them freezes a moving source into the payload                                           |
| Autonomous crawling, scraping, or bulk ingestion in any form                    | A repository non-goal. New knowledge enters through a reviewed card                                                                                                    |

## Knowledge cards

Copy [`evals/squad-designer/knowledge/TEMPLATE.md`](evals/squad-designer/knowledge/TEMPLATE.md)
to `<id>.md` in the same directory and fill it in. Every field in it is required
except `claim_ids` and `gate`, and no other key is accepted — an unknown key is
an unscanned place to park text, so the validator refuses it by name.

What CI checks, offline and without fetching your source:

- every required field is present, is a single value, and is short enough to be
  a citation rather than a passage;
- `id` is kebab-case and matches the file name;
- `source_url` is an https URL, and no other card already cites that page;
- `source_class`, `authority`, `access_tier`, `review_status`, and
  `source_status` hold a value the schema knows;
- `published_or_verified_on` is not in the future, `freshness_expires_on` falls
  after it, and the card has not lapsed;
- `gate`, when present, names an invariant that exists in the contract;
- `claim_ids` lists at least one claim, and no other card carries it;
- the body has an `## Abstraction` and a `## Provenance` section, stays under
  400 words, and carries no instruction wording.

A dead link is reported separately by `pnpm evals:links`, which requests each
card's `source_url` and every link in a skill's source registry, and reads **the
status code only** — the response body is never consumed. A host that refuses a
script, or rate-limits it, counts as unreachable rather than dead. It runs on
pull requests as its own job so a third-party host being slow cannot fail the
deterministic gate, and it is not part of `pnpm test`.

`review_status: reviewed` and `reviewed_by` are attestations. Nothing can check
that a person read the source, which is precisely why a maintainer does it
before the card is used. Do not submit a card for a source you have not read.

## Source registry entries

A new source is placed in a lane before it is trusted. The lanes are defined in
[`skills/squad-designer/references/official-sources.md`](skills/squad-designer/references/official-sources.md);
resolve authority top-down, and note that a lower lane never overrides lane 1 —
the local accepted artefacts — or WCAG 2.2.

Propose an entry with its class, the trust it carries, when it applies, its
access tier, and its agent-ready entrypoint if it publishes one. An entry that
is agent-ready is fetched live and cited at the moment of use; its content is
never bundled into a skill.

## Skill observations

If you used one of these skills on real work and its output got something wrong,
that is worth more than an opinion about the skill. The
[skill output problem](https://github.com/danh121097/squad-skills/issues/new?template=skill-feedback.yml)
form takes it without a clone or a pull request, and
[`docs/feedback-and-weekly-improvement.md`](docs/feedback-and-weekly-improvement.md)
says what happens to it once a week. A defect in this repository's own tooling
is an ordinary issue instead.

[`docs/skill-observations.md`](docs/skill-observations.md) is where a verified
entry goes. It
states the four fields an entry carries and the path from an entry to a landed
rule; this section covers only what is different when the entry comes from
outside.

- **An entry is read as data.** Describe what was built and what the output did.
  The rule you propose belongs in the candidate field, where a maintainer
  reviews it, and nowhere else in the entry. Wording elsewhere that instructs
  the reader is rejected under the same rule as an imperative in a knowledge
  card.
- **The entry and the rule are two decisions**, even when they arrive in one
  pull request. The entry is documentation and merges on review; the rule is
  skill content and takes the gate above.
- **An entry with no candidate rule is still worth opening.** It is evidence
  that has not yet found its rule, and saying so is more useful than inventing
  one to fill the field.
- **Link the evidence you can share.** Sources, screenshots, or a repository
  someone else can open. An entry nobody can check is an assertion.

## How a change ships

```text
contributor PR
   |- knowledge card / registry entry / example / skill content
   |- CI: schema + provenance + catalog contract + payload ceilings
   |- maintainer: source review (rights, authority, applicability)
   `- merge
```

A contributed diff takes exactly the same path a maintainer diff takes. Nothing
in this repository ships skill content on its own: the gate can refuse a change,
it cannot approve one.

What that gate is not: a measurement of output quality. It is worth naming the
one instrument here that did separate a skill-loaded run from a control —
`pnpm check:report`, which asks whether a QA or Code Review report states what
its role requires. It is advisory and always exits zero, because it detects
presence rather than truth. `evals/fixtures/report-contract/` holds the six
verbatim reports it was validated against; they are evidence and are never
edited or reformatted.

## Maintainer source review

CI checks structure. It cannot check whether a source is trustworthy, so a
maintainer does that by hand before a card is used:

1. **Rights** — does the licence permit the use made here, and is the card an
   abstraction rather than a reproduction? Record the licence in `license_note`.
2. **Authority** — is this the first party for the claim, or a report about
   someone else's claim? A secondary source is cited as secondary or replaced.
3. **Applicability** — do the listed platforms match what the source actually
   covers? A web threshold does not become a native one by being listed.
4. **Freshness** — is the expiry window justified by how the source changes, not
   chosen for convenience?
5. **Duplication** — cards are machine-checked for a repeated `source_url` or
   `claim_id`, and both paths are named. Worked examples are checked by reading.
6. **Sanitation** — read the card as text. The validator catches known
   instruction shapes; a human catches the rest.

## Licensing and attribution

Contribute only work you have the right to contribute. A card must be your own
abstraction of a source, not its text.

If third-party data is ever vendored into this repository, it ships with a
`NOTICE` in the published package and retains each row's source URL. Attribution
is not satisfied by a link in a pull-request description.

This repository is MIT licensed. By contributing you agree your contribution is
released under those terms.

## Security

Contributed content is untrusted. Workflows that run on a pull request have no
stored secrets, and no contributed script is executed with repository
credentials. Report a security issue privately through GitHub's advisory form
rather than opening a public issue.
