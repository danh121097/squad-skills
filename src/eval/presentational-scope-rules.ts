/**
 * The forbidden-capability rule table behind `INV-SCOPE-001`.
 *
 * Kept as data next to the gate that runs it so a reviewer reads the whole
 * boundary in one place, and so adding a platform means adding rows rather than
 * editing control flow.
 *
 * Deliberately *not* listed: `useState`, `useEffect`, `setState`, `remember`,
 * `@State`. The contract forbids owning application state, data, routing, and
 * platform lifecycle — not holding presentation-local state such as hover,
 * expansion, or focus. Flagging those would fail correct output, which the
 * phase risk register names as the primary way a wording check goes wrong.
 */
export interface ScopeRule {
  /** What the match proves the component took ownership of. */
  capability:
    'analytics' | 'data' | 'integrity' | 'persistence' | 'routing' | 'secrets' | 'state-store';
  id: string;
  pattern: RegExp;
  /** Platforms the rule reads for, used only to explain a match. */
  platforms: string;
}

/**
 * Patterns are matched against comment-stripped source, so a mention in prose
 * does not fail a run. Each is anchored on a call or import shape rather than a
 * bare word: `fetch` appears in "prefetch", `Color` appears everywhere.
 */
export const scopeRules: ScopeRule[] = [
  {
    capability: 'data',
    id: 'network-fetch',
    pattern: /\b(?:window\.|globalThis\.)?fetch\s*\(/,
    platforms: 'web, react-native',
  },
  {
    capability: 'data',
    id: 'network-client',
    pattern:
      /\b(?:axios|XMLHttpRequest|EventSource|WebSocket)\b|\bfrom\s+['"](?:axios|ky|got|superagent)['"]/,
    platforms: 'web, react-native',
  },
  {
    capability: 'data',
    id: 'query-library',
    // The import form matters as much as the call: a component handed a
    // `queryClient` threads data ownership without naming a hook.
    pattern:
      /\buse(?:Query|Mutation|SWR|InfiniteQuery|SuspenseQuery|LazyQuery)\s*\(|from\s+['"](?:@tanstack\/(?:react-|solid-|vue-)?query|swr|@apollo\/client|urql)['"]|\bQueryClient(?:Provider)?\b/,
    platforms: 'web, react-native',
  },
  {
    capability: 'data',
    id: 'native-http',
    pattern:
      /package:(?:http|dio)\/|\bURLSession\b|\bRetrofit\b|\bOkHttpClient\b|\bHttpClient\s*\(/,
    platforms: 'flutter, swiftui, compose',
  },
  {
    capability: 'routing',
    id: 'web-router',
    pattern:
      /from\s+['"](?:react-router[^'"]*|next\/(?:router|navigation)|expo-router|@tanstack\/react-router)['"]|\buse(?:Navigate|Router|Params|SearchParams|Pathname)\s*\(/,
    platforms: 'web, react-native',
  },
  {
    capability: 'routing',
    id: 'native-router',
    pattern:
      /\bNavigator\.(?:push|pop|of)\b|\bNavigationStack\b|\bfindNavController\s*\(|\bnavController\.navigate\s*\(/,
    platforms: 'flutter, swiftui, compose',
  },
  {
    capability: 'state-store',
    id: 'web-store',
    // `[^'"]*` on both sides of the name: the specifier is `react-redux` far
    // more often than `redux`, and anchoring on the start of the string missed
    // the common case entirely.
    pattern:
      /from\s+['"][^'"]*(?:redux|zustand|jotai|recoil|mobx|valtio)[^'"]*['"]|\buse(?:Dispatch|Selector|Store|AtomValue)\s*\(|\bconnect\s*\(\s*mapStateToProps/,
    platforms: 'web, react-native',
  },
  {
    capability: 'state-store',
    id: 'native-store',
    // `@`-prefixed property wrappers carry no leading `\b`: `@` is not a word
    // character, so `\b@` would only match mid-identifier and never at a line
    // start, which is exactly where a Swift declaration sits.
    pattern:
      /package:(?:provider|riverpod|flutter_bloc|get_it)\/|\bProvider\.of\s*<|@(?:EnvironmentObject|StateObject|ObservedObject)\b|\bhiltViewModel\s*\(|\bviewModel\s*\(\s*\)/,
    platforms: 'flutter, swiftui, compose',
  },
  {
    capability: 'persistence',
    id: 'client-persistence',
    pattern:
      /\b(?:localStorage|sessionStorage|indexedDB|AsyncStorage|UserDefaults|SharedPreferences)\b|package:shared_preferences\//,
    platforms: 'all',
  },
  {
    capability: 'analytics',
    id: 'analytics-client',
    // `amplitude` is a waveform parameter before it is a vendor, so it matches
    // only in a client shape — a member access or an import. Bare-word matching
    // failed `const amplitude = 12` in correct motion code, which is the false
    // positive this phase's risk register names first.
    pattern:
      /\bgtag\s*\(|\b(?:mixpanel|posthog|amplitude|datadogRum|FirebaseAnalytics)\s*\.\s*\w+|from\s+['"][^'"]*(?:mixpanel|posthog|amplitude|segment|datadog)[^'"]*['"]|\bSentry\.\w+\s*\(|\banalytics\.(?:track|identify|page|capture)\s*\(/,
    platforms: 'all',
  },
  {
    // Defence in depth for the render tier: the harness detects tampering at
    // measurement time, and this fails it at the static tier too. Presentational
    // output has no reason to redefine a global or a DOM prototype, so the rule
    // costs correct candidates nothing.
    capability: 'integrity',
    id: 'measurement-tampering',
    pattern:
      /\bObject\.defineProperty\s*\(\s*(?:window|globalThis|document)\b|\b(?:Element|Document|Node|HTMLElement)\.prototype\.\w+\s*=|\b(?:window|globalThis)\.(?:getComputedStyle|axe)\s*=/,
    platforms: 'web, adaptive',
  },
  {
    capability: 'secrets',
    id: 'environment-and-credentials',
    pattern:
      /\b(?:process\.env|import\.meta\.env|String\.fromEnvironment|BuildConfig)\b|\b[A-Z0-9_]*(?:API_KEY|SECRET|ACCESS_TOKEN|PRIVATE_KEY)[A-Z0-9_]*\b|['"]Bearer\s/,
    platforms: 'all',
  },
];

/**
 * Raw styling literals `INV-TOKEN-001` reports when they appear outside a token
 * or theme file. Medium severity: a literal is a coherence smell, not a defect,
 * and a rendered gate already proves the result is legible.
 */
export const rawStyleLiteralRules: Array<{ id: string; pattern: RegExp }> = [
  // `(?<![&\w"'])`: `&#8212;` is an em dash and `href="#fade"` is a link.
  // Both are staple presentational markup; neither is a color literal.
  { id: 'hex-color', pattern: /(?<![&\w"'])#[0-9a-fA-F]{3,8}\b/g },
  { id: 'css-color-function', pattern: /\b(?:rgba?|hsla?)\s*\(\s*\d/g },
  { id: 'native-color-literal', pattern: /\bColor\s*\(\s*(?:0x[0-9a-fA-F]{6,8}|red\s*:)/g },
  // Each pattern captures the whole literal, not just its first character:
  // the match text becomes the evidence line a reviewer reads, and
  // `font-size: 1` names nothing checkable.
  { id: 'font-size-literal', pattern: /font-size\s*:\s*[\d.]+[a-z%]*|\bfontSize\s*:\s*[\d.]+/g },
];

/** Files whose whole purpose is to declare literals, so literals are correct there. */
export const defaultTokenFilePatterns = [
  /(?:^|\/)tokens?\.[^/]+$/,
  /(?:^|\/)theme[^/]*\.[^/]+$/,
  /\.tokens\.[^/]+$/,
  /(?:^|\/)design-tokens\//,
];
