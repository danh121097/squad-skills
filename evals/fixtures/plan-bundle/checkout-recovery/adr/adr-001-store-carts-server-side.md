---
adr: 1
title: Store carts server side
status: accepted
date: 2026-02-11
phase: 1
---

# ADR 001 — Store carts server side

**Context.** A browser-only cart leaves nothing to recover.

**Decision.** Persist the cart server side, keyed by a stable id.

**Consequences.** Recovery becomes possible; carts now need an expiry and a privacy answer. The number in
this filename is this decision's identity, not its position in the running order.
