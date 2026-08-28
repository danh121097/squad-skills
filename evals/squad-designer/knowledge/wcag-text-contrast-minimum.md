---
id: wcag-text-contrast-minimum
source_url: https://www.w3.org/TR/WCAG22/#contrast-minimum
source_class: standard
authority: standards-body
published_or_verified_on: 2026-08-28
freshness_expires_on: 2028-08-28
applicability: [all]
access_tier: agent-ready
license_note: 'W3C Software and Document Notice and License; the threshold is a fact, not reused text.'
review_status: reviewed
reviewed_by: Harry Nguyen
source_status: live
claim_ids: [text-contrast-threshold, large-text-threshold]
gate: INV-CONTRAST-001
---

# Text contrast minimum

## Abstraction

Rendered text must reach 4.5:1 against its effective background. Large text —
24px, or 18.66px when bold — drops to 3:1, because size restores legibility that
contrast would otherwise have to supply.

The threshold binds the rendered result, not the token that produced it. A pair
that measures 4.5:1 in isolation can land under 4.5:1 once opacity, an overlay,
or an inherited background composes behind it, so the measurement has to happen
on the composed pixel.

## Gate mapping

`INV-CONTRAST-001` samples every element carrying its own text, composes the
effective background by walking ancestors until a fully opaque layer is found,
and reports the measured ratio beside the ratio the element needed. Text inside
an inactive component is skipped, which the criterion's incidental exception
allows: a disabled control is meant to read as unavailable.

## Provenance

WCAG 2.2 Success Criterion 1.4.3 (Contrast Minimum), Level AA. Verified against
the W3C Recommendation on the date above. Freshness runs two years because a
Recommendation-track threshold does not move inside a minor revision, and a
WCAG 3 draft does not supersede it until it reaches Recommendation.
