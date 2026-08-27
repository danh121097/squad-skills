# Mobile debugging and mindset

Use for crashes, ANRs/watchdogs, jank, memory, networking, build/signing, lifecycle and platform-only bugs.

## Diagnostic method

1. Capture exact device/simulator, OS, app version/build mode, account/data, connectivity, lifecycle state
   and steps.
2. Reproduce the earliest wrong behavior; collect symbolicated crash/ANR, logs, network trace, profiler,
   navigation/state and recent release/config evidence.
3. Classify: JS/Dart/native crash, main-thread stall, deadlock, memory pressure, render/layout, state race,
   process restoration, network/auth, storage migration, native module/plugin, signing or store config.
4. Form one falsifiable hypothesis; test on the narrowest discriminating target.
5. Fix cause, add regression test, verify lifecycle/offline/neighbor platforms and release build.

Never log/store credentials or private user content for debugging. Use redacted synthetic fixtures. Do not
disable platform protections, certificate validation or permission checks merely to make a test pass.

## Common evidence paths

- iOS: Xcode console, Organizer/crash logs, Instruments (Time Profiler/Allocations/Leaks/Energy/Network),
  MetricKit, view debugger, signing/entitlements and device logs.
- Android: Logcat, Android Studio profiler, Perfetto, Layout Inspector, Memory Analyzer, ANR traces,
  StrictMode, Network Inspector, Gradle/build scan and Play vitals.
- React Native/Expo: native logs first for crashes; React DevTools/profiler, Metro, Expo logs/build details,
  Hermes/profile and native module lifecycle.
- Flutter: DevTools timeline/CPU/memory/network/widget inspector, shader/jank evidence and platform logs.

## Mobile mindset

- The OS owns process lifetime, scheduling, background execution and permissions.
- Network, battery, storage, screen size, input and device capability are variable constraints.
- Respect platform expectations while preserving product identity.
- Offline is an explicit product/data decision, not a blanket default.
- Design for interruption, one-handed use, accessibility and recovery.
- Measure release builds on representative devices; simulator smoothness is not proof.
- Cross-platform does not erase platform-specific code, testing, store policy or UX.
- Choose architecture and abstractions by change pressure and native integration cost, not fashion.

Completion requires fresh build/tests plus target-specific evidence proportional to risk and clear gaps.
