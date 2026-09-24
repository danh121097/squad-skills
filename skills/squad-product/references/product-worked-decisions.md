# Worked framing decisions

Read when a framing, scope or phasing judgment call would benefit from a worked example.

## 1. The request that was already a solution

**Arrived:** "Add address autocomplete to checkout."

**Framing:** Asked what prompted it: support tickets about the address step. The outcome was abandonment at
that step. Three candidates fit — autocomplete, a shorter form, better validation messages — and the second
cost a fraction.

**Rule:** Frame the outcome even when a solution was requested, and list the requested solution as one
candidate so the user sees it was considered, not overridden. The user chooses.

## 2. The criterion that could not fail

**Arrived:** "The dashboard should feel fast."

**Framing:** Asked what they saw: a spinner on the summary card after login, on a mid-range Android phone.
Criterion: "Summary card renders real data within 1.5s of login on the listed device; no spinner exceeds
400ms", marked unverified for other devices.

**Rule:** Ask what they saw before proposing a metric.

## 3. Cutting an outcome instead of diluting four

**Arrived:** Four flows, four weeks, one developer.

**Framing:** Flow one complete — empty, error and offline states included — as the first slice; the other
three deferred, each with the condition that would pull it forward.

**Rule:** Cut by whole outcomes. Four flows at half depth ship nothing.

## 4. The plan that made a decision it did not own

**Arrived:** "Build the notifications service." A first draft said "add a Redis queue".

**Rule:** State the property — a queue with at-least-once delivery and a dead-letter path — never the
technology. Choosing the queue belongs to Backend; naming it hands that role an argument, not a requirement.

## 5. The written plan that put everything at the root

**Arrived:** "Write the plan to disk." The draft put `plan.md`, three `phase-XX-` files, `domain-model.md`,
`test-strategy.md` and `phase-02-handoff.md` side by side.

**Correction:** The root no longer separates ordered phases from background or produced artifacts, and
`phase-02-handoff.md` reads as a fourth phase. Move background to `references/`, produced work to
`artifacts/`, decisions to `adr/`, and rename the handoff `handoff-to-phase-02.md`.

**Rule:** Only `phases/` states order, and only phase files carry its prefix. Everything else records its
owning phase in frontmatter.
