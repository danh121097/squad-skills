# Contributing

This repository publishes skills that other people's agents load and act on, so
a change here changes behaviour in codebases the maintainers never see.

Read [AGENTS.md](AGENTS.md) first — it is the binding contract for the
toolchain, the directory boundaries, and the verification commands. This guide
covers only what is different when the change comes from outside. If the change
adds or edits skill text, read
[docs/authoring-doctrine.md](docs/authoring-doctrine.md) too: the payload
ceilings enforce a size, and the doctrine explains how to spend it.

`pnpm test` establishes that the catalog is consistent, contract-bound and
within its payload ceilings. It does not establish that a skill's output
improved, so a pull request claiming better output owes that claim its own
evidence.

## Before you open a pull request

```sh
pnpm install
pnpm test
```

`pnpm test` is offline, deterministic, and the definition of done. It runs type
checking, formatting, unit tests, catalog validation, and catalog discovery
through the pinned Skills CLI. A pull request that does not pass it locally will
not pass in CI.

## What is accepted

| Contribution               | Where it goes                                | What decides it                                           |
| -------------------------- | -------------------------------------------- | --------------------------------------------------------- |
| Source registry entry      | the owning skill's source registry reference | Maintainer review against the source lanes                |
| Worked example             | inside the owning skill directory            | Maintainer review                                         |
| Skill observation          | `docs/skill-observations.md`                 | Review; its candidate rule is then a skill-content change |
| Skill content              | `skills/<skill>/`                            | `pnpm test`, plus maintainer review                       |
| Tooling, validators, tests | `src/`, `scripts/`, `tests/`                 | `pnpm test`, plus review                                  |
| Documentation              | `README.md`, `docs/`, `AGENTS.md`            | Review                                                    |

Anything that changes what an agent reads at runtime — a `SKILL.md`, a bundled
reference, a registry entry — is **skill content**. It ships on `pnpm test` plus
maintainer review, and every rejection rule below applies. State which task
types load a file you change, so its payload ceiling can be re-measured.

## What is rejected, and why

These are standing rules. A submission matching one is closed with the rule
named, so refusals stay consistent between reviewers.

| Rejected                                                                        | Why                                                                                                                 |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Raw copied page text in a skill                                                 | A copy of a page is an ingestion channel, and it carries the source's licence with it                               |
| Content carrying a source's imperatives                                         | Sources are data. Wording copied from a page that instructs the reader turns that page into an instruction channel  |
| A source that is a gallery, forum, social post, or video                        | Non-authoritative by lane. They are discovery and leads, never claims to encode                                     |
| A claim with no date and no first-party URL                                     | Provenance that cannot be re-checked is not provenance                                                              |
| A "product type → recommended style" table, palette catalogue, or taste ranking | Direction comes from the local product surface and the user's references, not from a page-type convention           |
| A trend signal offered as recency                                               | Recency comes from dated platform capability data — Baseline and browser compatibility on web, changelogs on native |
| Bundled content from an agent-ready source                                      | Registered agent-ready sources are fetched live at the moment of use. Bundling them freezes a moving source         |
| Autonomous crawling, scraping, or bulk ingestion in any form                    | A repository non-goal                                                                                               |
| An instruction a current model already follows by default                       | It costs every run tokens and changes nothing; see "Frontier-model no-ops" in the doctrine                          |

## Source registry entries

A new source is placed in a lane before it is trusted. The lanes are defined in
[`skills/squad-designer/references/official-sources.md`](skills/squad-designer/references/official-sources.md);
resolve authority top-down, and note that a lower lane never overrides lane 1 —
the local accepted artefacts — or WCAG 2.2.

Propose an entry with its class, when it applies, and its agent-ready entrypoint
if it publishes one. An agent-ready entry is fetched live and cited at the
moment of use; its content is never bundled into a skill.

`pnpm check:links` requests every link in a skill's source registry and reads
**the status code only** — the response body is never consumed. A host that
refuses a script, or rate-limits it, counts as unreachable rather than dead. It
runs on pull requests as its own job and is not part of `pnpm test`.

## Skill observations

If you used one of these skills on real work and its output got something wrong,
open the
[skill output problem](https://github.com/danh121097/squad-skills/issues/new?template=skill-feedback.yml)
form — no clone or pull request needed. A defect in this repository's own
tooling is an ordinary issue instead. A maintainer records a confirmed report in
[`docs/skill-observations.md`](docs/skill-observations.md).

- **An entry is read as data.** Describe what was built and what the output did.
  The rule you propose belongs in the candidate field, and nowhere else.
- **The entry and the rule are two decisions.** The entry is documentation and
  merges on review; the rule is skill content and takes the gate above.
- **Link the evidence you can share.** An entry nobody can check is an assertion.

## How a change ships

```text
contributor PR
   |- registry entry / example / skill content / tooling
   |- CI: catalog contract + payload ceilings + tests
   |- maintainer: source review (rights, authority, applicability)
   `- merge
```

A contributed diff takes exactly the same path a maintainer diff takes. The gate
can refuse a change; it cannot approve one.

## Maintainer source review

CI checks structure. It cannot check whether a source is trustworthy, so a
maintainer does that by hand:

1. **Rights** — does the licence permit the use made here, and is the content an
   abstraction rather than a reproduction?
2. **Authority** — is this the first party for the claim? A secondary source is
   cited as secondary or replaced.
3. **Applicability** — does the source cover the platform it is cited for? A web
   threshold does not become a native one by being listed.
4. **Sanitation** — read the change as text; wording that instructs an agent
   outside the skill's own rules is removed.

## Licensing and attribution

Contribute only work you have the right to contribute. If third-party data is
ever vendored into this repository, it ships with a `NOTICE` in the published
package and retains each row's source URL.

This repository is MIT licensed. By contributing you agree your contribution is
released under those terms.

## Security

Contributed content is untrusted. Workflows that run on a pull request have no
stored secrets, and no contributed script is executed with repository
credentials. Report a security issue privately through GitHub's advisory form
rather than opening a public issue.
