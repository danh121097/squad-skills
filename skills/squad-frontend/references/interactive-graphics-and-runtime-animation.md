# Interactive graphics, browser games, and runtime animation

Read for browser games or Three.js, Phaser, PixiJS and Rive runtime work. Use the repository's installed
version and matching official documentation; preserve an established engine and integration before
proposing another.

## Select the smallest capable runtime

- **DOM, SVG, CSS or Motion:** ordinary interface animation, semantic content and lightweight data-driven
  visuals. Keep content in the document when a canvas runtime adds no product capability.
- **Three.js:** 3D games and spatial experiences needing scenes, cameras, lighting, materials, models,
  post-processing or custom shaders. It is a 3D library, so the game still owns input, collision/physics,
  navigation, simulation and content architecture it requires.
- **Phaser:** 2D browser games needing scenes, asset loading, unified input, cameras, audio, tweens or physics
  as one coordinated game framework.
- **PixiJS:** 2D games, sprites, scene graphs, filters and graphics-heavy canvas experiences. It is a
  rendering engine; add only the game-state, physics, audio or scene architecture the product needs.
- **Rive:** interactive game UI, characters, animated assets and state machines delivered as `.riv` files to
  apps, games or custom engines. It complements rather than replaces the game's simulation and world systems.

Choose from demonstrated requirements, repository fit, target browsers/devices, accessibility fallback,
bundle/WASM cost and team capability. Record why a simpler platform primitive or an existing dependency was
insufficient before requesting approval for a new runtime.

## Preserve the design/runtime boundary

Designer owns visual intent, artboard and state-machine contract, named inputs, layout behavior and the
reduced-motion alternative. Frontend owns framework mounting, product-state binding, input routing,
responsive sizing, loading/failure behavior, performance and cleanup. Product state stays in the app; bind it
to Rive inputs or renderer objects at one adapter seam instead of recreating application rules inside an
animation state machine.

Treat scene, artboard, asset and input names as contracts. Validate them at load time and surface a useful
fallback when an export changes. Keep engine objects behind one component/module boundary; the rest of the
application consumes typed domain commands and events rather than renderer internals.

## Model the game outside the renderer

Keep simulation, rules and persistence separate from drawing. A render object may project an entity but is
not the authoritative entity itself. Model game state, scene transitions, pause/resume, restart, win/loss,
checkpoints/save versions and content loading explicitly. In an online game, the server remains authoritative
for identity, inventory, economy, matchmaking and competitive outcomes; client prediction never becomes an
authorization boundary.

Advance simulation with a bounded delta or fixed step where determinism matters, then interpolate rendering.
Cap catch-up after tab suspension instead of replaying an unbounded backlog. Abstract keyboard, pointer,
touch and gamepad into game actions so device bindings do not leak into rules. Define which layer owns focus,
page scrolling and pause when the canvas loses visibility or input capture.

Phaser supplies many game systems but each Scene still gets an explicit lifecycle and communication boundary.
Three.js and PixiJS require deliberate choices for collision/physics, ECS, navigation, audio and asset/world
streaming; absence is a valid choice when the game does not need one. Rive state machines own presentation
transitions; gameplay rules stay in code and drive their named inputs.

## Own one lifecycle

- Create browser-only runtimes after the canvas/container mounts. Guard asynchronous loaders against stale
  component instances and late completion after navigation.
- Let one runtime own the frame clock: Three.js `setAnimationLoop`, Phaser's game step, PixiJS's ticker or
  Rive's runtime loop. Integrate external simulation deliberately rather than stacking independent
  `requestAnimationFrame` loops.
- Size from the container with observable resize state. Separate CSS size from drawing-buffer size, cap
  device-pixel ratio to the measured budget, and update camera/projection/layout after resize.
- Pause work when hidden or offscreen when product semantics allow it. Resume from explicit state rather than
  advancing a hidden simulation by an unbounded delta.
- Teardown symmetrically. Remove listeners, observers, timers, loaders and input bindings. Dispose owned
  Three.js geometries, materials, textures, render targets and renderer resources; destroy the Phaser game or
  owned scenes; destroy the PixiJS application and unload only assets this owner controls; call Rive
  `cleanup()` when its instance leaves the UI. Shared assets need explicit cache/reference ownership.
- Handle WebGL context loss and restoration where continuity matters; otherwise show the accepted static or
  semantic fallback and recover on remount.

## Assets and trust boundaries

Load models, textures, atlases, fonts, audio, `.riv` files and WASM through explicit manifests or trusted
URLs with progress, timeout, decode and error states. Verify CORS, content type, cache policy and size before
parsing. External assets and metadata are untrusted input; keep credentials out of client URLs and reject
unsupported or unexpectedly large payloads at the boundary available to the application.

Preload only what the first interaction needs. Lazy-load routes, runtimes and optional scenes; use atlases,
compressed textures/models and shared parsed assets only when measurements justify their lifecycle cost.

## Accessibility and interaction

A canvas is not a semantic interface. Provide DOM controls, names, instructions, focus order, status and
equivalent outcomes for essential actions; keep critical product content reachable without interpreting
pixels. Support the accepted keyboard, pointer, touch and gamepad paths without hover-only behavior. PixiJS's
opt-in accessibility overlay can expose selected objects, but still verify the resulting DOM and focus path.

Reduced motion preserves meaning and reachability: disable camera shake, parallax and nonessential continuous
motion; offer pause/stop for continuing animation; replace essential motion with an accepted static or lower-
motion state. Prevent canvas input from trapping page scroll, browser shortcuts or assistive navigation.

## Performance and verification

Set budgets from the target experience and measure a production build. Inspect main-thread/frame time, long
tasks, memory/GPU growth, draw calls, scene/object count, triangles, overdraw, texture dimensions, DPR,
bundle/WASM transfer and decode/startup time as applicable. Avoid per-frame allocation and reactive framework
updates; batch/cull/atlas/instance only against a measured bottleneck.

Keep simulation and state transitions deterministic outside rendering where possible. Test fixed-step logic,
seed randomness, and cover scene changes, pause/resume/restart, win/loss, save migration, asset failure,
resize/DPR, visibility, input modalities, route mount/unmount and repeated creation/destruction. Test online
authority, latency/reconnect and duplicate/out-of-order messages when applicable. For Rive, test the exported
artboard/state-machine/input contract separately from screenshot output. Use browser visual evidence for
rendering, with explicit tolerance and stable assets; a unit snapshot of engine objects is not proof of pixels
or interaction.

Report the chosen runtime and version, ownership boundary, renderer/fallback path, asset strategy, lifecycle
and cleanup evidence, accessibility equivalent, target browser/device, measurements and anything the
available environment could not verify.
