# Platform: SwiftUI and Jetpack Compose

Read this reference for a SwiftUI (iOS/iPadOS/macOS) or Jetpack Compose (Android) target. React
Native and Flutter load the cross-platform reference; web targets load the web reference.

**Verification tier:** Apple and Android native output is compile-checked and reviewed by a human
only. There is no automated render gate for this tier. State this tier in every report; never
imply these deliverables passed automated render, contrast, or axe checks.

## Shared rules

- Same boundary as every platform: inert presentational views with data passed in. Navigation
  stacks, view models, repositories, persistence, and lifecycle stay with `squad-mobile`.
- Follow the platform's design language first — Apple Human Interface Guidelines for SwiftUI,
  Material 3 for Compose (both in the source registry) — then the app's established deviations
  from it. A cross-platform product ports the brand, not one platform's idioms onto the other.
- Prefer system components, system typography, and system colors before custom drawing; custom
  visuals must state what the system component could not do.
- Honor the OS reduce-motion setting and dynamic text sizing in the component that animates or
  sets type; whoever writes the animation code owns its lifecycle scoping, teardown, and
  reduced-motion fallback. Test layouts at the largest supported accessibility text size.
- Keep guidance narrow and cite official docs when exact modifier or API behavior matters.

## SwiftUI

- Compose small views; derive variation from parameters and `ViewModifier`s, not copied bodies.
- Tokens: semantic `Color` assets (light/dark variants), `Font` styles built on Dynamic Type text
  styles, and shared spacing/radius constants in one place; extend what the project already has.
- Layout with stacks, `Grid`, and alignment guides; adapt with size classes rather than device
  checks; respect safe areas and keyboard avoidance.
- Motion: `withAnimation`/`animation` bound to state, springs for interactive continuity;
  `accessibilityReduceMotion` switches to opacity or instant layout.
- Accessibility: labels, traits, values, and grouping through accessibility modifiers; ensure
  VoiceOver order matches visual hierarchy and controls meet 44pt targets.

## Jetpack Compose

- Compose stateless composables that hoist state; parameters and slot APIs carry every rendered
  state, mirroring the props/slots contract on other platforms.
- Tokens: `MaterialTheme` color scheme, typography, and shapes — extended through theme extension
  objects when the brand needs roles Material does not define.
- Layout with `Row`/`Column`/`Box`, `Modifier` chains, and window size classes for adaptation;
  handle insets explicitly (`WindowInsets`) rather than assuming full-screen.
- Motion: `animate*AsState` and `AnimatedVisibility` for state changes, `updateTransition` for
  coordinated ones; respect the system animator duration scale, which users set to disable motion.
- Accessibility: content descriptions, `semantics` blocks, merged nodes for composite rows,
  48dp minimum touch targets, and TalkBack order verified against visual order.

## Handoff additions for this tier

Alongside the standard handoff contract, state: that verification was compile plus human review
only, which HIG or Material 3 sections informed non-obvious decisions, the accessibility features
assumed (Dynamic Type, VoiceOver, TalkBack, reduce motion), and what `squad-mobile` must verify on
device — real rendering, input, performance, and platform-version behavior.
