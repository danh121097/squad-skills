# Domain coverage contracts

Use only when a named `squad-*` role skill is missing or when auditing role completeness. This provides
minimum deep coverage; the role still inspects the repository and current primary documentation.

## Designer

Must cover user/job/context, IA/flow and recovery, accepted Figma/repository design authority, task-specific
visual and real-product UX research, design system tokens/components, all data/interaction states,
responsive/adaptive/i18n, WCAG/platform accessibility, motion/reduced motion, and anti-slop critique.
The designer hands over presentational component code, not a written spec; state, data fetching, API
integration, routing, forms submission, and platform lifecycle stay with the build role.

## Frontend

Must cover the repository framework/rendering model (React/Next/TanStack, Vue/Nuxt, SvelteKit, Angular,
Solid/Astro/other), component/module boundaries, routing, local/URL/form/server/global state ownership,
API cache/cancellation/retry/optimistic behavior, auth/permissions, loading/error/offline/real-time states,
semantic accessibility/i18n, browser security/privacy, performance/bundle/hydration/memory, CSS/Motion/GSAP
ownership, tests/browser/debugging and frontend mindset. Consumes Backend contracts; no server ownership.

## Backend

Must cover repository runtime/framework (Node/TS, Python, Go, Rust, JVM, .NET, PHP/Ruby/other), API/RPC/
events/webhooks, domain/system design, modular monolith/microservices/distributed failure, SQL/document/cache/
search/messaging, contracts/versioning/idempotency, transactions/concurrency/migrations/backup/restore,
authN/authZ/multi-tenancy/privacy/OWASP, capacity/performance/reliability/observability, testing/debugging and
systems mindset. Publishes shared contracts; no UI/deploy pipeline ownership.

## Mobile

Must cover existing RN/Expo, Flutter, SwiftUI/UIKit, Kotlin/Compose/Views, KMP/Compose Multiplatform,
.NET MAUI/Capacitor/other stack; architecture/state/navigation; accepted design/platform conventions;
networking, offline/sync/conflict, lifecycle/process death, storage/security/privacy, deep link/push/
permissions/biometric/IAP, accessibility/localization, launch/jank/memory/battery/app size, unit/widget/
integration/E2E/device tests, release/store/OTA and platform debugging. Consumes Backend contracts.

## DevOps

Must cover current cloud/on-prem topology, identity/account/environment/region, containers/Kubernetes/
serverless/VM/batch, IaC/state/drift, CI/CD/GitOps/artifacts, IAM/secrets/network/tenancy/supply chain,
observability/SLO/incident, rollout/rollback, backup/restore/DR, capacity/cost, infra testing/debugging and
operability mindset. No external mutation beyond explicit scope; distinguish static/plan/staging/live proof.

## QA

Must map acceptance/risk to static, unit/property, component, integration, contract, E2E/exploratory,
database/migration, browser/mobile, security, accessibility, visual, performance/load/resilience and release
evidence as applicable. Own deterministic fixtures/data/CI/flakiness/coverage quality, minimal repro,
environment/artifact record and PASS/FAIL/NEEDS_ENVIRONMENT. Reads implementation; never edits it.

## Code Review

Must run spec compliance before production-quality review; trace blast radius through callers/contracts/
data/auth/events/config/deploy/tests; apply cross-stack correctness/security/privacy/compatibility/
concurrency/performance/operations/maintainability/test lenses; verify findings empirically; rank severity
with file:line, trigger, impact, evidence and remediation; issue APPROVE/CHANGES REQUESTED/NEEDS_EVIDENCE.
Advisory only.

## Universal evidence gate

Every role states source/repository versions, environment, commands/checks, evidence level, residual risk
and unverified areas. Do not substitute generic expertise for current official docs or live verification.
Do not auto-install tooling. Preserve user decisions, existing architecture and role boundaries.
