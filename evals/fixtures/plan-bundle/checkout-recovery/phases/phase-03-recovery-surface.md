---
phase: 3
title: Recovery surface
status: proposed
revision: 1
depends_on: [2]
roles: [squad-designer, squad-frontend]
inputs:
  - ../references/ui-ux-direction.md
  - ../artifacts/frontend-feasibility.md
---

# Phase 03 — Recovery surface

## Context

A returning shopper needs somewhere to land. The
[UI and UX direction](../references/ui-ux-direction.md) records what the storefront already looks like, and
the [frontend feasibility note](../artifacts/frontend-feasibility.md) records what the current router can do.

## Objective and deliverables

The screen a resume link opens, in both the restored and the expired case.

## Roles

| Role             | Deliverable                              | Hands off                      |
| ---------------- | ---------------------------------------- | ------------------------------ |
| `squad-designer` | The presentational components and states | Components to `squad-frontend` |
| `squad-frontend` | Routing, redeem call, error handling     | The wired surface to QA        |

## Prerequisites and blocking decisions

Phase 02's redeem contract is accepted. Whether the surface is a page or a modal is open and owned by
`squad-designer`.

## Work

1. Design the restored, expired and already-used states.
2. Wire the redeem call and its error shape.
3. Verify keyboard and screen-reader behavior.

## Acceptance evidence

- [ ] All three states render from real responses
- [ ] The expired state explains what happened and offers a next step
- [ ] QA PASS, then Code Review APPROVE

## Risks

An expired-state design that reads as an error page loses the shopper the feature exists to keep.

## Handoff

The wired surface to QA, with the states it can be exercised in.
