---
id: apple-hig-minimum-hit-area
source_url: https://developer.apple.com/design/human-interface-guidelines/layout
source_class: vendor-documentation
authority: first-party
published_or_verified_on: 2026-08-28
freshness_expires_on: 2027-08-28
applicability: [web, adaptive, react-native, flutter, swiftui]
access_tier: agent-ready
license_note: 'Apple developer documentation; cited for its stated minimum, not reproduced.'
review_status: reviewed
reviewed_by: Harry Nguyen
source_status: live
claim_ids: [apple-44pt-hit-area]
gate: INV-TOUCH-001
---

# Apple minimum hit area

## Abstraction

Apple platforms specify a 44x44pt minimum hit area for any control a finger
operates. The number governs the hit area, not the drawn glyph: a 20pt icon
inside 44pt of padding satisfies it, and a 44pt icon whose tappable region is
clipped to its bounds does not.

This is stricter than the WCAG 2.2 floor of 24 CSS pixels, so a layout that
satisfies Apple also satisfies the standard.

## Gate mapping

`INV-TOUCH-001` measures the rendered bounding box of every interactive element
against the platform minimum of 44px. It runs on the render-gated platforms only
— web and adaptive — because a hit area has to be rendered to be measured; the
native tiers compile the output and never see one.

## Provenance

Apple Human Interface Guidelines, Layout. Verified on the date above. Freshness
runs one year because platform guidance is revised on the annual OS cycle.
