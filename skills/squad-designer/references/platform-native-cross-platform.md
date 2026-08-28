# Platform: React Native/Expo and Flutter

Read this reference for a React Native, Expo, or Flutter target. Web targets load the web platform
reference; SwiftUI and Jetpack Compose load the Apple/Android reference.

**Verification tier:** cross-platform native output is compile-checked, plus a partial render of
render-compatible components through the web renderer. It is never render-gated end to end.
State this tier in every native report; never imply a native deliverable passed the web render
gates.

## Shared rules

- The deliverable is the same as on web: inert presentational components with props left open.
  Navigation wiring, state, data, and platform lifecycle stay with `squad-mobile`.
- Inspect the existing app first: navigation shell, theme or token module, component conventions,
  and installed animation libraries are the foundation. Do not introduce a parallel system.
- Design for touch reality: minimum target sizes, thumb reach, safe areas, notches, on-screen
  keyboard displacement, and interruption by the platform.
- Honor the OS reduce-motion setting in the same component that animates, and keep animation off
  the JavaScript thread or on the platform's animation system where the toolkit supports it.
  Whoever writes the animation code owns its lifecycle scoping, teardown, and reduced-motion
  fallback.
- Cite the official framework docs from the source registry when exact API behavior matters;
  keep guidance narrow rather than confidently generic.

## React Native / Expo

- Compose from core primitives (`View`, `Text`, `Pressable`, `FlatList`) or the repository's
  existing component layer; style through the project's established approach — `StyleSheet`,
  a utility library, or a theme provider already in the tree.
- Express tokens as a typed theme module (colors, spacing, radius, type scale) when none exists;
  extend the existing one when it does.
- Follow the repository's animation library. Greenfield: prefer Reanimated for gesture-driven and
  continuous motion, `Animated`/`LayoutAnimation` only for trivial cases; verify current APIs in
  the official docs before relying on them.
- Accessibility: `accessibilityRole`, `accessibilityLabel`, `accessibilityState`, and grouped
  focus for composite rows; test order with a screen reader in mind, not only visually.
- Respect platform divergence explicitly (`Platform.select`, safe-area insets); never hard-code
  iOS metrics into Android layouts.

## Flutter

- Compose from the design language the app already uses — Material or Cupertino widget sets, or
  the project's own widget layer. Do not mix both languages in one screen without a stated reason.
- Centralize tokens in `ThemeData`/`ColorScheme`/`TextTheme` extensions instead of ad-hoc
  constants; extend the existing theme rather than forking it.
- Build layout with constraint-based composition (`Row`, `Column`, `Expanded`, `LayoutBuilder`)
  and let content size drive it; avoid fixed pixel dimensions that break with large fonts.
- Motion: implicit animated widgets for simple state changes; explicit `AnimationController` work
  only for coordinated sequences, with `MediaQuery.disableAnimations` honored.
- Accessibility: `Semantics` widgets, sufficient contrast in both themes, and text scaling
  verified at large `textScaleFactor`.

## Handoff additions for this tier

Alongside the standard handoff contract, state: which components were exercised by the partial
web render and which were only compiled, the OS accessibility features assumed (Dynamic Type,
TalkBack/VoiceOver), and what `squad-mobile` must verify on device — gesture feel, thread
performance, real keyboard and safe-area behavior.
