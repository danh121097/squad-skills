# Backend stack and runtime matrix

Use this reference when the repository stack is unfamiliar or the user explicitly asks for technology
selection. Existing repositories win over generic defaults, including Elixir, Scala, Deno/Bun and
serverless runtimes; migrate stacks only within accepted scope. Prototype the risky unknown instead of
choosing from popularity.

## Behind a reverse proxy or self-hosted host

Deployment topology belongs to DevOps, but proxy awareness is application code and must not be assumed.

- Trust forwarded headers only from known proxies. A blanket "trust proxy" setting makes client IP, and
  therefore IP rate limits, geo rules and audit logs, attacker-controlled.
- Derive scheme and host from forwarded values when generating redirects, absolute URLs, cookies and
  `Secure`/`SameSite` flags; otherwise HTTPS traffic emits HTTP links.
- Keep application timeouts shorter than proxy timeouts so failures surface as traced application errors
  instead of proxy 504s.
- Enforce body size, header size and concurrency limits in the app as well as at the edge; the edge can be
  bypassed on an internal network.
- Bind to loopback or a Unix socket when a local proxy fronts the service, not to a public interface.
- Support graceful shutdown on SIGTERM with connection draining so the proxy can shift upstreams without
  dropping in-flight requests.
- Expose distinct liveness and readiness endpoints that are cheap, unauthenticated only if safe, and
  excluded from access-log noise and rate limits.

## Framework integration

Add a framework-agnostic layer only when it protects a real domain boundary; otherwise use the
framework's own injection, middleware, validation, transaction and job mechanisms.

## Decision output

Record chosen/preserved stack, rejected alternatives, decisive constraints, operational impact, unknowns,
prototype evidence, compatibility and rollback/migration cost. Source benchmark figures and adoption claims, or leave them out. A decision another role implements records what would reopen it, not only
what was chosen.
