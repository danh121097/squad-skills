# Cross-stack review dimensions

Use to select risk lenses for the actual diff. Do not apply every checklist mechanically or demand a
different framework/style from an established repository.

## Universal

- Spec/acceptance: missing requirement, changed semantics, unjustified extra scope.
- Correctness: invariants, boundaries, error/recovery, null/empty/large values, time/locale, state transition.
- Concurrency/lifecycle: races, cancellation, ordering, duplicate delivery, cleanup, process restart.
- Contracts: APIs/types/schemas/events/config/env, compatibility, generated artifacts and consumers.
- Security/privacy: trust boundaries, authorization, validation, secret/PII/logging and dependency risk.
- Performance/resources: complexity, hot path, I/O, memory, pools/queues, cache and unbounded work.
- Operability: configuration, telemetry, health, rollout, migration, rollback and support/debug path.
- Maintainability: ownership, coupling, readability, repository conventions, testability and docs impact.
- Verification: tests prove behavior and regressions; no skipped/tautological/over-mocked evidence.

## Maintainability baseline

When the repository documents no conventions of its own, the production-quality axis still has a vocabulary. Each
entry below is a labeled heuristic ("possible Feature Envy"), never a hard violation, and a documented
repository standard always overrides it. Skip anything tooling already enforces.

- **Mysterious name** — a name that hides what the thing does or holds. Rename it; when no honest name
  arrives, the design is the problem.
- **Duplicated logic** — one logic shape appearing in several hunks. Extract it and call it from both.
- **Feature envy** — a function reaching into another type's data more than its own. Move it onto that data.
- **Data clumps** — the same few parameters travelling together. Give them one type.
- **Primitive obsession** — a string or number standing in for a domain concept. Give the concept a type.
- **Repeated switches** — the same branch cascade on one type recurring. Replace with dispatch or one shared map.
- **Shotgun surgery** — one logical change forcing scattered edits. Gather what changes together.
- **Divergent change** — one module edited for several unrelated reasons. Split it by reason.
- **Speculative generality** — abstraction, parameters or hooks the accepted scope does not need. Inline it
  back, unless a real boundary or a second consumer already justifies it.
- **Message chains** — long navigation the caller should not depend on. Hide the walk behind one call.
- **Middle man** — a unit that mostly delegates onward. Call the real target.
- **Refused bequest** — an implementer ignoring most of what it inherits. Prefer composition.

## Frontend

Inspect rendering/server-client boundaries, hydration, state ownership, stale async results, query cache,
forms, permission/error/loading states, semantic HTML, keyboard/focus, responsive/i18n, XSS/CSRF/client
secrets, bundle/network/render/memory, service worker/offline and animation cleanup.

React memo/effect rules do not transfer mechanically to Vue/Svelte/Solid/Angular. Review according to the
actual framework reactivity and routing/data model.

## Backend

Inspect boundary validation/authz/tenant isolation, transaction/isolation/idempotency, migrations/backfill/
backup, indexes/query plans/N+1/pools, timeouts/retry/backpressure, queue/event ordering/dedupe, API/schema
compatibility, error leakage, observability and graceful shutdown.

## Mobile

Inspect lifecycle/process death, navigation/deep links, offline/sync conflicts, secure storage, push,
permissions, biometrics/IAP entitlement, native bridge/plugin, memory/listener cleanup, accessibility,
device/OS/build-mode evidence and store/privacy impact.

## DevOps

Inspect target/account/environment, IaC plan replacements/destruction/state, IAM/secrets/network/public
exposure, image/action/module provenance, probes/resources/autoscaling, pipeline trust boundaries,
observability/SLO, backup/restore, rollout/rollback and static/plan/live evidence distinction.

## QA/test code

Inspect assertion strength, isolation, deterministic sync, data cleanup, parallel safety, CI execution,
skips/retries, coverage gaps, secret/PII artifacts and whether tests reproduce implementation rather than
behavior.

## Generated/vendor files

Review source generator/schema/config and rendered diff for contract/security impact. Do not hand-edit
generated output unless repository workflow explicitly requires it. Vendor code gets provenance/license/
integration review, not stylistic rewrite.
