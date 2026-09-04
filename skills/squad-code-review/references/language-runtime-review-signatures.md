# Language and runtime review signatures

Use when the diff runs on a language or runtime this review has no established defect model for. This
answers detection — what the defect looks like in a diff and what confirms it — not selection. The owning
squad's stack matrix answers selection; keep the two separate rather than merging them.

## Reading an unfamiliar ecosystem

Resolve four things before judging any line: the concurrency model, the error model, the resource-lifetime
rule and the dependency manifest with its runtime version. A defect claim in an unfamiliar language needs
that ecosystem's current documentation or an executed check behind it. A remembered idiom is not evidence,
and the burden is higher here, not lower, because the reviewer cannot fall back on familiarity.

## Signatures

| Ecosystem | Signature in the diff | Confirm by |
|---|---|---|
| Node.js/TypeScript | Promise neither awaited, returned nor caught; `async` callback handed to an API that discards its result; `any`/`as` at a trust boundary; CPU-bound or synchronous I/O on the request path | Following the rejection path to its handler, and checking the boundary parses at runtime instead of only asserting a type |
| Python | Mutable default argument; blocking call inside `async def`; bare `except` that swallows and continues; threads assumed to give CPU parallelism on a GIL build | Tracing the awaited call chain to the blocking frame, and checking the caught class actually covers the failure claimed |
| Go | Goroutine with no cancellation or bounded lifetime; `ctx` accepted but not propagated to the call it wraps; nil pointer in an interface compared to `nil`; `defer` in a loop holding a resource; assigned error left unchecked | `go vet`, the race detector on the touching test, and following the context to its outermost caller |
| Rust | `unwrap`/`expect`/`panic!` on a path the caller cannot recover from; blocking call in an async task without `spawn_blocking`; lock held across `.await`; unbounded channel | Checking whether untrusted input reaches the panic, and which runtime flavor executes the task |
| JVM | Blocking work on an event-loop or reactive thread; unbounded or shared pool; mutable static state; `equals`/`hashCode` changed on a key type; resource opened outside try-with-resources | Identifying the scheduler that runs the block, and inspecting existing map/set uses of the changed key |
| .NET | `.Result`/`.Wait()` sync-over-async; `async void` outside an event handler; scoped service captured by a singleton; `HttpClient` constructed per request | Reading the DI lifetimes at registration, and following the call to its synchronization context |
| PHP/Ruby | Per-request assumption inside a long-running worker; ORM relation touched in a loop; job made non-idempotent while the queue still retries | Establishing the process model actually deployed, and reading the queue's retry and dedupe policy |
| SQL/ORM (any language) | Query issued inside a loop or per collection element; filter/order column with no supporting index; transaction held open across a network call; read-then-write with no constraint or lock | The query plan and statement log on representative data, never the ORM call site alone |

Elixir, Scala, Clojure, Zig, Deno/Bun and serverless runtimes get the same treatment: resolve the four
properties above from official documentation, then review against them.

## What not to report

An idiom one ecosystem accepts is not a defect because another forbids it, and a house pattern the
repository applies consistently is a convention question, not a correctness finding.

Version decides several rows here — Go's loop-variable scope changed in 1.22 and Node's unhandled-rejection
default changed in 15 — so resolve the version from the manifest before ranking a finding that depends on
it. When the runtime cannot be confirmed, that is `NEEDS_EVIDENCE`, not a blocking finding.
