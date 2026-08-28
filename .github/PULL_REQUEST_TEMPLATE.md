## What this changes

<!-- One paragraph. What behaviour differs after this merges, and for whom. -->

## Type of change

<!-- Tick every box that applies. Anything an agent reads at runtime is skill content. -->

- [ ] Knowledge card
- [ ] Source registry entry
- [ ] Worked example
- [ ] Development eval case
- [ ] Skill content (`skills/**`) — **requires an evaluation cycle**
- [ ] Tooling, validator, or test
- [ ] Documentation

## Checklist

- [ ] I read [CONTRIBUTING.md](../CONTRIBUTING.md) and this change is not on the
      rejected list.
- [ ] `pnpm test` passes locally on Node 22.20 or newer with the pinned pnpm.
- [ ] I did not weaken, skip, or narrow a test or gate to make it pass.
- [ ] This pull request contains no held-out case body, and nothing that reveals
      one.
- [ ] No workflow change here names the private-store variable, adds
      `pull_request_target`, or reads a stored secret.

## If this adds a knowledge card

- [ ] I read the source myself; `reviewed_by` names me.
- [ ] The body is my abstraction of the claim, not the source's text, and
      carries none of its imperatives.
- [ ] `published_or_verified_on` is the day I read it, and the freshness window
      is justified in the `## Provenance` section.
- [ ] `gate` names an invariant that exists, or the card carries no gate.

## If this changes skill content

- [ ] I understand this cannot merge on review alone: it is labelled
      `needs-evaluation-cycle` and runs through the same evaluation and human
      promotion approval a maintainer change does.
- [ ] I stated which task types load the changed file, so the payload budget can
      be re-measured.

## Evidence

<!--
Paste the tail of `pnpm test`. For skill content, say what you expect to improve
and how a run would show it — a claim that output is better is not evidence.
-->
