# Design, platform, and lifecycle gates

Read for material mobile UI/UX work or when offline, lifecycle, secure storage, deep links, push,
biometrics, IAP, accessibility, or performance is affected.

## Design gate

The designer hands over presentational component code, not a written spec: screens and components that
render in the app's framework, with props and slots left open for you to bind, plus the rationale behind
them. Wire behavior into that code instead of rebuilding it: state, data fetching, API integration,
routing, forms submission, and platform lifecycle stay with the build role, so navigation, offline, and
lifecycle behavior are yours to add without altering the visual language.

Motion ownership follows authorship: whoever writes the animation code owns its lifecycle scoping,
teardown, and reduced-motion fallback. Verify designer-authored motion against real device behavior;
re-own it only when you rewrite it.

- Treat accepted Figma as design intent and map it to existing app components and platform conventions.
- Trigger `squad-designer` for new/redesigned UX, missing responsive/adaptive behavior, interaction,
  accessibility, states, or cross-screen component language.
- Skip Designer for logic-only work, narrow bugs, complete accepted designs, and exact local patterns.
- If Designer is unavailable, inspect the codebase, research task-specific mobile flows when needed, then
  build the presentational components inline — hierarchy, navigation surface, states, platform adaptation
  and accessibility — before wiring behavior into them.
- Report a visual or interaction gap back to the Designer stage; do not redesign inside the feature.

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

## Security and privacy

Use Keychain/Keystore or the framework's secure-storage abstraction for credentials. Store the minimum
offline data, define retention/clear-on-logout behavior, redact logs/crash reports, and validate all
external payloads. Client-side permissions and purchase state never replace server authorization.

## Performance and accessibility

Assess cold/warm start, memory, frame drops, list rendering, image/network use, bundle/app size and battery
only where the change can affect them. Verify labels, focus order, screen reader behavior, contrast,
touch targets, text scaling, reduced motion and keyboard/switch access as applicable.
