---
id: compositor-only-animation-properties
source_url: https://web.dev/articles/animations-guide
source_class: vendor-documentation
authority: secondary
published_or_verified_on: 2026-08-28
freshness_expires_on: 2027-08-28
applicability: [web, adaptive]
access_tier: agent-ready
license_note: 'web.dev article, CC BY 4.0; the principle is abstracted, the text is not reproduced.'
review_status: reviewed
reviewed_by: Harry Nguyen
source_status: live
claim_ids: [compositor-safe-properties, layout-thrashing-properties]
gate: INV-ANIMCOST-001
---

# Compositor-only animation properties

## Abstraction

`transform` and `opacity` are animated by the compositor without re-running
layout or paint. Animating geometry instead — width, height, top, left, margin,
padding — forces the engine to recompute layout every frame, so the same motion
costs far more and degrades first on the slowest device in the audience.

The property choice is a correctness question, not a tuning one: a fast machine
hides the cost without removing it, which is why this is checked statically
rather than by timing.

## Gate mapping

`INV-ANIMCOST-001` reads animated properties from computed transition and
keyframe declarations and fails any animation on the layout path. Frame timing
is not measured at all: a wall-clock threshold would make the same artifact pass
or fail depending on the machine it ran on, so the gate proves the property
choice and claims nothing about observed cost.

## Provenance

web.dev, animations guide. Classified `secondary`: it is editorial writing about
the rendering pipeline, not a vendor documenting its own product the way the
Apple and Material cards do, and the underlying behavior is specified elsewhere.
Verified on the date above. Freshness runs one year; the rendering-pipeline
behavior is stable, the article is not.
