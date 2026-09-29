# Frontend architecture, state, data, and forms

Use for feature/module boundaries, complex flows, data integration, state selection, forms and routing.

## Architecture

Keep UI/presentation, client orchestration, API adapters and pure domain rules separable enough to test,
without layering ceremony that duplicates the framework. Place server-only, client-only and shared code
explicitly; guard secrets and privileged SDKs from client bundles.

## State taxonomy

Classify before choosing a store: local ephemeral UI; URL/navigation (shareable/restorable); form draft;
server state with cache/freshness semantics; session/permission; cross-feature client state with a clear
owner; persisted offline state with version/migration rules.

Use framework primitives first. Add a store only for real cross-tree ownership or state-machine complexity.
Do not mirror server state into a general store. Keep derived state derived; model transitions explicitly
for multi-step/concurrent flows.

## Server state and APIs

Use the repository's query/client layer. Define cache key identity, freshness, invalidation, cancellation,
deduplication, retry, pagination, optimistic update/rollback and auth expiry. Prevent stale responses from
overwriting newer intent.

Map transport errors into stable user/system categories; never leak raw backend errors. Preserve trace or
request IDs safely for support. Handle partial data and field-level authorization without assuming absent
means empty.

## Rendering states

For every data surface decide initial, loading/skeleton, stale/revalidating, empty, partial, error,
permission-denied, offline and success behavior. Preserve layout stability and focus/announcement behavior.
Error boundaries must match recovery scope; a widget failure should not necessarily destroy the route.

## Forms and validation

- Share schemas only when server and client semantics truly match; server validation remains authoritative.
- Define touched/dirty/submitting/success/conflict states, async validation cancellation and duplicate
  submission/idempotency behavior.
- Preserve user input on recoverable failure; focus/announce actionable errors.
- Model server conflicts and stale version/ETag rather than last-write-wins accidentally.
- File upload needs type/size/progress/cancel/retry and safe server validation.

## Routing and permissions

URL state encodes shareable filters, pagination and tabs. Handle unknown/unauthorized/expired/deep-linked
routes. Client guards improve UX but never replace server authorization.

## Real-time and offline

For WebSocket/SSE/polling, define connection lifecycle, auth refresh, reconnect/backoff, ordering,
deduplication and stale snapshot reconciliation. For offline/PWA, define cache scope, mutation queue,
conflicts, storage versioning, quota and logout cleanup; never cache sensitive responses by accident.
