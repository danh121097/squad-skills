# Framing and acceptance criteria

Read when turning a request into something a squad can start on. This reference produces four things: the
outcome, the constraints, the non-goals, and criteria that can fail.

## Outcome

State what the user is trying to achieve, in their words, before naming anything that achieves it. "Users
abandon checkout at the address step" is an outcome. "Add address autocomplete" is a solution wearing an
outcome's clothes, and framing it that way hides every cheaper answer.

Name who it is for and what changes for them when it works. A goal with nobody on the other side cannot be
checked, because nothing observable moves when it is met.

## Constraints

Constraints are what the plan may not change: an existing stack, a deadline, a budget, a compliance
obligation, a published contract, a decision already made. Never re-litigate a settled one — a plan that
quietly reopens the framework choice is one the user has to defend instead of read.

Separate a real constraint from an inherited default. "We use Postgres" is a constraint. "We have always
done it this way" is a default, and naming it as one is often the most useful line in a plan.

Evidence inside an earlier plan is a claim with a date. Re-check each load-bearing one against the
repository as it stands and say which no longer holds; an expired fact looks certain in a way an unknown
never does.

## Non-goals

An unstated non-goal is scope that returns later as a surprise, usually mid-build and usually as someone
else's assumption. Two kinds, not interchangeable:

- **Deferred** — worth doing, not now. State the condition that would pull it forward.
- **Refused** — deliberately not done. State why, so it is not re-proposed every cycle.

## A request that arrives partly framed

Name what each gap was measured against: the outcome, a non-goal, a criterion that cannot fail, or a phase
with no owning role. Re-framing what the user settled costs them a review; routing an incomplete frame
onward gets it rejected.

## Criteria that can fail

A criterion is checkable when someone can name the observation that would prove it wrong. If nothing could
falsify it, it is a sentiment.

- Name the observation, not the quality: "feels fast" becomes "interaction to next paint under 200ms on the
  listed test device".
- Bind it to something that exists — a route, a screen, a command, a device, a role.
- When a criterion genuinely cannot be checked with what is available, keep it and mark it **unverified**
  with the reason. An honest gap beats a proxy metric that passes while the real thing fails.
