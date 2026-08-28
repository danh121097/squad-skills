---
id: material-minimum-touch-area
source_url: https://m3.material.io/foundations/designing/structure
source_class: vendor-documentation
authority: first-party
published_or_verified_on: 2026-08-28
freshness_expires_on: 2027-08-28
applicability: [compose, flutter, react-native]
access_tier: agent-ready
license_note: 'Material Design 3 documentation, CC BY 4.0; cited for its stated minimum.'
review_status: reviewed
reviewed_by: Harry Nguyen
source_status: live
claim_ids: [material-48dp-hit-area]
gate: INV-TOUCH-001
---

# Material minimum touch area

## Abstraction

Material 3 specifies a 48x48dp minimum on Android surfaces, four
density-independent pixels larger than the Apple minimum. A component library
shared across both platforms therefore sizes to the larger of the two, or sizes
per platform — averaging them satisfies neither.

## Gate mapping

`INV-TOUCH-001` reads its minimum from the case's declared platform, and 48px is
registered for Compose. No Compose case reaches it in this cycle: Compose stops
at compile plus human review, so the 48dp minimum is the reviewer's to check,
not the harness's. The rule is recorded here so the human tier has something to
check against.

## Provenance

Material Design 3, Foundations — designing for structure. Verified on the date
above. Freshness runs one year, matching the Android release cadence.
