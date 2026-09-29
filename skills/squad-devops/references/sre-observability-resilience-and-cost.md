# SRE, observability, resilience, and cost

Use for production topology, scaling, observability, incidents, backup/DR and cost-sensitive changes.

## Objectives and observability

Define user-facing SLIs/SLOs with measurement source, window and error budget. Alerts map to actionable
SLO impact and an owned runbook; avoid paging on every resource metric. Service-level RED/USE and traces
belong to the backend; here, add deploy/config/feature-flag/IaC markers alongside the signals, keep labels
low-cardinality and logs redacted, and remember health probes do not replace user-journey/synthetic checks.

## Rollout and resilience

Identify single points, autoscaling lag, and zone/region failure. Use canary, blue-green, rolling or
feature flags according to compatibility and observability; define abort/rollback signals before rollout.
Database/schema/event compatibility constrains rollback: a deployment is not reversible if old code cannot
read new state.

## Backup and disaster recovery

Define recovery point objective (RPO), recovery time objective (RTO), retention, encryption, immutability,
regional/account isolation, dependency/order and owner. A successful backup job is not restore proof.
Perform authorized restore drills and verify application consistency, secrets/keys and DNS/routing.

## Capacity and cost

Autoscaling needs the right metric, target, bounds, cooldown and downstream capacity; load test only in an
authorized environment with stop conditions. Tag ownership/environment, track unit cost and anomalous
spend. Cost reduction must not violate SLO, security, backup or operability.
