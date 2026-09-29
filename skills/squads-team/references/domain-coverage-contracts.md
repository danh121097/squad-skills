# Domain coverage contracts

Use only when a named `squad-*` role skill is missing or when auditing role completeness. Each role still
inspects the repository and current primary documentation; these are the non-obvious minimums.

## Framing

`squad-product` owns framing. Read this when that skill is absent and a request meets the Product trigger in
gate 1 of `SKILL.md`. Before spawning any role, produce the outcome in the user's own terms, the constraints
that bind it, explicit non-goals, and acceptance criteria a run can actually check; a criterion nothing can
check is replaced or recorded as unverified. Resolve what the user already decided — stack, hosting,
deadline, compliance, budget — before proposing anything, and ask only about a fork that changes the work.
Without `squad-product`, a written plan follows the same shape: a written plan of one or two
phases is a single plan.md declaring layout: single; a larger one is one directory whose root holds only
plan.md and the standard phases, artifacts, adr and references directories, with every phase file in
phases/ named phase-XX-kebab-case-title.md and every link relative.

An empty repository has nothing to scout, so the stack becomes a framing output. Name target platforms, the
runtime and framework per platform, and the deployment target, then hand each to the role that owns it.
Record it as a decision with its reason, so a later role reads a choice rather than an inherited default. A
decision another role implements records what would reopen it, not only what was chosen.

## Designer

Covers user/job/context, flow and recovery, design authority in order (the user's material, the repository
system, research for the gap only), tokens/components, all data/interaction states, responsive/i18n, WCAG,
motion with reduced-motion, and anti-slop critique. The designer hands over presentational component code,
not a written spec; state, data fetching, API integration, routing, forms submission, and platform lifecycle
stay with the build role.

## Frontend

Covers the repository's framework and rendering model, module boundaries, routing, state ownership (local,
URL, form, server, global), API cache/cancellation/retry, auth, loading/error/offline states, accessibility,
browser security, performance, and browser tests. Consumes Backend contracts; no server ownership.

## Backend

Covers the repository's runtime and framework, API/event/webhook contracts and idempotency, data modeling,
transactions, migrations and backup/restore, authN/authZ and multi-tenancy, reliability and observability.
Publishes shared contracts; no UI or deploy-pipeline ownership.

## Mobile

Covers the existing stack and navigation, accepted platform conventions, networking and offline/sync/conflict,
lifecycle and process death, secure storage, deep link/push/permissions, accessibility/localization,
launch/jank/battery/app size, device tests and store/OTA release. Consumes Backend contracts.

## DevOps

Covers the current topology and environments, containers/IaC/state drift, CI/CD and artifacts, IAM/secrets/
network, observability, rollout/rollback, backup/DR and cost. No external mutation beyond explicit scope;
distinguish static, plan, staging and live proof.

## QA

Maps observable behavior under acceptance and risk to the test layers that prove it, owns deterministic
fixtures, minimal repro and the environment record, and issues `PASS`/`FAIL`/`NEEDS_ENVIRONMENT`. Reads
implementation; never edits it.

## Code Review

Consumes current QA evidence, then reviews implementation through callers, contracts, data, auth, config and
tests; verifies a suspected finding with the narrowest useful check; ranks severity with file:line, trigger,
impact, evidence and remediation; issues `APPROVE`/`CHANGES_REQUESTED`/`NEEDS_EVIDENCE`.

## Universal evidence gate

Every role states versions, environment, commands run, evidence level, residual risk and unverified areas,
and preserves user decisions, existing architecture and role boundaries.
