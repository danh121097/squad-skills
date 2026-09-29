# Design, platform, and lifecycle gates

Read for material mobile UI/UX work or when offline, lifecycle, permissions, deep links, push, biometrics or
IAP is affected.

## Design gate

The designer hands over presentational component code, not a written spec. Wire behavior into that code
instead of rebuilding it: state, data fetching, API integration, routing, forms submission, and platform
lifecycle stay with the build role, so navigation, offline, and lifecycle behavior are yours to add without
altering the visual language.

Motion ownership follows authorship: whoever writes the animation code owns its lifecycle scoping, teardown,
and reduced-motion fallback. Verify designer-authored motion on a real device; re-own it only when you
rewrite it.

- Trigger `squad-designer` only for design decisions the user's material and the existing system leave open:
  new UX, adaptive behavior, interaction, accessibility, states, or cross-screen component language. Logic-only
  work, narrow bugs, screens the material covers, exact local patterns and a single build owner with no
  design-system change skip it.
- Without Designer, build the presentational components inline — hierarchy, navigation surface, states,
  platform adaptation and accessibility — before wiring behavior into them. Report a visual or interaction gap
  back to the Designer stage instead of redesigning inside the feature.

## Platform and lifecycle model

Specify applicable behavior for:

- first launch, foreground/background, process death, restore and session expiry;
- keyboard, safe areas/insets, orientation, dynamic type/font scale and screen sizes;
- offline, slow network, retry, cancellation, stale cache, conflict resolution and partial sync;
- permission denied/restricted/permanently denied and settings recovery;
- deep links from cold/warm start, invalid/expired links and auth redirects;
- push foreground/background/tap paths, duplication and stale destination;
- biometric unavailable/changed/locked-out and secure fallback;
- purchase pending/cancelled/restored/failed and server-side entitlement validation.
