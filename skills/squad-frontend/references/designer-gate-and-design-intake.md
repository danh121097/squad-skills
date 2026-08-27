# Designer gate and design intake

Read this reference before frontend planning when the request includes Figma, material UI/UX work, a new
component pattern, or unclear design input.

## 0. What the Designer stage delivers

The designer hands over presentational component code, not a written spec: files that render, with props
and slots left open for you to bind, plus the rationale behind them. Wire behavior into that code — do not
re-implement the component from the rationale. Behavior is yours: state, data fetching, API integration,
routing, forms submission, and platform lifecycle stay with the build role, so those seams arrive as
props, slots, or callbacks for you to fill.

Change the presentational layer only where wiring genuinely requires it, and say what you changed. A
visual or interaction gap goes back to the Designer stage instead of being redesigned inside the feature.

## 1. Accepted Figma

Treat a user-identified accepted Figma file/frame as the primary design intent. Use available Figma MCP to
inspect components, variants, variables, Auto Layout, constraints, interactions, and assets. Map them to
repository primitives; do not trigger a full redesign merely because implementation is new.

Trigger Designer only for material gaps: missing responsive behavior, loading/error/empty states,
ambiguous flow, accessibility conflicts, or a design-system mismatch. Limit the handoff to those gaps and
preserve the accepted art direction.

## 2. Trigger Designer

Run the Designer stage first when any condition applies:

- The request asks to design, redesign, beautify, modernize, improve UX/hierarchy, add substantial motion,
  or define responsive behavior.
- No accepted source exists and material flow, IA, layout, hierarchy, component, state, token, or
  interaction decisions remain.
- The feature changes a reusable component pattern, token, navigation model, form pattern, accessibility
  behavior, or cross-screen visual language.
- Requested UI conflicts with current components/tokens and requires a design decision.

Designer activation resolves only decisions required by the frontend task; it does not expand scope.

## 3. Do not trigger Designer

Continue directly for logic-only work, a narrow bug fix, a complete accepted design, or a small UI change
that exactly follows an established local pattern.

## 4. Routing

- **Solo with `squad-designer`:** load it, take its component code and rationale as the handoff, then
  resume Frontend and wire behavior into what it built.
- **Team mode:** ask the orchestrator to run Designer and wait for the component code.
- **Designer unavailable:** run the bounded inline fallback below. Do not install a skill automatically or
  report the missing skill as a blocker when the fallback can satisfy the task.

## 5. Inline Designer fallback

Produce the same artifact the Designer stage would: presentational components plus the rationale, written
before the behavior wiring, so the boundary survives even without the skill.

1. Resolve Figma or another accepted source.
2. Scout repository components, tokens, styling, layouts, motion, and accessibility patterns.
3. If no accepted design exists, research task-specific UI/UX and real-product flows when material design
   decisions are required.
4. Decide flow, IA, hierarchy, responsive behavior, content behavior, and every applicable state.
5. Select existing primitives or an approved framework-appropriate greenfield foundation.
6. Build the presentational components against those primitives, with every state reachable from props and
   motion shipping its own teardown and reduced-motion fallback.
7. Record the rationale, tokens, and props surface, then wire behavior into what you built.

If Figma cannot be accessed, request an inspectable export/screenshots rather than inventing details.
