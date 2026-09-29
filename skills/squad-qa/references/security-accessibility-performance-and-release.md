# Security, accessibility, performance, and release quality

Use when the change crosses trust boundaries, affects user interaction/performance, or approaches release.

## Security testing

Derive abuse cases from the threat model; test authorization and tenant isolation negatively. Use
SAST/SCA/secret/IaC/container/DAST/fuzz tools as evidence sources, not automatic verdicts. Run invasive
scans only on authorized targets with stop conditions, include no exploit payloads against out-of-scope
systems, and redact reports.

## Accessibility testing

Combine accessibility-tree inspection, keyboard/focus, zoom/reflow, contrast, reduced motion and realistic
screen-reader paths (VoiceOver/TalkBack on mobile). Automated axe-like checks catch only part of WCAG;
custom widgets follow WAI-ARIA APG interaction patterns.

## Performance and load

Start from SLI/SLO and a representative journey or workload. Record environment, data, build mode,
network/device, baseline and saturation. Ramp gradually with thresholds and stop conditions, and observe
recovery after load. Never load-test production without explicit authorization.

## Visual and cross-platform

Visual regression uses stable fonts/data/viewport/animation and masks only truly nondeterministic regions;
pixel equality is not usability. The cross-browser/device/OS matrix follows product support and risk.

## Release and operational verification

Verify build artifact, configuration, migrations, feature flags, health/readiness, telemetry, rollback and
critical smoke journeys at the authorized level. Separate local/static, staging, beta and production
evidence. Release criteria include unresolved defects, known residual risk and monitoring owner.
Security/data loss, acceptance failure and unrecoverable deployment risk block release; lower risks are
ranked and owned.
