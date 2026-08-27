# Frontend security, accessibility, and performance

Use for every user-facing change; increase depth for auth, rich text, uploads, third-party scripts,
payments, multi-tenant data, complex widgets and performance-sensitive routes.

## Browser security and privacy

- Prevent XSS by preserving framework escaping, sanitizing allowed rich HTML with a maintained policy, and
  avoiding unsafe DOM sinks/dynamic script execution.
- Treat URL, storage, postMessage, clipboard, deep-link and server payloads as untrusted.
- Use CSRF protection appropriate to cookie/session design; SameSite alone may not cover every topology.
- Never put secrets or privileged credentials in client code, public env variables, source maps or logs.
- Validate postMessage origin/source; constrain iframes; review CSP, Trusted Types and third-party scripts
  according to threat model.
- Avoid storing long-lived tokens in script-readable storage when safer session architecture exists.
- Prevent tenant/object data leakage in cache keys, prefetch, SSR payloads, analytics and error reports.
- Dependency/registry code is source code: inspect install scripts, generated components and bundle impact.

## Accessibility

Use semantic HTML and native controls before ARIA. Follow WCAG 2.2 and WAI-ARIA Authoring Practices for
custom widgets. Verify keyboard order, visible focus, names/roles/states, announcements, error association,
touch targets, contrast, zoom/reflow, text scaling, reduced motion and forced/high contrast where relevant.

Manage focus after dialogs, route transitions, deletion, validation and asynchronous content. Avoid
positive tabindex and hover-only behavior. Test with accessibility tree plus at least one realistic
keyboard/screen-reader path for critical flows; automated checks are incomplete.

## Internationalization and content

Support long/short translations, pluralization, locale formatting, RTL, Unicode and timezone/calendar
semantics. Do not concatenate translatable fragments. Layout must survive realistic content, zoom and
dynamic font sizes.

## Performance model

Measure route/user journey using field data when available and lab profiles otherwise. Optimize the actual
bottleneck:

- rendering: avoid unnecessary reactive work, unstable identity and expensive synchronous computation;
- network: reduce request waterfalls, payloads, duplicate fetches and third-party cost;
- bundle: route/component split heavy optional code; inspect source maps/analyzer; avoid duplicate libs;
- images/fonts: correct dimensions/formats, responsive sources, preload only critical assets and control
  font shifts;
- hydration/server rendering: minimize client boundary and serialized data; avoid hydration mismatch;
- lists/charts/editors: virtualize or progressively render only when measured and accessible;
- memory: clean subscriptions, observers, timers, object URLs, workers and animation contexts.

Protect Core Web Vitals/interaction latency and layout stability, but use project budgets/SLOs rather than
universal magic thresholds. Animation must not block input or create persistent compositing/memory cost.

## Evidence

Report browser/device/network, build mode, route, measurement tool, baseline/change and limitations.
Separate static bundle reasoning, local lab, automated browser, installed app and deployed field evidence.
