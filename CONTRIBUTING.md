# Contributing

This repository publishes skills that other people's agents load and act on, so
a change here changes behaviour in codebases the maintainers never see. That is
why contributions are measured rather than merged on agreement, and why the
review below is specific about what is accepted and what is not.

Read [AGENTS.md](AGENTS.md) first — it is the binding contract for the
toolchain, the directory boundaries, and the verification commands. This guide
covers only what is different when the change comes from outside.

If you have not seen the evaluation apparatus before, read
[docs/evaluation-and-governance.md](docs/evaluation-and-governance.md) once. It
explains the lanes, why one of them is held out, what the deterministic
invariants do and do not prove, how judging is protected against its own known
biases, why a promotion can be refused, and what the payload budget means for a
change. Nothing below assumes you have read it, but every rule below makes more
sense with it.

## Before you open a pull request

```sh
pnpm install
pnpm test
```

`pnpm test` is offline, deterministic, and the definition of done. It runs type
checking, formatting, unit tests, catalog validation, the evaluation contract,
and catalog discovery through the pinned Skills CLI. A pull request that does not pass it locally will not pass in CI.

## What is accepted

| Contribution               | Where it goes                                         | What decides it                                               |
| -------------------------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| Knowledge card             | `evals/<skill>/knowledge/<id>.md`                     | Schema and provenance in CI, then maintainer source review    |
| Source registry entry      | the owning skill's source registry reference          | Maintainer review against the source lanes                    |
| Worked example             | inside the owning skill directory                     | Maintainer review, then the owning skill's tier               |
| Development eval case      | `evals/<skill>/case-manifest.yml`, `development` lane | Schema in CI, then an evaluation cycle                        |
| Skill observation          | `docs/skill-observations.md`                          | Review; its candidate rule then takes the owning skill's tier |
| Skill content              | `skills/<skill>/`                                     | The owning skill's tier: eval-covered or review-only          |
| Tooling, validators, tests | `src/`, `scripts/`, `tests/`                          | `pnpm test`, plus review                                      |
| Documentation              | `README.md`, `docs/`, `AGENTS.md`                     | Review                                                        |

Anything that changes what an agent reads at runtime — a `SKILL.md`, a bundled
reference, a registry entry — is **skill content**, and none of it merges on
review agreement alone. Which evidence it needs is set by the tier its skill is
in. [AGENTS.md](AGENTS.md) defines the two tiers, **eval-covered** and
**review-only**, and how a skill's tier is derived.

- **Eval-covered.** The change is labelled `needs-evaluation-cycle` and takes
  [the evaluation path](#the-evaluation-path) below.
- **Review-only.** The change ships on `pnpm test` plus maintainer review, and
  the pull request says so. Every rejection rule below still applies, and a
  maintainer still reads the sources.

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
| A change to the `acceptance` or `calibration` lane                              | Those lanes are held out and private. See [Held-out data](#held-out-data)                                                                                              |
| A skill-content change to an eval-covered skill with no evaluation              | Merging on taste is what the evaluation contract exists to prevent                                                                                                     |
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

## Development eval cases

A case in the `development` lane is public and carries its body. Give it a real
request, an evidence packet a run could actually be given, the invariants it
should be held to, and the source decisions you expect a good answer to make. A
case whose answer no candidate could get wrong measures nothing.

## Skill observations

If you used one of these skills on real work and its output got something wrong,
that is worth more than an opinion about the skill.
[`docs/skill-observations.md`](docs/skill-observations.md) is where it goes. It
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
  skill content and takes its skill's tier, exactly as above.
- **An entry with no candidate rule is still worth opening.** It is evidence
  that has not yet found its rule, and saying so is more useful than inventing
  one to fill the field.
- **Link the evidence you can share.** Sources, screenshots, or a repository
  someone else can open. An entry nobody can check is an assertion.

## The evaluation path

```text
contributor PR
   |- knowledge card / registry entry / example / development case
   |- CI: schema + provenance + payload budget + drift + isolation checks
   |- maintainer: source review (rights, authority, applicability)
   `- evaluation cycle -> promotion decision (acceptance set stays private)
```

[docs/evaluation-and-governance.md](docs/evaluation-and-governance.md) walks
through each stage of this path and the refusals the last one can produce.

This path is what eval-covered skill content takes. Its content is compared
against the frozen baseline, graded by deterministic gates, and only then
judged. Promotion needs a human to review the diff, the transcripts, the source
provenance, and the screenshots, and to record that attestation; nothing in this
repository can promote on its own. A contributed diff takes exactly the same
path a maintainer diff takes.

## Held-out data

The acceptance and calibration lanes are private. They exist so that a change
cannot be tuned against the set that judges it, which is a live risk precisely
because contributions are open.

- Their bodies live in a separate private repository, addressed through an
  environment variable, and appear here as an id and a content hash only.
- No workflow may name that variable, run on `pull_request_target`, or read a
  stored secret. All three are asserted by `pnpm validate:evals`, so the
  isolation is a failing gate rather than a promise.
- Do not add a case, a fixture, or a log line that would reveal a held-out case.
  If you believe you have seen one, report it privately rather than in an issue.

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
stored secrets and no access to the held-out set, and no contributed script is
executed with repository credentials. Report a security issue privately through
GitHub's advisory form rather than opening a public issue.
