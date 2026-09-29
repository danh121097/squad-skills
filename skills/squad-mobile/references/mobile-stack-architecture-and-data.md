# Mobile stack, architecture, and data

Use for unfamiliar mobile stacks, greenfield selection, architecture, navigation, state, networking and
offline/sync. Preserve an existing app stack unless migration is explicit.

## Stack choice

Choose from product/platform reach, team expertise, required native SDKs, UI fidelity, performance, app size,
release independence, accessibility, debugging, build/release tooling and long-term ownership. Validate
critical SDK/plugin compatibility with a prototype; avoid popularity/adoption percentages. A cross-platform
stack still needs platform-specific code, testing and store policy work.

## Architecture

Preserve the repository architecture and its boundaries between presentation, navigation, domain rules,
data/repositories, platform services and external SDKs. Do not add layers that only forward calls.

State ownership distinguishes ephemeral UI, navigation/deep-link, form draft, server cache, authenticated
session/permissions, persisted preference, offline authoritative draft and sync metadata. Keep derived state
derived. Never assume an in-memory navigation/state store survives OS reclamation.

## Networking

Use the repository client and Backend contract. Define timeout, cancellation, retry budget, idempotency,
pagination, auth refresh single-flight, cache freshness and error mapping. Avoid duplicate requests on
recomposition/re-render/lifecycle callbacks; respect radio/battery cost and metered networks.

## Offline and synchronization

Decide whether offline is read cache, queued mutation, local-first authoritative data or not supported.
Specify schema/version migration, operation IDs, pending/failed state, ordering, retry/backoff, dedupe,
conflict policy, tombstones/deletes, clock assumptions, attachment handling, partial sync and user recovery.

Encrypt sensitive local data as required and clear account-scoped state on logout. Test airplane/slow/flapping
network, process death during sync, duplicate delivery and old-client/new-server compatibility.

## Native integrations

Wrap push, deep links, camera/files, location, biometrics, background tasks, Bluetooth and analytics behind
narrow platform contracts. Model permission/restriction and unavailable hardware; do not keep services alive
past platform background limits without a product requirement.

## Selection output

Record the app stack chosen or preserved, the architecture, state and navigation model, the offline
posture decided above, the alternatives rejected, and the constraint that decided each. A decision
another role implements records what would reopen it, not only what was chosen.
