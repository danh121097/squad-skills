# Quality bar and pre-flight

Read before handing a slice to QA, Code Review or the next role. Every check runs against the app's own
build, simulator, device and test tooling, so the pass holds with no other skill installed.

## What weak mobile output looks like

- Verified on a simulator in debug mode and reported as verified. The claim has to hold on a release build,
  on a representative device, across the OS versions the app supports.
- Lifecycle treated as background detail: process death, restoration after eviction, and a disposed
  controller or cancelled scope touched during the transition.
- Offline decided by accident — nothing cached anywhere, or a blanket cache with no staleness, conflict or
  reconciliation rule.
- A parallel UI system: new components beside the app's own, ignoring its navigation, tokens, spacing and
  platform conventions.
- Client-side checks used as a security boundary, tokens or user content in logs, or a platform protection
  disabled so a test would pass.
- Cross-platform read as one target: one platform run, the other assumed, store policy and permission
  prompts unread.
- Deep links, push, permission denial and interrupted flows implemented but never actually entered.
- A contract gap absorbed into the app — a defensive parser or a local recomputation — instead of raised to
  Backend.

## Pre-flight

Pass every applicable check honestly.

### Lifecycle and data

- Foreground, background, process death, restoration, offline, retry, stale cache and conflict paths are
  defined and each entered at least once.
- Permission denied, revoked and never-asked states render something the user can act on.
- Navigation survives interruption: an incoming call, a deep link mid-flow, a backgrounded payment.

### Platform

- Navigation, insets, keyboard avoidance, gestures, dynamic type and accessibility follow app conventions.
- Both target platforms were run, or the one that was not is named in the report.

### Security and performance

- Tokens and sensitive data use platform secure storage; logs and crash reports are redacted.
- Cold start, frame rate, memory and app size were checked in a release build when the change could move
  them.

## Proof to hand over

Name the device or simulator, OS version and build mode, the tests and checks that actually ran, and the
platform, device class or path left unverified. A check that could not run is reported as not run, never as
a pass.
