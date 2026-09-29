# Security, networking, secrets, and supply chain

Use for any cloud/IaC/pipeline/container change and deepen for public exposure, cross-account access,
production data, privileged CI and multi-tenant infrastructure.

## Identity and secrets

- Prefer workload identity/OIDC and short-lived credentials over static keys; review wildcard
  actions/resources and trust policies, and keep human/break-glass access separate.
- CI fork/PR contexts must not receive privileged secrets or writable production tokens.
- Use managed secret/KMS systems with owner, rotation and revocation. Never put secret values in code,
  images, IaC state/output, CI logs, command history, artifact metadata or client bundles.
- Key rotation and restore/decrypt are part of operability.

## Networking

Minimize public exposure and unrestricted egress. WAF/DDoS/rate limits are layered controls, not
authorization. Zero Trust/access proxies need identity, device/session and recovery design.

## Software supply chain

- Pin/review actions, images, charts, modules/providers and package locks.
- Minimize build context; protect credentials from Docker layers and build cache.
- Generate/retain SBOM and provenance/sign artifacts when required; verify before promotion.
- Scan dependencies/images/IaC/config, but triage exploitability and do not hide failures.
- Treat third-party CI steps and install scripts as code with privileges.

## Evidence

Report exposed endpoints, principals/permissions, secret flow, scan findings, exceptions and rollback.
Never paste live secret/policy dumps with sensitive values.
