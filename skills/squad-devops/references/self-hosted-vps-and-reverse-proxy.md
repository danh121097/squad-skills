# Self-hosted, VPS, and reverse proxy delivery

Use when the deployment target is a machine the team owns — VPS, dedicated server, homelab or on-prem host
— instead of a managed platform. Self-hosting transfers the control plane, patching, certificate renewal,
backup and recovery from the provider to the team. Treat that transfer as the decisive cost, not the
monthly price.

## When self-hosting fits

Favor it for predictable steady load, egress-heavy or GPU workloads, data residency, software that assumes
a persistent filesystem, or when managed pricing dominates the budget. Avoid it when nobody owns patching
and restore, when load is sharply bursty, or when there is no on-call path. A cheap host with an untested
restore costs more than managed hosting.

## Host baseline

Verify current regions, egress limits, backup pricing and IPv6 support at planning time.

- Provision declaratively (cloud-init, Ansible, Terraform provider) so the host can be rebuilt rather than
  repaired from memory; never let a host be the only copy of its own configuration.
- Reach admin surfaces through a bastion, VPN or WireGuard/Tailscale mesh, not public exposure; key-only SSH.
- Default-deny inbound at both the provider firewall and the host firewall; open only 80/443 and the admin
  path. The two layers fail independently, so configure both.
- Enable unattended security updates, a reboot policy, log rotation, and disk/inode alerting. A full disk is
  the most common single-host outage.
- Keep data on volumes separate from the OS disk so a rebuild does not touch state.

## Reverse proxy selection

Choose by operating model, not popularity.

| Proxy | Choose when | Cost |
| --- | --- | --- |
| Caddy | Small/medium hosts, automatic HTTPS, minimal configuration | Fewer tuning knobs |
| nginx | Existing configs, static/media serving, precise buffering/caching/limit control | Manual ACME wiring, config that fails subtly |
| Traefik | Docker Compose or Kubernetes where routes come from labels/CRDs | Dynamic config is harder to reason about statically |
| HAProxy | L4/L7 load balancing, health checking, deep connection control | No native ACME, not a static file server |

Set explicitly regardless of choice: upstream and client timeouts, body and header size limits, real client
IP, and an edge rate limit. Align proxy timeouts with application timeouts — a proxy that gives up first
turns slow requests into 504s with no application trace. Accept `X-Forwarded-For`/`Forwarded` only from
proxies you control and strip client-supplied values at the edge.

## TLS and certificates

Use ACME through the proxy's built-in client (Caddy, Traefik) or certbot/lego/acme.sh for nginx/HAProxy;
HTTP-01 for single public hosts, DNS-01 for wildcards or hosts not reachable on port 80.

- Test against the ACME staging endpoint first; production rate limits are per-domain and will lock you out.
- Verify renewal actually reloads the proxy. An expired certificate on a renewed file is a config bug, not
  a CA problem — prove it with a forced dry-run renewal, not by confirming a timer exists.
- Monitor expiry from outside the host. An alert served by the certificate it watches fails with it.
- Exclude keys from backups that leave the trust boundary.
- Decide HSTS deliberately; it is hard to withdraw once cached by clients.

## Process and service management

**systemd** for native processes: `Restart=on-failure`, a dedicated `User=` (never root), `ExecReload` for
graceful reload, and hardening (`ProtectSystem=strict`, `PrivateTmp`, `NoNewPrivileges`). Take readiness
from `Type=notify` or an explicit health probe, not from process liveness.

**Docker Compose** for containerized stacks: pinned image digests, healthchecks, resource limits, named
volumes for state, env files outside version control. Run Compose under a systemd unit so the stack returns
after host reboot.

Do not mix both for one service. Choose the layer that owns restart, logs and rollout; keep the other out.

## Zero-downtime on a single host

With no load balancer to drain, the proxy is the drain point.

- Run two instances behind the proxy: start the new one, wait for its health check, shift upstream, then
  stop the old one after connections drain.
- Reload rather than restart the proxy, and validate config first (`nginx -t`) so a bad config cannot take
  the site down.
- The app must drain on SIGTERM within a bounded grace period; without it, "zero-downtime" only moves the
  error to the client.
- Migrations run expand-then-contract so both versions work against one database during the shift.
- Keep the previous image/release on disk so rollback is a proxy switch, not a rebuild.

## Self-hosted PaaS

Coolify, Dokploy, CapRover and Dokku remove real toil at the price of a control plane the team must patch,
back up and understand. Before adopting one, confirm what happens to running apps when the panel is down,
where its own state lives and how it is restored, whether generated proxy config can be inspected and
overridden, and whether you can leave without rewriting deployment. Put the panel behind VPN/SSO. Prefer
plain Compose plus systemd when the panel would be the only thing that knows how to rebuild the system.

## Backup, restore and recovery

Without managed snapshots, restore is entirely owned by the team.

- Follow 3-2-1: the host, an off-host target, and one copy outside the provider account.
- Use a real backup tool (restic, borg, pgBackRest, database-native dump/streaming) with encryption,
  retention and integrity verification. A filesystem snapshot of a running database is not a consistent
  backup.
- Restore on a schedule to a scratch host and record measured restore time. An untested backup is a
  hypothesis.
- Back up proxy config, systemd units, Compose files, certificate policy and secret material separately
  from application data; rebuilding needs both.
- State RPO/RTO honestly for one host: rebuild is measured in hours, not seconds.

At minimum alert externally on host-down, disk-near-full, certificate expiry and failed backup, and ship
logs off-host or accept losing them with the host.

## Selection output

Record host/provider/region, proxy and TLS mechanism, process manager, deploy and rollback path, backup
target with tested restore time, admin access path, patch owner, and the monitoring that detects each of
these failing.
