# SRE, observability, resilience, and cost

Use for production topology, scaling, observability, incidents, backup/DR and cost-sensitive changes.

## Service objectives

Define user-facing service level indicators/objectives (SLIs/SLOs): availability, latency, correctness,
freshness/durability or job completion. Set measurement source/window and error budget. Alerts should map to
actionable user/SLO impact and an owned runbook; avoid paging on every resource metric.

## Observability

- Metrics: RED for services, USE for resources, queue lag, saturation and business critical outcomes.
- Logs: structured, correlated, sampled/retained intentionally, redacted and low enough volume/cost.
- Traces: critical cross-service paths and dependency timing with OpenTelemetry/repository standard.
- Events/deploy markers: config/release/feature flag/IaC changes visible alongside signals.

Use stable low-cardinality labels. Dashboards support diagnosis; alerts encode action. Health probes do not
replace user-journey/synthetic checks.

## Resilience and rollout

Identify single points, dependency failure modes, timeout/retry/circuit/bulkhead/load-shed behavior,
autoscaling lag, regional/zone failure and capacity buffers. Use canary, blue-green, rolling or feature
flags according to compatibility and observability. Define abort/rollback signals before rollout.

Database/schema/event compatibility constrains rollback. A deployment is not reversible if old code cannot
read new state. Test graceful shutdown, draining and dependency degradation.

## Backup and disaster recovery

Define recovery point objective (RPO), recovery time objective (RTO), retention, encryption, immutability,
regional/account isolation, dependency/order and owner. A successful backup job is not restore proof.
Perform authorized restore drills and verify application consistency, secrets/keys and DNS/routing.

## Capacity

Model traffic/data growth, burst, concurrency, CPU/memory, connection pools, DB/broker/cache/storage/network
and provider quotas. Autoscaling needs correct metric, target, bounds, cooldown and downstream capacity.
Load test representative workload with stop conditions in authorized environment.

## FinOps

Tag/label ownership/environment/product; track unit cost and anomalous spend. Evaluate requests/limits,
autoscaling floor/ceiling, storage class/retention, egress, logs/traces, idle resources, managed-service
pricing and commitments. Cost reduction must not violate SLO, security, backup or operability.

## Incident readiness

Maintain runbooks, ownership/escalation, access, safe diagnostic commands, communication, mitigation,
rollback and evidence preservation. During incidents prioritize user harm containment and reversible
actions; document timeline and follow with cause-focused learning, not blame.
