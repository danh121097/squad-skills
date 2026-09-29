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
