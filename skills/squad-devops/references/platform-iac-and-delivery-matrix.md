# Platform, IaC, and delivery matrix

Use for unfamiliar infrastructure, greenfield topology, provider/service selection, container/serverless,
CI/CD, GitOps or infrastructure-as-code (IaC). Preserve the deployed platform and state ownership unless
migration is explicit.

## Platform and compute

Resolve the provider's account/organization boundary, region, identity, network, quotas and shared
responsibility before choosing managed services, and follow existing ownership on on-prem/hybrid targets
rather than forcing a hyperscaler model. Serverless and Kubernetes are not universal defaults: Kubernetes
needs team/platform maturity to justify it, and a single owned host is a legitimate greenfield target when
someone owns patching and tested restore (see [self-hosted-vps-and-reverse-proxy.md](self-hosted-vps-and-reverse-proxy.md)).
Understand cold start, concurrency, connection limits, background execution, state and shutdown semantics
of the chosen runtime.

## Containers and Kubernetes

Reproducible multi-stage builds, non-root users, minimal runtime contents, explicit health, resource
requests/limits, signal handling, and image provenance/scanning; pin base images by policy with an update
path. Helm/Kustomize/operator choice follows existing conventions.

## IaC and state

Use the declarative tooling already in place. Define state backend, encryption/locking, environment/account
separation, module versioning, import/drift and destroy protection. Avoid one state file with excessive
blast radius and circular cross-stack outputs.

Plan/diff before apply. Review replacement/destruction, data resources and provider upgrades. Back up or
snapshot stateful resources according to risk and test restoration.

## CI/CD and GitOps

Preserve the existing CI system. Pipelines should be immutable/reproducible, least-privileged,
cache-safe, concurrency-controlled and environment-gated. Separate build artifact from promotion; avoid
rebuilding different bits per environment.

GitOps requires a clear source of truth, reconciliation ownership, promotion model, secret strategy,
drift/rollback and emergency change reconciliation.

## Selection output

Record current topology, chosen/preserved services, constraints, failure/cost/security impact, state and
ownership, migration/rollback, rejected options and proof from current provider docs/plan. A decision
another role implements records what would reopen it, not only what was chosen.
