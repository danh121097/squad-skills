# Mobile worked decisions

Read when a lifecycle, offline, permission or evidence decision is ambiguous. Every example is
**constructed** from platform documentation, not from a recorded run.

## 1. Crash after resume

**Situation:** A screen crashes after the process returns from the background, touching a controller the
platform already tore down.

**Decision:** Re-create platform-scoped resources on the documented lifecycle callbacks and restore
navigation and form state from persisted values, not memory. Exercise the transition on a device.

**Why:** A null-check guard stops the crash but leaves the screen empty after resume.

## 2. Offline writes are at-least-once

**Situation:** A mutation queued offline replays on reconnect; the user may background the app mid-flight.

**Decision:** Give each write a client-generated idempotency key the server honours, bound retries, and keep
"queued", "sent" and "confirmed" separate locally. Never say "synced" unless the server contract proves it.

**Why:** A flag flipped on send reports success for a request no server accepted.

## 3. A denied permission is a designed state

**Situation:** The user declines camera, location or notification access — possibly permanently, so the
platform will not prompt again.

**Decision:** Request at the moment of use with the reason visible; design the denied and
permanently-denied paths — what still works and where the settings route is. Never assume a second prompt
appears.

## 4. Performance numbers come from release builds on hardware

**Decision:** Take start-up, frame-rate, memory and size numbers from a release build on a device. A
simulator or debug-build result is evidence about the simulator or debug build only.
