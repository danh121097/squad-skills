# Runtime capability pairing and fallbacks

Read before selecting tools for a phase, and whenever a mobile specialist, Designer,
device/emulator, docs lookup, QA, or Review is in question.

## Specialist skill pairing

Pair a specialist skill found by inspecting the live skill catalog for the capabilities below; this
role's boundary, gates, and evidence rules stay authoritative wherever the two disagree. When it is
absent, run the native fallback at the same standard; never auto-install one, and never report a skill as
run when it does not exist.

## Rules

- Inspect the live catalog before invoking any named skill.
- Preserve design, lifecycle, security, accessibility and verification outcomes through native tools.
- Never auto-install a skill, SDK, package, native module, emulator image, plugin, or MCP server.
- Follow repository and platform versions; use current official docs for unstable APIs.
- Report only evidence gaps that affect confidence or completion.

## Capability mapping

| Phase | Pair when installed | Native fallback |
|---|---|---|
| Scout/plan | Scout/plan/scenario skills | Inspect app files/configs/tests and model edge cases directly |
| Design | `squad-designer`; `ui-ux-pro-max` as reference data only | Use accepted source or build the presentational layer inline before wiring behavior |
| Build | Mobile specialist | Follow repository framework and platform-native APIs |
| Contract | `squad-backend`, docs specialist | Inspect API schema/client and official docs; report mismatch |
| Debug | Debug/fix skill | Reproduce on available target, logs and tests; isolate cause directly |
| Verify | Test/mobile/browser skills | Run native repository suites and available simulator/device checks |
| Review gates | `squad-qa`, `squad-code-review` | Run separate native QA/review passes; disclose reduced independence |

## Target unavailable

Do not claim device, OS, push, purchase, deep-link or background behavior was verified without the target.
Run the strongest static/unit/build checks available, state the exact gap, and request the smallest safe
target or artifact needed.
