# Designer gate and design intake

Read this reference before frontend planning when the request includes a screenshot, link, brief or
Figma, material UI/UX work, a new component pattern, or unclear design input.

## 0. What the Designer stage delivers

The designer hands over presentational component code, not a written spec: files that render, with props
and slots left open for you to bind, plus the rationale behind them. Wire behavior into that code — do not
re-implement the component from the rationale. Behavior is yours: state, data fetching, API integration,
routing, forms submission, and platform lifecycle stay with the build role, so those seams arrive as
props, slots, or callbacks for you to fill. One thing arrives already wired: a component that animates
ships the bookkeeping and mount/unmount cleanup its own motion needs, because motion ownership follows
authorship. That is not product state and does not move to you — remove it and the animation leaks.

Change the presentational layer only where wiring genuinely requires it, and say what you changed. A
visual or interaction gap goes back to the Designer stage instead of being redesigned inside the feature.

## 1. The user's material first

A screenshot, link, brief or accepted Figma the user supplied is the design intent. With Figma MCP
available, inspect components, variants, variables, Auto Layout, constraints, interactions, and assets. Map
the material to repository primitives; do not trigger a redesign merely because implementation is new.

## 2. Trigger Designer

Run the Designer stage only for a design decision still unresolved after the user's material and the
existing system are considered:

- the request asks to design, redesign or modernize, and no material covers it;
- missing responsive behavior, states, flow or accessibility the material leaves open;
- a change to a reusable component pattern, token, navigation model or cross-screen visual language;
- requested UI conflicts with current components or tokens.

Designer activation resolves only those decisions and preserves the material's art direction.

## 3. Do not trigger Designer

With one build owner and no design-system change, do the presentational work inline. Continue directly
also for logic-only work, a narrow bug fix, material that covers the screen, or a small UI change that
follows an established local pattern.

## 4. Routing

- **Solo with `squad-designer`:** load it, take its component code and rationale as the handoff, then
  resume Frontend and wire behavior into what it built.
- **Team mode:** ask the orchestrator to run Designer and wait for the component code.
- **Designer unavailable:** run the bounded inline fallback below. Do not install a skill automatically or
  report the missing skill as a blocker when the fallback can satisfy the task.

## 5. Inline Designer fallback

Produce the same artifact the Designer stage would: presentational components plus the rationale, written
before the behavior wiring, so the boundary survives even without the skill.

1. Resolve the user's material — screenshot, link, brief or Figma.
2. Scout repository components, tokens, styling, layouts, motion, and accessibility patterns.
3. Research task-specific UI/UX only for what both leave open.
4. Decide flow, IA, hierarchy, responsive behavior, content behavior, and every applicable state.
5. Select existing primitives or an approved framework-appropriate greenfield foundation.
6. Build the presentational components against those primitives, with every state reachable from props and
   motion shipping its own teardown and reduced-motion fallback.
7. Record the rationale, tokens, and props surface, then wire behavior into what you built.

If Figma cannot be accessed, request an inspectable export/screenshots rather than inventing details.
