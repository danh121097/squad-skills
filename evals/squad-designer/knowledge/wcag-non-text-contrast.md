---
id: wcag-non-text-contrast
source_url: https://www.w3.org/TR/WCAG22/#non-text-contrast
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
claim_ids: [ui-component-contrast-threshold]
gate: INV-CONTRAST-001
---

# Non-text contrast

## Abstraction

The visual boundary that tells a viewer where a control is — its border, its
filled shape, its focus ring — must reach 3:1 against what sits behind it. A
control whose only edge is a hairline one shade off the surface is invisible to
a viewer who needs contrast, whatever its label measures.

This is the check a token audit usually misses: the text inside a button gets
reviewed, the button's own outline does not.

## Gate mapping

`INV-CONTRAST-001` samples the borders of interactive components — at least 1px
— against the parent's effective background and holds them to 3:1, separately
from the text samples. Two exclusions come straight from the criterion: an
inactive component is exempt, and a border on a non-component element is
decoration rather than the visual information that identifies a control, so a
card divider or a hairline rule is not sampled.

## Provenance

WCAG 2.2 Success Criterion 1.4.11 (Non-text Contrast), Level AA. Verified
against the W3C Recommendation on the date above.
