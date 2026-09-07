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
obligation, a published contract, a decision already made. Collect them before proposing, and never
re-litigate a settled one — a plan that quietly reopens the framework choice is one the user has to defend
instead of read.

Separate a real constraint from an inherited default. "We use Postgres" is a constraint. "We have always
done it this way" is a default, and naming it as one is often the most useful line in a plan.

Evidence inside an earlier plan is a claim with a date. Re-check each load-bearing one against the
repository as it stands and say which no longer holds; an expired fact looks certain in a way an unknown
never does.

## Non-goals

Non-goals are output. An unstated non-goal is scope that returns later as a surprise, usually mid-build and
usually as someone else's assumption. Two kinds, not interchangeable:

- **Deferred** — worth doing, not now. State the condition that would pull it forward.
- **Refused** — deliberately not done. State why, so it is not re-proposed every cycle.

## Criteria that can fail

A criterion is checkable when someone can name the observation that would prove it wrong. If nothing could
falsify it, it is a sentiment.

| Not checkable | Checkable |
|---|---|
| The page feels fast | Interaction to next paint under 200ms on the listed test device |
| Errors are handled gracefully | Every failing request renders a message naming the failure and a retry path |
| The API is secure | Unauthenticated requests to non-public routes return 401; cross-tenant reads return 404 |
| Good test coverage | The seeded regression fails on current code and passes after the change |

Three rules do most of the work:

- Name the observation, not the quality. "Feels responsive" becomes a number and a device.
- Bind it to something that exists — a route, a screen, a command, a device, a role.
- When a criterion genuinely cannot be checked with what is available, keep it and mark it **unverified**
  with the reason. An honest gap beats a proxy metric that passes while the real thing fails.

## What framing does not decide

Framing says what must be true, never how. Stack, architecture, data model and UI belong to the roles that
own them. A framing document naming a library has made a decision it does not own, and that role now has to
argue with the plan instead of reading it.
