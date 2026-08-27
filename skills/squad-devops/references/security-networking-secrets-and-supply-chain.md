# Security, networking, secrets, and supply chain

Use for any cloud/IaC/pipeline/container change and deepen for public exposure, cross-account access,
production data, privileged CI and multi-tenant infrastructure.

## Identity and IAM

- Prefer workload identity/OIDC and short-lived credentials over static keys.
- Scope principals by environment/workload/action/resource and separate human/break-glass access.
- Deny public/privileged access by default; review wildcard actions/resources and trust policies.
- Protect organization/account/project boundaries, MFA, session duration and audit logs.
- CI fork/PR contexts must not receive privileged secrets or writable production tokens.

## Secrets and encryption

Use managed secret/KMS systems; define owner, rotation, revocation, access audit and failure behavior.
Never put secret values in code, images, IaC state/output, CI logs, command history, artifact metadata or
client bundles. Encrypt state/backups/storage and network paths according to threat/compliance. Key
rotation and restore/decrypt are part of operability.

## Networking

Model trust zones, ingress/egress, DNS, TLS termination, private endpoints, NAT, firewall/security groups,
network policies, service identity and admin access. Minimize public exposure and unrestricted egress.
Validate proxy/client IP assumptions, forwarded headers, IPv6, split DNS, certificates and health checks.

Use WAF/DDoS/rate limits as layered controls, not authorization. Zero Trust/access proxies need identity,
device/session and recovery design.

## Multi-tenancy and data boundaries

Separate accounts/projects/namespaces/keys/data according to risk. Define noisy-neighbor quotas, tenant
labels/log access, backup/restore and incident blast radius. Shared clusters/services need explicit policy
and resource isolation.

## Software supply chain

- Pin/review actions, images, charts, modules/providers and package locks according to ecosystem.
- Minimize build context; protect credentials from Docker layers and build cache.
- Generate/retain SBOM and provenance/sign artifacts when required; verify before promotion.
- Scan dependencies/images/IaC/config, but triage exploitability and do not hide failures.
- Secure registries, branch protections, release identity and artifact immutability.
- Treat third-party CI steps and install scripts as code with privileges.

## Kubernetes/container hardening

Use non-root, least Linux capabilities, seccomp/AppArmor/SELinux where supported, restricted host access,
read-only filesystem where compatible, resource limits, admission policies and network segmentation.
Secrets mounted/environment both require process/log/debug protection.

## Evidence

Report trust diagram, exposed endpoints, principals/permissions, secret flow, encryption, scan findings,
exceptions, audit/alert signals and rollback. Never paste live secret/policy dumps with sensitive values.
