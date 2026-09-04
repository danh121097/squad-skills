# Mobile worked decisions

Read when a lifecycle, offline, permission or evidence decision is ambiguous. Adapt the reasoning to the
platform and repository in front of you; these are not templates.

This file is deliberately short. Every example below is **constructed** from the platform documentation
this role's source registry lists — none is drawn from a run this catalog recorded, so none carries the
weight of a measured result. Fewer honest examples beat more invented ones; this file grows when real
mobile decisions exist to add.

## 1. A resume is a state the build must have entered

**Context:** A screen works through a full session and crashes after the process returns from the
background, touching a controller or subscription the platform already tore down.

**Decision:** Treat background, process death and restore as states with owners: cancel and re-create
platform-scoped resources on the documented lifecycle callbacks, and restore navigation and form state from
persisted values rather than from memory. Exercise the transition on a device, not by reasoning about it.

**Avoid:** Guarding the crash with a null check that leaves the screen empty after resume.

## 2. Offline writes are at-least-once

**Context:** The app queues a mutation offline and replays it when connectivity returns; the user may
background the app mid-flight.

**Decision:** Give each queued write a client-generated idempotency key the server honours, bound retries,
and separate "queued", "sent" and "confirmed" in the local model. Say "the write is retried safely under
this key", not "the write synced", unless the server contract proves the stronger claim.

**Avoid:** A local flag flipped on send, which reports success for a request no server accepted.

## 3. A denied permission is a designed state

**Context:** A feature needs camera, location or notification access, and the user declines — or declines
permanently, which the platform will not prompt for again.

**Decision:** Request at the moment of use with the reason visible, and design the denied and
permanently-denied paths: what the screen shows, what still works, and where the settings route is. Confirm
the platform's own re-prompt rules rather than assuming a second prompt appears.

**Avoid:** Blocking the feature behind an error dialog the user cannot act on.

## 4. Name the device the evidence came from

**Context:** Performance and platform behavior are reported after a simulator run.

**Decision:** Report the simulator, emulator or device, its OS version, and the build mode with every
result, and take start-up, frame-rate, memory and size numbers from a release build on hardware. A
simulator result is evidence about the simulator.

**Avoid:** Presenting debug-build smoothness as a performance result, or a simulator pass as device
coverage.
