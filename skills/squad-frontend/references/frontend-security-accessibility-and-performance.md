# Frontend security, accessibility, and performance

Use for every user-facing change; increase depth for auth, rich text, uploads, third-party scripts,
payments, multi-tenant data, complex widgets and performance-sensitive routes.

## Browser security and privacy

- Treat URL, storage, postMessage, clipboard, deep-link and server payloads as untrusted; sanitize allowed
  rich HTML with a maintained policy.
- Match CSRF protection to the cookie/session design; SameSite alone may not cover every topology.
- Keep secrets out of client code, public env variables, source maps and logs; avoid long-lived tokens in
  script-readable storage when a safer session architecture exists.
- Prevent tenant/object data leakage in cache keys, prefetch, SSR payloads, analytics and error reports.
- Dependency/registry code is source code: inspect install scripts, generated components and bundle impact.

## Accessibility

Semantic HTML and native controls before ARIA; WCAG 2.2 and WAI-ARIA Authoring Practices for custom widgets.
Manage focus after dialogs, route transitions, deletion, validation and asynchronous content. Automated
checks are incomplete: test the accessibility tree plus at least one realistic keyboard/screen-reader path
for critical flows.

Do not concatenate translatable fragments; layout must survive long translations, RTL, zoom and dynamic
font sizes.

## Performance

Measure the route or user journey with field data when available, lab profiles otherwise, and optimize the
measured bottleneck against project budgets/SLOs, not universal thresholds. Virtualize or progressively
render lists/charts/editors only when measured and accessible; preload only critical assets. Animation must
not block input or create persistent compositing/memory cost.

Separate static bundle reasoning, local lab, automated browser, installed app and deployed field evidence
when reporting.
