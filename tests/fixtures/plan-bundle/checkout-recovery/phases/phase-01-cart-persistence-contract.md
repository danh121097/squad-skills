---
phase: 1
title: Cart persistence contract
status: accepted
revision: 2
depends_on: []
roles: [squad-backend]
inputs:
  - ../references/domain-model.md
  - ../adr/adr-001-store-carts-server-side.md
  - ../artifacts/product-contract.md
---

# Phase 01 — Cart persistence contract

## Context

Carts live in the browser today, so an abandoned one leaves nothing behind to recover. The
[domain model](../references/domain-model.md) names what a cart is; the
[product contract](../artifacts/product-contract.md) names what recovery must be able to promise about it.

## Objective and deliverables

A server-side cart with a stable id, and the read and write contract the later phases consume.

## Roles

| Role            | Deliverable                     | Hands off                         |
| --------------- | ------------------------------- | --------------------------------- |
| `squad-backend` | Cart table, contract, migration | The accepted contract to phase 02 |

## Prerequisites and blocking decisions

[ADR 001](../adr/adr-001-store-carts-server-side.md) is accepted. Nothing else blocks this phase.

## Work

1. Model the stored cart and its expiry.
2. Publish the read and write contract, including the error shape.
3. Write the forward and reverse migration.

## Acceptance evidence

- [x] A cart survives a browser restart and is readable by id
- [x] The migration reverses on a copy of production-shaped data
- [x] QA reported PASS and Code Review reported APPROVE

## Risks

A cart schema that assumes one currency would have to be reopened by phase 03. Recorded, not designed around.

## Handoff

The accepted contract and its revision, to phase 02.
