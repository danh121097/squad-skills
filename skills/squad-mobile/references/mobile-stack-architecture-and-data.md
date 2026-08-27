# Mobile stack, architecture, and data

Use for unfamiliar mobile stacks, greenfield selection, architecture, navigation, state, networking and
offline/sync. Preserve an existing app stack unless migration is explicit.

## Stack families

| Family | Typical use | Native boundary to understand |
|---|---|---|
| React Native + Expo | TS teams, cross-platform product, Expo services/modules | JS runtime, new architecture, native modules, OTA/build profiles |
| Bare React Native | Custom native integration and build control | iOS/Android projects, bridging/TurboModules, build toolchains |
| Flutter | Consistent cross-platform UI, Dart ecosystem | engine/rendering, platform channels, isolates, plugins |
| Swift/SwiftUI + UIKit | Apple-first and deep platform features | scenes/lifecycle, concurrency, Combine/Observation, UIKit interop |
| Kotlin/Compose + Views | Android-first and deep platform features | lifecycle, coroutines/Flow, saved state, View interop |
| Kotlin Multiplatform | Shared domain/data with native UIs or Compose Multiplatform | source sets, concurrency, platform APIs, packaging |
| .NET MAUI | .NET teams and multi-platform shared UI | handlers, lifecycle, native platform projects |
| Capacitor/Ionic | Web-first app with native shell/plugins | WebView security/performance, plugin lifecycle, platform UX gaps |

Choose from product/platform reach, team expertise, required native SDKs, UI fidelity, performance, app
size, release independence, accessibility, debugging, build/release tooling and long-term ownership. Validate
critical SDK/plugin compatibility with a prototype; avoid popularity/adoption percentages.

## Architecture

Preserve repository architecture (MVVM, Redux-style, BLoC, clean layers, feature modules, unidirectional
data flow). Define boundaries between presentation, navigation, domain rules, data/repositories, platform
services and external SDKs. Do not add clean-architecture layers that only forward calls.

State ownership distinguishes ephemeral UI, navigation/deep-link, form draft, server cache, authenticated
session/permissions, persisted preference, offline authoritative draft and sync metadata. Keep derived state
derived and transitions explicit for complex flows.

## Navigation and lifecycle

Model cold/warm deep links, nested stacks/tabs, modal/sheet, back/up, saved/restored state, auth redirects,
process death, scene/activity recreation, background/foreground and interrupted transitions. Never assume an
in-memory navigation/state store survives OS reclamation.

## Networking

Use the repository client and Backend contract. Define timeout, cancellation, retry budget, idempotency,
pagination, auth refresh single-flight, TLS policy, cache freshness and error mapping. Avoid duplicate
requests on recomposition/re-render/lifecycle callbacks. Respect radio/battery cost and metered networks.

## Offline and synchronization

Decide whether offline is read cache, queued mutation, local-first authoritative data or not supported.
Specify schema/version migration, operation IDs, pending/failed state, ordering, retry/backoff, dedupe,
conflict policy, tombstones/deletes, clock assumptions, attachment handling, partial sync and user recovery.

Use platform/framework storage appropriate to data volume and query needs; encrypt sensitive local data as
required and clear account-scoped state on logout. Test airplane/slow/flapping network, process death
during sync, duplicate delivery and old-client/new-server compatibility.

## Native integrations

Wrap push, deep links, camera/files, location, biometrics, background tasks, health/Bluetooth and analytics
behind narrow platform contracts. Model permission/restriction and unavailable hardware. Respect platform
background execution limits; do not keep services alive without a product requirement.
