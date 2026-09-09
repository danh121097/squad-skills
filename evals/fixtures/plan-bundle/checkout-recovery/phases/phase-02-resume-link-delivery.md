---
phase: 2
title: Resume link delivery
status: in-progress
revision: 2
depends_on: [1]
roles: [squad-backend, squad-devops]
approvals:
  - id: production-sending-domain
    status: pending
inputs:
  - ../artifacts/handoff-to-phase-02.md
  - ../adr/adr-002-single-use-resume-tokens.md
  - ../references/technical-stack.md
---

# Phase 02 — Resume link delivery

## Context

Phase 01 handed over a stored cart; see [the handoff](../artifacts/handoff-to-phase-02.md). The
[technical stack](../references/technical-stack.md) records the email provider already in use.

## Objective and deliverables

A single-use resume token, the email that carries it, and the delivery path that gets it sent.

## Roles

| Role            | Deliverable                        | Hands off                       |
| --------------- | ---------------------------------- | ------------------------------- |
| `squad-backend` | Token issue and redeem endpoints   | The redeem contract to phase 03 |
| `squad-devops`  | Sending domain, SPF and DKIM, logs | A verified sending path         |

## Prerequisites and blocking decisions

[ADR 002](../adr/adr-002-single-use-resume-tokens.md) is accepted. The production sending domain is an open
approval; phase 02 cannot be accepted while it is pending, and the choice is the user's rather than either
role's.

## Work

1. Issue a signed single-use token bound to one cart.
2. Redeem it once, and answer a second use with the empty-checkout explanation.
3. Configure and verify the sending domain.

## Acceptance evidence

- [x] A redeemed token is refused on second use
- [ ] A message reaches a real inbox from the production sending domain
- [ ] QA PASS, then Code Review APPROVE

## Risks

A sending domain rejected at review costs a phase, not a line. It is why the approval is listed rather than
assumed.

## Handoff

The redeem contract and its revision, to phase 03.
