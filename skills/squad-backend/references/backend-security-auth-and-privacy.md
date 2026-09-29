# Backend security, authentication, and privacy

Use for every externally reachable or sensitive backend change; increase depth for identity, payments,
admin, multi-tenant, upload, URL fetch, secrets and data export paths.

## Input and output

- Parameterize SQL/NoSQL; avoid unsafe dynamic query, shell, template and deserialization paths.
- Uploads: size/type/content validation, randomized storage names, quarantine/scanning, non-executable
  serving and access control.
- Outbound URLs: allowlisted schemes/hosts, DNS/IP revalidation, private-network blocking, redirect and
  response-size/time limits to mitigate SSRF.

## AuthN and sessions

Use established libraries/providers and current OAuth/OIDC/WebAuthn guidance. Validate issuer, audience,
signature algorithm, expiry/not-before and key rotation. Keep access tokens short-lived according to risk;
rotate refresh/session credentials and revoke on compromise. Cookies require Secure, HttpOnly, appropriate
SameSite, CSRF defense and session fixation prevention. Passwords use a current memory-hard hash with
calibrated cost. Never invent crypto or store recovery secrets reversibly without a documented requirement.

## Authorization

Enforce on every server-side object/action/field, preferring explicit policies over scattered role checks.
Verify tenant/resource ownership after canonical lookup; avoid IDOR/BOLA, confused deputy and mass
assignment. Audit privileged actions. Test negative cross-role/cross-tenant cases.

## Secrets and supply chain

Use managed secret storage and workload identity where available. Never log values or expose them to client
bundles. What is prohibited is unintended disclosure: a token minted for the caller that authenticated is
the protocol; the same token in a log, an error body, a response to another caller or a committed fixture is
a leak. Fixtures carry synthetic values. Review dependency install scripts and scan lockfiles.

## Privacy and abuse

Classify data, minimize collection, define retention/deletion/export, and redact logs and backups; backups
and analytics are part of deletion and breach scope. Rate limits use identity/resource/action dimensions
with safe distributed enforcement. Protect login, password reset, invitations, search, exports, webhooks
and expensive GraphQL operations from enumeration and resource exhaustion.

## Security evidence

Provide threat assumptions, controls, negative tests, scanner/dependency results and residual risks. Do not
claim OWASP compliance from a checklist alone.
