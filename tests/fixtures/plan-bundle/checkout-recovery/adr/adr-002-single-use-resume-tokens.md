---
adr: 2
title: Single-use resume tokens
status: accepted
date: 2026-02-12
phase: 2
---

# ADR 002 — Single-use resume tokens

**Context.** A resume link travels through email and may be forwarded.

**Decision.** Issue a signed token redeemable once, bound to one cart.

**Consequences.** A forwarded link cannot open someone else's cart; a shopper who reopens the email needs a
second link.
