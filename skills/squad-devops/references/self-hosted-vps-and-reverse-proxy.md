# Self-hosted, VPS, and reverse proxy delivery

Use when the deployment target is a machine the team owns — VPS, dedicated server, homelab or on-prem host
— instead of a managed platform. Self-hosting transfers the control plane, patching, certificate renewal,
backup and recovery from the provider to the team. Treat that transfer as the decisive cost, not the
monthly price.

## When self-hosting fits

Favor it for predictable steady load, egress-heavy or GPU workloads, data residency and compliance control,
software that assumes a persistent filesystem, or when managed pricing dominates the budget without
matching operational value. Avoid it when nobody owns patching and restore, when load is sharply bursty, or
when there is no on-call path. A cheap host with an untested restore costs more than managed hosting.

## Host baseline

Providers include Hetzner, DigitalOcean, Vultr, OVH, Linode/Akamai, Scaleway and colocated hardware; verify
current regions, network and egress limits, backup pricing and IPv6 support at planning time.

- Provision declaratively (cloud-init, Ansible, Terraform provider) so the host can be rebuilt rather than
  repaired from memory. Never let a host be the only copy of its own configuration.
- Restrict SSH to key authentication, disable root password login, and reach admin surfaces through a
  bastion, VPN or WireGuard/Tailscale mesh instead of public exposure.
- Default-deny inbound at both the provider firewall and the host firewall (nftables/ufw); open only 80/443
  and the admin path. The two layers fail independently, so configure both.
- Enable unattended security updates, a reboot policy, time sync, log rotation, and disk/inode alerting. A
  full disk is the most common single-host outage.
- Keep data on volumes separate from the OS disk so a rebuild does not touch state.

## Reverse proxy selection

All four terminate TLS, route by host/path and forward upstream; choose by operating model, not popularity.

| Proxy | Choose when | Cost |
| --- | --- | --- |
| Caddy | Small/medium hosts, automatic HTTPS by default, minimal configuration | Fewer tuning knobs, smaller ecosystem |
| nginx | Existing configs, static/media serving, precise buffering/caching/limit control | Manual ACME wiring, verbose config that fails subtly |
| Traefik | Docker Compose or Kubernetes where routes come from labels/CRDs | Dynamic config is harder to reason about statically |
| HAProxy | L4/L7 load balancing, health checking, deep connection control | No native ACME, not a static file server |

Set explicitly regardless of choice: upstream and client timeouts, request body and header size limits,
compression, HTTP/2, real client IP, and an edge rate limit. Align proxy timeouts with application
timeouts — a proxy that gives up first turns slow requests into 504s with no application trace.

Forwarded headers are trust-sensitive. Accept `X-Forwarded-For`/`Forwarded` only from proxies you control
and strip client-supplied values at the edge; otherwise IP rate limits and audit logs are spoofable.

## TLS and certificates

Use ACME (Let's Encrypt, ZeroSSL) through the proxy's built-in client (Caddy, Traefik) or certbot/lego/
acme.sh for nginx/HAProxy. Prefer HTTP-01 for single public hosts and DNS-01 for wildcards or hosts not
reachable on port 80.

- Test against the ACME staging endpoint first; production rate limits are per-domain and will lock you out.
- Verify renewal actually reloads the proxy. An expired certificate on a renewed file is a config bug, not
  a CA problem — prove it with a forced dry-run renewal, not by confirming a timer exists.
- Monitor expiry from outside the host. An alert served by the certificate it watches fails with it.
- Restrict key permissions, exclude keys from backups that leave the trust boundary, define revocation.
- Decide HSTS deliberately; it is hard to withdraw once cached by clients.

## Process and service management

**systemd** for native processes: `Restart=on-failure`, `RestartSec`, resource limits, a dedicated `User=`
(never root), `ExecReload` for graceful reload, journald for logs, and hardening (`ProtectSystem=strict`,
`PrivateTmp`, `NoNewPrivileges`, `CapabilityBoundingSet`). Take readiness from `Type=notify` or an explicit
health probe, not from process liveness.

**Docker Compose** for containerized stacks: pinned image digests, `restart: unless-stopped`, healthchecks,
resource limits, named volumes for state, a shared proxy network, and env files outside version control.
Run Compose under a systemd unit so the stack returns after host reboot.

Do not mix both for one service. Choose the layer that owns restart, logs and rollout; keep the other out.

## Zero-downtime on a single host

With no load balancer to drain, the proxy is the drain point.

- Run two instances (ports, sockets or Compose services) behind the proxy: start the new one, wait for its
  health check, shift upstream, then stop the old one after connections drain.
- Reload rather than restart the proxy (`nginx -s reload`, `systemctl reload`, Caddy config API), and
  validate config first (`nginx -t`) so a bad config cannot take the site down.
- Handle SIGTERM in the app: stop accepting connections, finish in-flight requests within a bounded grace
  period, exit. Without it, "zero-downtime" only moves the error to the client.
- Run migrations expand-then-contract so both versions work against one database during the shift.
- Keep the previous image/release on disk so rollback is a proxy switch, not a rebuild.

## Self-hosted PaaS

Coolify, Dokploy, CapRover and Dokku wrap the above into a UI or git-push workflow — usually Docker plus a
managed Traefik/nginx and automatic TLS. They remove real toil at the price of a control plane the team must
patch, back up and understand.

Before adopting one, confirm what happens to running apps when the panel is down, where its own state lives
and how it is restored, whether generated proxy config can be inspected and overridden, and whether you can
leave without rewriting deployment. Put the panel behind VPN/SSO, never an open public route. Prefer a panel
over hand-rolled scripts for small teams; prefer plain Compose plus systemd when the panel would be the only
thing that knows how to rebuild the system.

## Backup, restore and recovery

Without managed snapshots, restore is entirely owned by the team.

- Follow 3-2-1: the host, an off-host target (S3/R2/B2), and one copy outside the provider account.
- Use a real backup tool (restic, borg, pgBackRest, database-native dump/streaming) with encryption,
  retention and integrity verification. A filesystem snapshot of a running database is not a consistent
  backup.
- Restore on a schedule to a scratch host and record measured restore time. An untested backup is a
  hypothesis.
- Back up proxy config, systemd units, Compose files, certificate policy and secret material separately
  from application data; rebuilding needs both.
- State RPO/RTO honestly for one host: rebuild is measured in hours, not seconds.

## Observability on one host

Node exporter with Prometheus/Grafana, or a hosted collector, covers CPU, memory, disk and inode, proxy 4xx
and 5xx rates, upstream latency, certificate expiry and backup success. Ship logs off-host or accept losing
them with the host. At minimum alert externally on host-down, disk-near-full, certificate expiry and failed
backup — from outside the host being monitored.

## Selection output

Record host/provider/region, proxy and TLS mechanism, process manager, deploy and rollback path, backup
target with tested restore time, admin access path, patch owner, and the monitoring that detects each of
these failing.
