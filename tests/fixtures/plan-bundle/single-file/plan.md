---
title: Export button
description: Let an account owner download their invoices as CSV.
status: proposed
created: 2026-09-24
revision: 1
layout: single
---

# Export button

Nothing here has been accepted and nothing has run.

## Outcome

An account owner can download every invoice they can already see as one CSV file, without asking support.

## Acceptance criteria

- The billing page shows an export control to account owners and to nobody else.
- The downloaded file holds one row per invoice visible on the page, with the same totals.
- A request from a non-owner returns 403.

## Non-goals

**Deferred** — scheduled exports, until someone asks for a second export in a week.

## Phase 1 — CSV endpoint

`squad-backend` adds the owner-only export route and its authorization test.

## Phase 2 — Export control

`squad-frontend` adds the control and the download flow against the route from phase 1.
