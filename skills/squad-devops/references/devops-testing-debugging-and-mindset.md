# DevOps testing, debugging, and mindset

Use for validating infrastructure/delivery changes, diagnosing pipeline/deploy failures and making
production engineering decisions.

## Validation ladder

Run the highest safe level in order and report each separately:

1. Format/lint/schema/static policy and secret checks.
2. Unit tests for modules/pipeline scripts and template rendering.
3. Container build/run and image inspection/scan.
4. IaC validate/plan, manifest render/diff and policy checks.
5. Ephemeral/integration environment and smoke/contract checks.
6. Approved staged deployment with health/SLO/rollback observation.
7. Production verification only when authorized.

Test destructive/replacement paths, permissions, network isolation, secret references, probes, resources,
autoscaling, failure/rollback and stateful restore. Do not use production as the first integration test.

## Debugging method

1. Resolve exact run/deploy ID, commit/artifact digest, environment/account/region and first failed stage.
2. Compare desired config, rendered plan/manifest and live state; inspect recent drift/change/audit events.
3. Trace identity/permissions, DNS/network/TLS, image/artifact, scheduler/runtime, health and dependency path.
4. Form one hypothesis and run the least-mutating discriminating command.
5. Fix source, rerun from the required gate, verify rollout and rollback signals.

Classify pipeline failures as source/test, dependency/cache, runner capacity, secret/permission, artifact,
provider quota, network, configuration, drift, deploy health or flaky external service. Redact all output.

## Infrastructure code quality

Keep modules cohesive with explicit inputs/outputs, safe defaults and bounded blast radius. Avoid clever
dynamic IaC, hidden provider behavior and copy-pasted environments. Version modules/providers deliberately;
document ownership and non-obvious lifecycle/ignore/destroy protections. Generated manifests are reviewed
through their source plus rendered diff.

## DevOps mindset

- Production is a socio-technical system: optimize operability and recovery, not deployment alone.
- Prefer declarative, reproducible, reviewable paths; reconcile emergency changes afterward.
- Assume partial failure, expired credentials, quotas, drift and stale documentation.
- Make irreversible/high-blast-radius actions explicit and gated.
- Separate build from release and deployment from exposure.
- Minimize toil through automation only after understanding the manual failure path.
- Capacity, security, reliability and cost are coupled trade-offs.
- Evidence level matters: static, plan, staging and production are not interchangeable.

Completion requires fresh validation outputs, exact target, authorization, rollback readiness and honest
live-verification limits.
