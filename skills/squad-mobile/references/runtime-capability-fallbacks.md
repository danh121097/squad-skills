# Runtime capability fallbacks

Read when AgentKit, a mobile specialist, Designer, device/emulator, docs lookup, QA, or Review is missing.

## Rules

- AgentKit and named specialist skills are optional; inspect the live catalog before invocation.
- Preserve design, lifecycle, security, accessibility and verification outcomes through native tools.
- Never auto-install a skill, SDK, package, native module, emulator image, plugin, or MCP server.
- Follow repository and platform versions; use current official docs for unstable APIs.
- Report only evidence gaps that affect confidence or completion.

## Capability mapping

| Phase | Preferred when installed | Native fallback |
|---|---|---|
| Scout/plan | `ak:scout`, `ak:plan`, `ak:scenario` | Inspect app files/configs/tests and model edge cases directly |
| Design | `squad-designer`, design skills | Use accepted source or run bounded inline design contract |
| Build | Mobile specialist | Follow repository framework and platform-native APIs |
| Contract | `squad-backend`, docs specialist | Inspect API schema/client and official docs; report mismatch |
| Debug | Debug/fix skill | Reproduce on available target, logs and tests; isolate cause directly |
| Verify | Test/mobile/browser skills | Run native repository suites and available simulator/device checks |
| Review gates | `squad-qa`, `squad-code-review` | Run separate native QA/review passes; disclose reduced independence |

## Target unavailable

Do not claim device, OS, push, purchase, deep-link or background behavior was verified without the target.
Run the strongest static/unit/build checks available, state the exact gap, and request the smallest safe
target or artifact needed.
