---
# Copy this file to `<id>.md` in this directory and replace every value.
# `pnpm validate:evals` checks this scaffold for shape only; a filled-in copy is
# checked as a card. Every field below is required except `claim_ids` and
# `gate`, and no other key is accepted.
id: <kebab-case-id, identical to the file name without .md>
source_url: <https URL of the first-party page carrying the claim>
source_class: <standard | vendor-documentation | platform-changelog | capability-data>
authority: <standards-body | first-party | secondary>
published_or_verified_on: <YYYY-MM-DD, the day a person read the source>
freshness_expires_on: <YYYY-MM-DD, the day this claim must be re-read>
applicability: [<all | web | adaptive | react-native | flutter | swiftui | compose>]
access_tier: <agent-ready | human-only | paywalled>
license_note: <the source licence and why quoting it here is permitted>
review_status: reviewed
reviewed_by: <the person who read the source, not the tool that found it>
source_status: live
claim_ids: [<kebab-case-claim>]
gate: <INV-...-001, an invariant id from ../eval-contract.md>
---

# <Card title>

## Abstraction

State the claim in your own words: what the source establishes, and what
constrains it. Keep the whole body under 400 words — above that a card stops
being an abstraction and becomes a copy of the page.

Say what the claim binds. A threshold that applies to a rendered result is not
the same claim as one that applies to a declared value, and the difference is
what a gate has to implement.

Never paste the source's own text, and never carry its imperatives. A source is
evidence; a card that repeats "you must…" turns a fetched page into an
instruction channel and is rejected.

## Gate mapping

Name the invariant this card backs and say what it measures. Delete this section
when the card carries no `gate`, and delete the `gate` field with it — a card
pointing at a gate that does not exist reads as coverage while covering nothing.

## Provenance

Name the document, its section, and its status: which standard, which version,
which success criterion or which release. Then justify the freshness window —
why this claim is expected to hold until `freshness_expires_on`, and what would
end it early.
