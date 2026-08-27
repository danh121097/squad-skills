# Backend stack and runtime matrix

Use this reference when the repository stack is unfamiliar or the user explicitly asks for technology
selection. Existing repositories win over generic defaults; never migrate stacks without accepted scope.

## Selection questions

Resolve workload, latency/throughput, consistency, data model, deployment target, team expertise,
ecosystem, compliance, operational maturity, startup time, memory/cost, release cadence and expected
failure modes. Prototype the risky unknown instead of choosing from popularity.

## Language and framework families

| Family | Common frameworks | Strengths | Watch closely |
|---|---|---|---|
| Node.js/TypeScript | NestJS, Fastify, Express, Hono, Adonis | Shared TS contracts, I/O concurrency, large web ecosystem | Event-loop blocking, unbounded promises, package supply chain |
| Python | FastAPI, Django/DRF, Flask, Litestar | Data/ML ecosystem, rapid APIs, mature Django platform | Sync work in async paths, worker sizing, typing/runtime validation gaps |
| Go | net/http, Chi, Gin, Echo, Fiber | Simple deployment, concurrency, predictable services/tooling | Goroutine leaks, context cancellation, error wrapping, over-abstraction |
| Rust | Axum, Actix Web, Poem, Rocket | Memory safety, low latency/resource use, systems integration | Complexity, compile time, async ownership and ecosystem fit |
| JVM | Spring Boot, Quarkus, Micronaut, Ktor | Enterprise ecosystem, mature observability, concurrency options | Startup/memory, blocking/reactive mixing, framework magic |
| .NET | ASP.NET Core, Minimal APIs, Orleans | High-performance runtime, strong tooling, enterprise/cloud support | DI/lifetime mistakes, sync-over-async, deployment/runtime assumptions |
| PHP | Laravel, Symfony | Product velocity, batteries-included web platform, queues/jobs | Long-running worker state, ORM query behavior, runtime consistency |
| Ruby | Rails, Hanami, Sinatra | Convention-driven product development and mature web patterns | N+1, background jobs, runtime throughput and memory |

Also preserve Elixir/Phoenix, Scala, Clojure, Deno/Bun or serverless runtimes when already established.
Use their official runtime and framework documentation; apply the same contracts, security and evidence
gates rather than forcing a listed stack.

## Runtime reasoning

- Identify concurrency model: event loop, threads, coroutines/goroutines, actors or processes.
- Propagate cancellation/deadlines through network, database and queue calls.
- Bound workers, queues, request bodies, recursion, fan-out and parallelism.
- Separate CPU-bound work from I/O-bound request paths.
- Understand process model, graceful shutdown, readiness, connection draining and signal handling.
- Define configuration precedence and fail fast on missing/invalid critical config without leaking values.
- Use structured errors with stable public mapping and preserved internal cause/context.

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

Match dependency injection, modules/packages, middleware/interceptors, validation, error boundaries,
transactions, background jobs, health checks, logging and test harness conventions. Avoid framework-agnostic
layers that merely duplicate the framework without protecting a real domain boundary.

## Decision output

Record chosen/preserved stack, rejected alternatives, decisive constraints, operational impact, unknowns,
prototype evidence, compatibility and rollback/migration cost. Avoid unsourced benchmark percentages and
time-sensitive adoption claims.
