# Mobile security, performance, testing, and release

Use for authentication, sensitive data, native SDKs, performance, release or production-readiness.

## Security and privacy

Threat-model device loss, compromised device, malicious deep links/push, insecure local storage, WebView,
clipboard/screenshot leakage, exported Android components, iOS entitlements, backup, logs/crash reports,
third-party SDKs and supply chain.

- Store credentials in Keychain/Keystore-backed secure storage; never AsyncStorage/UserDefaults/plain DB.
- Server enforces authorization and entitlements; biometrics unlock local credentials, not server trust.
- Validate deep links, universal/app links, push payloads, intents and file/URL inputs.
- Use platform network security defaults; certificate pinning only with rotation/recovery design and a real
  threat requirement.
- Minimize permissions and collected data; request in context; define retention/deletion/export/consent.
- Prevent secrets/API private keys in app bundles; public client identifiers are not secrets.
- Review analytics/ads/crash SDK data, manifests, privacy labels/data safety and consent behavior.
- Follow OWASP MASVS/MASTG according to risk; root/jailbreak detection is a signal, not absolute security.

## Performance and resource model

Measure release builds on representative lower/median targets. Inspect cold/warm launch, time to usable,
frame timing/jank, CPU, memory/allocations/leaks, network bytes/waterfalls, storage, image decode, battery,
thermal, app/download size and background work. Use platform profilers and framework tooling; avoid fixed
universal budgets without product/device baseline.

Optimize lists, images, unnecessary recomposition/re-render, synchronous main-thread work, bridge/platform
channel chatter and retained listeners/controllers. Motion must honor reduced motion and frame budget.

## Test layers

- unit/property tests for domain, reducers/state machines, sync/conflict and formatting;
- component/widget/view tests for states, accessibility and interaction;
- repository/network/storage integration tests with controlled time/failure;
- navigation/deep-link/lifecycle tests;
- E2E on simulator/emulator for critical journeys;
- real-device matrix for camera/biometric/push/background/performance/platform-specific behavior;
- security/privacy tests for storage, logs, exported components, WebViews and permission handling;
- upgrade/migration tests for local DB, persisted state and old client/server compatibility.

Use deterministic fixtures; never rely on arbitrary sleeps or live shared accounts. Record framework,
device, OS, build mode and backend environment.

## Release and stores

Preserve signing and secret custody. Verify bundle IDs/application IDs, entitlements/permissions, version/
build numbers, target SDK/toolchain requirements, privacy manifests/data safety, store assets, localization,
review/demo account and compliance declarations from current store docs.

Use internal/beta tracks, staged/phased rollout, crash/ANR/vitals/metric gates, feature flags/kill switches
and rollback/forward-fix plan. OTA updates must respect platform/store policy, native binary compatibility,
runtime versioning and rollback.

IAP/subscriptions require server-side receipt/transaction validation, idempotent event processing,
entitlement state, restore, pending/refund/revoke/grace cases and current StoreKit/Play Billing rules.

## Production evidence

Separate static/build, simulator/emulator, physical device, beta and production rollout verification.
Report untested OS/device/native capability paths honestly.
