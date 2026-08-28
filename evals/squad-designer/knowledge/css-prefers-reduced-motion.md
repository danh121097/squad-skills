---
id: css-prefers-reduced-motion
source_url: https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-motion
source_class: standard
authority: standards-body
published_or_verified_on: 2026-08-28
freshness_expires_on: 2027-08-28
applicability: [web, adaptive]
access_tier: agent-ready
license_note: 'W3C Software and Document Notice and License; the behavior is a fact, not reused text.'
review_status: reviewed
reviewed_by: Harry Nguyen
source_status: live
claim_ids: [reduced-motion-removes-or-replaces]
gate: INV-MOTION-001
---

# Reduced-motion preference

## Abstraction

`prefers-reduced-motion: reduce` asks for the removal of motion that moves
things through space, not the removal of all feedback. The correct response is
to replace displacement with a cross-fade or an instant state change, so the
transition still communicates that something changed.

Shortening a slide is not a response. A 300ms translate played at 150ms is the
same animation for the viewer the preference exists to protect.

## Gate mapping

`INV-MOTION-001` re-renders under the reduce preference and fails any surviving
animation longer than 40ms whose animated properties are anything other than
opacity or visibility.

## Provenance

Media Queries Level 5, the `prefers-reduced-motion` feature. Verified against
the W3C Working Draft on the date above; freshness runs one year because the
feature sits on a draft track even though the behavior is widely shipped.
