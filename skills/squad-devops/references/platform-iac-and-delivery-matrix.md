# Platform, IaC, and delivery matrix

Use for unfamiliar infrastructure, greenfield topology, provider/service selection, container/serverless,
CI/CD, GitOps or infrastructure-as-code (IaC). Preserve the deployed platform and state ownership unless
migration is explicit.

## Platform families

- **AWS:** broad service depth; resolve account/organization, region, VPC, IAM, tagging, quotas and shared
  responsibility. Choose managed services only with operational/cost/lock-in understanding.
- **Google Cloud:** project/folder/org, region, IAM/service accounts, VPC and managed Cloud Run/GKE/data
  services. Preserve workload identity and quota boundaries.
- **Azure:** tenant/subscription/resource group, Entra identity, regions, VNets and managed compute/data.
- **Cloudflare:** account/zone, Workers/Pages, R2/D1/KV/Durable Objects/Queues, bindings, limits and edge
  consistency/runtime semantics.
- **Self-hosted/VPS/dedicated:** a machine the team owns (Hetzner, DigitalOcean, Vultr, OVH, Scaleway,
  colocation). The team owns the reverse proxy, TLS renewal, process supervision, patching, backup and
  restore. See [self-hosted-vps-and-reverse-proxy.md](self-hosted-vps-and-reverse-proxy.md).
- **On-prem/hybrid/other clouds:** follow existing ownership, network, identity, compliance and operational
  tooling; do not force a hyperscaler model.

## Compute model

Choose from workload shape and operations:

- static/edge functions for event/HTTP work within runtime limits;
- managed containers for stateless services with simpler operations;
- Kubernetes for multi-service scheduling/policy/extensibility when team/platform maturity justifies it;
- VMs or owned hosts for stateful, egress-heavy, residency-bound, GPU or legacy/specialized OS workloads,
  and where predictable load makes managed pricing poor value;
- managed batch/jobs for bounded asynchronous compute.

Understand cold start, concurrency, CPU/memory, ephemeral disk, connection limits, background execution,
autoscaling, state and shutdown semantics. Serverless and Kubernetes are not universal defaults, and a
single owned host is a legitimate greenfield target when someone owns patching and tested restore.

## Containers and Kubernetes

Use reproducible multi-stage builds, non-root users, minimal runtime contents, explicit health, resource
requests/limits, signal handling, read-only filesystem/capability restrictions where compatible, and image
provenance/scanning. Pin base/image by policy and maintain an update path.

Kubernetes requires namespaces/tenancy, RBAC, workload identity, network policy, disruption budgets,
probes/startup, resources/autoscaling, storage, ingress/Gateway, DNS, secrets, scheduling, rollout and
cluster/version lifecycle. Helm/Kustomize/operator choice follows existing conventions.

## IaC and state

Support Terraform/OpenTofu, Pulumi, CloudFormation/CDK, Bicep/ARM or provider-native declarative tooling
already used. Define state backend, encryption/locking, identity, environment/account separation, module
versioning, import/drift, secrets, plan review and destroy protection. Avoid one state file with excessive
blast radius and circular cross-stack outputs.

Plan/diff before apply. Review replacement/destruction, data resources and provider upgrades. Back up or
snapshot stateful resources according to risk and test restoration.

## CI/CD and GitOps

Preserve GitHub Actions, GitLab CI, Jenkins, Buildkite, CircleCI, Azure DevOps or existing system. Pipelines
should be immutable/reproducible, least-privileged, cache-safe, concurrency-controlled and environment-
gated. Separate build artifact from promotion; avoid rebuilding different bits per environment.

GitOps requires a clear source of truth, reconciliation ownership, promotion model, secret strategy,
drift/rollback and emergency change reconciliation. Define provenance/signing, artifact registry,
retention and environment approvals.

## Selection output

Record current topology, chosen/preserved services, constraints, failure/cost/security impact, state and
ownership, migration/rollback, rejected options and proof from current provider docs/plan.
