# Runtime capability fallbacks

Read this reference when AgentKit, a preferred specialist skill, Figma MCP, browser research, or another
named capability is unavailable.

## Rules

- AgentKit, `ak:*` skills, project harnesses, and named agent runtimes are optional accelerators.
- Inspect the live capability catalog before invoking anything.
- Never invoke a missing command, pretend a capability ran, or lower the handoff standard.
- Never auto-install AgentKit, a skill, plugin, MCP server, or package.
- Report a gap only when it limits evidence or the requested output—not merely because an alias is absent.
- Follow project-local instructions when present. Otherwise infer conventions from repository evidence.

## Capability mapping

| Phase | Preferred when installed | Native fallback |
|---|---|---|
| Frame | Outcome-framing or ideation capability | State outcome, constraints, non-goals, and acceptance criteria directly |
| Figma | Figma design-to-code/MCP capability | Use available Figma MCP or an inspectable user export |
| Scout | Repository scouting/navigation capability | Search files; inspect components, tokens, configs, routes, and tests |
| UI/UX research | Web/browser research capability | Use available web/browser/image search and retain source links |
| UX strategy | Product-design or UX-analysis capability | Model flow, IA, states, recovery, interaction, and accessibility inline |
| Design system | Design-system or UI-styling capability | Derive token/component mapping from the repository and framework |
| High fidelity | UI design, prototyping or image-generation capability | Build the presentational components directly; add a wireframe or preview only as supporting evidence |
| Motion | Motion design, animation or motion-review capability | Select CSS, Motion, or GSAP and define the full behavior contract |
| Accessibility | Accessibility/interface-guideline review capability | Review directly against WCAG 2.2 and platform semantics |
| Presentation | Preview or showcase capability | Deliver the component files plus a short Markdown rationale; add visuals only when useful |

Resolve these descriptions against the runtime's live catalog. Product or skill names are examples only
when actually installed; never make the fallback contract depend on an alias.

## Figma unavailable

If specialist Figma skills are missing, use the available Figma MCP directly. If neither MCP nor an
inspectable export is available, request a frame export, screenshots, or shareable source rather than
inventing structured details.

## Research unavailable

Use accessible user-provided references or direct product evidence. State what could not be verified. Do
not bypass account, subscription, or access controls on Mobbin, Pinterest, or other sources.
