---
title: Checkout recovery
description: Bring abandoned checkouts back with a resumable cart link.
status: proposed
created: 2026-02-11
revision: 3
---

# Checkout recovery

Nothing here has been accepted and nothing has run. Every phase is a proposal until the user says otherwise.

## Outcome

A shopper who leaves checkout can return to the same cart from an email link within 72 hours, without
signing in again on the device that started the order.

## Given

- The storefront and its Postgres database already exist and stay. Given by the user.
- Transactional email goes through the provider already in use. Given by the user.

## Non-goals

**Deferred** — push and SMS recovery, which wait until email recovery has a measured open rate.

**Refused** — recovering a cart across accounts. It is the same feature to build and a different one to be
accountable for, and no one asked for it.

## Acceptance criteria

1. A cart abandoned at the payment step is resumable from its emailed link for 72 hours and not after.
2. A resume link works once; a second use returns the shopper to an empty checkout with an explanation.
3. No resume link exposes a cart belonging to another session.

## Assumptions

- Carts are small enough to store whole rather than as an event log. Correct this and phase 01 changes.
- The existing email template system can carry one more transactional template.

## Open decisions

- Which sending domain production email uses. Owner: the user. Blocks phase 02.
- Whether the recovery surface is a page or a modal. Owner: `squad-designer`, inside phase 03.

## Phases

| Phase                                                                          | Roles                              | Result                                  | Depends on |
| ------------------------------------------------------------------------------ | ---------------------------------- | --------------------------------------- | ---------- |
| [01 — Cart persistence contract](phases/phase-01-cart-persistence-contract.md) | `squad-backend`                    | A stored cart with a stable id          | —          |
| [02 — Resume link delivery](phases/phase-02-resume-link-delivery.md)           | `squad-backend`, `squad-devops`    | A single-use link that reaches an inbox | 01         |
| [03 — Recovery surface](phases/phase-03-recovery-surface.md)                   | `squad-designer`, `squad-frontend` | The screen a returning shopper lands on | 02         |

## Decisions

- [ADR 001 — Store carts server side](adr/adr-001-store-carts-server-side.md)
- [ADR 002 — Single-use resume tokens](adr/adr-002-single-use-resume-tokens.md)

## Shared background

- [Domain model](references/domain-model.md)
- [Feature scope](references/feature-scope.md)
- [Technical stack](references/technical-stack.md)
- [UI and UX direction](references/ui-ux-direction.md)

## Artifacts

- [Product contract](artifacts/product-contract.md)
- [Acceptance traceability](artifacts/acceptance-traceability.md)
- [Test strategy](artifacts/test-strategy.md)
- [QA report](artifacts/qa-report.md)
- [Code review](artifacts/code-review.md)
- [Handoff to phase 02](artifacts/handoff-to-phase-02.md)
