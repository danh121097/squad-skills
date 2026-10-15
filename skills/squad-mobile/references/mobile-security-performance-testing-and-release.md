# Mobile security, performance, testing, release, and diagnosis

Use for authentication, sensitive data, native SDKs, performance, release or production-readiness, and for
crashes, ANRs/watchdogs, jank, memory, network, build/signing and platform-only bugs.

## Security and privacy

Threat-model device loss, malicious deep links/push, WebView, clipboard/screenshot leakage, exported Android
components, iOS entitlements, backup, logs/crash reports and third-party SDKs.

- Credentials live in Keychain/Keystore-backed secure storage, never AsyncStorage/UserDefaults/plain DB; store
  the minimum offline data and define retention and clear-on-logout.
- Biometrics unlock local credentials, not server trust.
- Validate deep links, universal/app links, push payloads, intents and file/URL inputs; redact logs and crash
  reports.
- Certificate pinning only with a rotation/recovery design and a real threat requirement.
- App bundles carry no private keys or secrets; public client identifiers are not secrets.
- Review analytics/ads/crash SDK data, manifests, privacy labels/data safety and consent behavior.

## Performance

Measure release builds on representative lower/median targets — cold/warm launch, jank, memory, network bytes,
image decode, battery, app size, background work — with platform profilers, against the product/device
baseline rather than fixed universal budgets. Motion honors reduced motion and the frame budget.

## Testing

Use deterministic fixtures, condition-based waits and isolated test accounts. Cover on a real-device matrix
what simulators cannot: camera, biometrics, push, background and platform-specific performance. Test upgrade
and migration of local DB and persisted state, and old client/new server compatibility.

## Release and stores

Preserve signing and secret custody. Verify bundle/application IDs, entitlements/permissions, version/build
numbers, target SDK/toolchain requirements, privacy manifests/data safety, store assets, review/demo account
and compliance declarations from current store docs.

Use internal/beta tracks, staged rollout, crash/ANR/vitals gates, feature flags/kill switches and a
rollback/forward-fix plan. OTA updates must respect store policy, native binary compatibility, runtime
versioning and rollback.

IAP/subscriptions require server-side receipt/transaction validation, idempotent event processing,
entitlement state, restore, pending/refund/revoke/grace cases and current StoreKit/Play Billing rules.

## Diagnosis evidence paths

Capture the exact device/simulator, OS, app version/build mode, account/data, connectivity and lifecycle
state, and reproduce the earliest wrong behavior before hypothesizing.

Read native logs first for React Native/Expo crashes, then the framework profiler. Use the platform's own
crash, ANR and profiling tooling (Instruments and MetricKit, Logcat and Perfetto, Flutter DevTools) on
redacted synthetic fixtures.
