---
id: wcag-keyboard-operability
source_url: https://www.w3.org/TR/WCAG22/#keyboard
source_class: standard
authority: standards-body
published_or_verified_on: 2026-08-28
freshness_expires_on: 2028-08-28
applicability: [web, adaptive]
access_tier: agent-ready
license_note: 'W3C Software and Document Notice and License; the criterion is a fact, not reused text.'
review_status: reviewed
reviewed_by: Harry Nguyen
source_status: live
claim_ids: [keyboard-reachability, no-focus-trap]
gate: INV-KEYBOARD-001
---

# Keyboard operability

## Abstraction

Every control that answers a pointer must be reachable and operable from the
keyboard, and focus must be able to leave wherever it lands. A hover-revealed
action and a custom control built from a non-interactive tag are the two shapes
this usually fails in.

Reachability is a property of the rendered document, not of the markup an author
intended: source order, `tabindex`, and an `aria-hidden` ancestor all change it.

## Gate mapping

`INV-KEYBOARD-001` traverses real Tab presses in the browser and compares what
receives focus against the interactive elements found on the page. It checks
2.1.1 reachability only. Traversal stops when focus repeats or after a press
cap, which bounds the walk; it does not distinguish a trap from an ordinary
cycle back to the first control, so 2.1.2 is not machine-checked here.

## Provenance

WCAG 2.2 Success Criteria 2.1.1 (Keyboard) and 2.1.2 (No Keyboard Trap),
Level A. Verified against the W3C Recommendation on the date above.
