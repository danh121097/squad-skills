# Frontend architecture, state, data, and forms

Use for feature/module boundaries, complex flows, data integration, state selection, forms and routing.

## Architecture

- Organize around product/domain ownership when it improves cohesion; shared primitives remain genuinely
  cross-feature and stable.
- Keep UI/presentation, client orchestration, API adapters and pure domain rules separable enough to test,
  without layering ceremony that duplicates the framework.
- Define public component/module API; avoid deep imports and circular feature dependencies.
- Place server-only, client-only and shared code explicitly; guard secrets and privileged SDKs from client
  bundles.
- Prefer composition, slots/children and variants over prop matrices and inheritance.

## State taxonomy

Classify before choosing a store:

- local ephemeral UI state;
- URL/navigation state that must be shareable/restorable;
- form draft/validation state;
- server state with cache/freshness/refetch semantics;
- authenticated user/session/permission state;
- cross-feature client state with a clear owner;
- persisted offline/local state with version/migration rules.

Use framework primitives first. Add a store only for real cross-tree ownership or state-machine complexity.
Do not mirror server state into a general store. Keep derived state derived; model transitions explicitly
for multi-step/concurrent flows.

## Server state and APIs

Use the repository's query/client layer. Define cache key identity, freshness, invalidation, cancellation,
deduplication, retry, pagination, optimistic update/rollback and auth expiry. Prevent stale responses from
overwriting newer intent. Cancel work on route/parameter changes where supported.

Map transport errors into stable user/system categories. Never leak raw backend errors. Preserve trace or
request IDs safely for support. Handle partial data and field-level authorization without assuming absent
means empty.

## Rendering states

For every data surface decide initial, loading/skeleton, stale/revalidating, empty, partial, error,
permission-denied, offline and success behavior. Preserve layout stability and focus/announcement behavior.
Error boundaries must match recovery scope; a widget failure should not necessarily destroy the route.

## Forms and validation

- Use semantic controls and native browser behavior first.
- Share schemas only when server and client semantics truly match; server validation remains authoritative.
- Define touched/dirty/submitting/success/conflict states, async validation cancellation and duplicate
  submission/idempotency behavior.
- Preserve user input on recoverable failure; focus/announce actionable errors and summarize when needed.
- Model server conflicts and stale version/ETag rather than last-write-wins accidentally.
- File upload needs type/size/progress/cancel/retry and safe server validation.

## Routing and permissions

Use route loaders/guards/middleware according to framework. URL state should encode shareable filters,
pagination and tabs. Handle unknown/unauthorized/expired/deep-linked routes. Client guards improve UX but
never replace server authorization.

## Real-time and offline

For WebSocket/SSE/polling, define connection lifecycle, auth refresh, reconnect/backoff, ordering,
deduplication and stale snapshot reconciliation. For offline/PWA, define cache scope, mutation queue,
conflicts, storage versioning, quota and logout cleanup; never cache sensitive responses by accident.
