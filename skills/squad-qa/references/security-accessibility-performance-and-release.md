# Security, accessibility, performance, and release quality

Use when the change crosses trust boundaries, affects user interaction/performance, or approaches release.

## Security testing

Derive abuse cases from threat model; test authorization and tenant isolation negatively. Cover input/
encoding/injection, SSRF, upload, redirect, mass assignment, rate/quota/resource exhaustion, auth/session/
recovery, CSRF/CORS, secret/log leakage, dependency/config and unsafe error behavior according to scope.

Use SAST/SCA/secret/IaC/container/DAST/fuzz tools as evidence sources, not automatic verdicts. Run invasive
scans only on authorized targets with stop conditions. Do not include exploit payloads against systems
outside scope. Redact reports.

## Accessibility testing

Combine semantic/accessibility-tree inspection, keyboard/focus, zoom/reflow, contrast, target size, text
spacing/scaling, reduced motion, error/announcement and realistic screen-reader paths. Automated axe-like
checks catch only part of WCAG; custom widgets follow WAI-ARIA APG interaction patterns. Mobile includes
VoiceOver/TalkBack and platform accessibility scanners where available.

## Performance and load

Start from SLI/SLO and representative journey/workload. Record environment, data, build mode, network/
device, baseline and saturation. Browser: Core Web Vitals/interaction, bundle/network/render/memory and
layout shift. Backend: latency percentiles, throughput, errors, CPU/memory/pools/DB/queue. Mobile: launch,
jank, memory, battery/network/app size.

Ramp gradually, define thresholds/stop conditions, warm/cold cache, steady/soak/spike as justified, and
observe recovery after load. Never load-test production without explicit authorization.

## Visual and cross-platform

Visual regression uses stable fonts/data/viewport/animation and masks only truly nondeterministic regions.
Review diffs for intent; pixel equality is not usability. Cross-browser/device/OS matrix follows product
support and risk. Cover touch/hover/keyboard, responsive/adaptive layout, locale/RTL, dark/high contrast and
reduced motion as applicable.

## Release and operational verification

Verify build artifact, configuration, migrations, feature flags, health/readiness, telemetry, rollback and
critical smoke journeys at the authorized level. Separate local/static, staging, beta and production
evidence. Release criteria include unresolved defects, known residual risk and monitoring owner.

## Verdict impact

Required environment unavailable means `NEEDS_ENVIRONMENT`, not inferred PASS or an unproven FAIL. Use
`FAIL` when available evidence demonstrates a defect or unmet criterion. Security/data loss, acceptance
failure and unrecoverable deployment risk block release; lower risks must be ranked and owned.
