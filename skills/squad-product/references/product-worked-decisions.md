# Worked framing decisions

Read when a framing, scope or phasing judgment call would benefit from a worked example. Each case states
what arrived, what the framing did, and the rule it demonstrates.

## 1. The request that was already a solution

**Arrived:** "Add address autocomplete to checkout."

**Framing:** asked what prompted it. Answer: support tickets about the address step. The observable outcome
was abandonment at that step, not the absence of autocomplete. Framed against the outcome, three candidates
existed — autocomplete, a shorter form, and better validation messages — and the second was a fraction of
the cost.

**Delivered:** the outcome plus the three candidates, with the recommendation and the reason. The user chose.

**Rule:** frame the outcome even when a solution was requested. Name the requested solution as one candidate
so the user sees it was considered, not overridden.

## 2. The criterion that could not fail

**Arrived:** "The dashboard should feel fast."

**Framing:** "feel fast" has no observation attached, so it was converted rather than accepted or rejected.
What they had seen was a spinner on the summary card after login, on a mid-range Android phone.

**Delivered:** "Summary card renders real data within 1.5s of login on the listed test device; no spinner
exceeds 400ms." Marked unverified for other devices, with the reason.

**Rule:** convert a feeling into the observation behind it. Ask what they saw before proposing a metric.

## 3. Cutting an outcome instead of diluting four

**Arrived:** four flows, four weeks, one developer.

**Framing:** all four at reduced depth meant four half-flows and no usable product. One flow complete —
including empty, error and offline states — was usable by a real person in week one.

**Delivered:** flow one as the first slice, the other three deferred with the condition that would pull each
forward, and a note that the estimate had never been checked against the repository.

**Rule:** cut by whole outcomes. Four things at half depth ship nothing.

## 4. The plan that made a decision it did not own

**Arrived:** "Build the notifications service."

**First draft:** phase 2 said "add a Redis queue".

**Correction:** nothing in the framing required Redis. The plan needed *a queue with at-least-once delivery
and a dead-letter path*, which is a constraint; which queue is a technical decision the backend role owns.
Naming the product in the plan would have handed that role an argument instead of a requirement.

**Rule:** state the property the work needs, never the technology that provides it.

## 5. The plan that was too big for the work

**Arrived:** "Users can't change their email address."

**Framing:** one form, one endpoint, one verification email. No cross-role dependency, no unknown that could
reorder anything.

**Delivered:** one phase, three acceptance criteria, one assumption. Roughly ten lines.

**Rule:** a plan is as small as the work. Producing ceremony for a two-file change is a failure of this role,
not thoroughness.
