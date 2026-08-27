# Backend security, authentication, and privacy

Use for every externally reachable or sensitive backend change; increase depth for identity, payments,
admin, multi-tenant, upload, URL fetch, secrets and data export paths.

## Threat model

Identify assets, actors, trust boundaries, entry/egress points, tenant boundaries, third parties, abuse
cases and blast radius. Apply deny-by-default, least privilege, defense in depth, safe failure and auditable
administrative action. Separate authentication, authorization and business invariants.

## Input and output security

- Validate type, structure, size, encoding, ranges, identifiers and cross-field invariants at boundaries.
- Parameterize SQL/NoSQL; avoid unsafe dynamic query, shell, template and deserialization paths.
- For uploads: size/type/content validation, randomized storage names, quarantine/scanning, non-executable
  serving and access control.
- For outbound URLs: allowlisted schemes/hosts, DNS/IP revalidation, private-network blocking, redirects and
  response-size/time limits to mitigate SSRF.
- Encode output for its sink; return minimal errors; avoid sensitive data in logs/telemetry.

## AuthN and sessions

Use established libraries/providers and current OAuth/OIDC/WebAuthn guidance. Validate issuer, audience,
signature algorithm, expiry/not-before and key rotation. Keep access tokens short-lived according to risk;
protect and rotate refresh/session credentials; revoke on compromise. Cookies require Secure, HttpOnly,
appropriate SameSite, CSRF defense and session fixation prevention.

Passwords use a current memory-hard password hashing recommendation and calibrated cost; support breach
response, MFA/recovery and credential-stuffing defenses. Never invent crypto or store recovery secrets
reversibly without a documented requirement.

## Authorization

Enforce on every server-side object/action/field. Prefer explicit permissions/policies over scattered role
checks. Verify tenant/resource ownership after canonical lookup; avoid IDOR/BOLA, confused deputy and mass
assignment. Audit privileged actions and policy changes. Test negative cross-role/cross-tenant cases.

## Secrets, keys, and supply chain

Use managed secret storage and workload identity where available; scope, rotate and audit access. Never
log values or expose them to client bundles. Pin/verify dependencies according to ecosystem, review install
scripts, scan lockfiles/images and protect CI provenance/signing paths.

## Privacy and data lifecycle

Classify data, minimize collection, define purpose/retention/deletion/export, encrypt appropriately, redact
logs and backups, and restrict support/admin access. Model consent and regional/storage constraints when
required. Backups and analytics are part of deletion and breach scope.

## Abuse and resilience

Rate limits use identity/resource/action dimensions and safe distributed enforcement. Add quotas, cost
limits, pagination/body bounds and timeouts. Protect login, password reset, invitations, search, exports,
webhooks and expensive GraphQL operations from enumeration and resource exhaustion.

## Security evidence

Provide threat assumptions, controls, negative tests, scanner/dependency results, residual risks, secret
handling, incident signals and response/rollback. Do not claim OWASP compliance from a checklist alone.
