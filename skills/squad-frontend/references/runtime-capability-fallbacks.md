# Runtime capability fallbacks

Read this reference when AgentKit, specialist skills, named squad gates, Figma MCP, browser inspection, or
test infrastructure is unavailable.

## Rules

- AgentKit, `ak:*`, project harnesses, and squad gates are optional accelerators.
- Inspect live capabilities before invoking anything.
- Never invoke a missing command, claim an unavailable gate ran, or weaken verification silently.
- Never auto-install AgentKit, a skill, MCP server, plugin, or package.
- Follow project instructions when present. Otherwise infer commands and conventions from README,
  manifests, framework config, nearby code, and tests.
- Report only gaps that limit evidence or the requested outcome.

## Capability mapping

| Phase | Preferred when installed | Native fallback |
|---|---|---|
| Frame/plan | `ak:brainstorm`, `ak:plan` | State acceptance criteria and make a proportional plan |
| Scout | `ak:scout` | Search routing, components, API clients, configs, and tests directly |
| Figma | Figma specialist skills | Use available Figma MCP or user-provided structured exports |
| Design | `squad-designer` | Run the bounded inline Designer contract |
| Build/style | Frontend specialist skills | Implement with repository framework, components, and CSS system |
| API/state | Frontend data/state skill | Follow repository fetch, cache, form, validation, and state patterns |
| Docs/contract | Docs specialist, `squad-backend` | Inspect contract and current official docs; report Backend mismatch |
| Debug | Debug/fix skill | Reproduce from logs/browser/tests, isolate cause, and fix directly |
| Verify | Test/web/a11y skills | Run repository tests, lint, type, build, browser, and manual a11y checks |
| Review | `squad-qa`, `squad-code-review` | Run equivalent QA and diff-review checklists directly |
| Commit | Git skill | Use native Git only when the user requests a commit |

## Evidence gaps

If no tool can access required Figma, an API contract, browser state, or test environment, state the exact
limit and request the smallest accessible artifact. Do not invent verification.

When named QA/Review gates are unavailable, report the native checks that actually ran and any unverified
area. Their absence does not remove the quality requirement.
