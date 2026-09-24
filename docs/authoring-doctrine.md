# Authoring doctrine

How to write a `SKILL.md`, a bundled reference, or a repository instruction file. The payload ceilings in
`src/catalog/skill-payload-ceilings.ts` say how much a skill may cost; this file says how to spend it. Read
it before adding content to a skill, and again when a ceiling refuses a change.

## The two loads

Every line you add spends one of two budgets, and they are not interchangeable.

**Context load** is what always-loaded material costs the agent: a skill `description`, a router line, an
entrypoint section. It is paid on every turn of every task, whether or not it fires. The median-loaded-set
ceiling is the bound on it, though what it sums is the entrypoint plus the median task's routed references —
the always-loaded part measured together with the one task's worth of routing that is typical.

**Cognitive load** is what the catalog costs the human: which skills exist, and when to reach for each. It is
not a cost to drive to zero. It is the price of the user keeping agency over which role runs, so spend it
where their judgment matters and remove it where it does not.

Material behind a router line escapes context load at the price of that line. Material with no pointer at all
rides entirely on cognitive load, which is why an unrouted reference fails `pnpm validate`: it is payload
nothing can reach.

## Pointers decide what gets read

A **pointer** names out-of-context material and encodes the condition for reaching it. A skill's
`description` is one. So is every bullet under `Conditional references`. The pointer's wording, not its
target, decides whether the agent opens the file, so a must-read reference behind a vague pointer is a
variance bug: sharpen the wording before you consider moving the content inline.

Two rules make a pointer work.

- **Lead with the trigger, not the identity.** "For evidence capture, reproduction, hypothesis testing and
  root-cause criteria" fires; "This reference covers the diagnosis process" does not.
- **One trigger per branch.** Synonyms that rename a single case are one branch written twice. Keep the
  cases that genuinely route to different material.

## Where content sits

Three rungs, ordered by how immediately a run needs the material.

1. **Entrypoint step** — what the role does, in order. The primary tier.
2. **Entrypoint reference** — rules a run consults while working. Often a flat peer set, which is a fine
   shape, not a smell.
3. **Routed reference** — a file under `references/`, opened only when its pointer fires.

The branch test decides the rung: content every task needs belongs at the entrypoint, and content only some
tasks reach belongs behind a pointer. This is the same judgment `src/catalog/skill-task-types.ts` records
mechanically, which is why the routing table and the router prose have to be edited together.

The lever is real and it is not free. Dropping a routing edge on the argument that an earlier task already
read the file assumes a run arrives through that earlier task. A task type is an entry point, not a step: the
run that starts at `write-plan-document` is the whole run. Route content away from the median only when the
median task still holds what it needs while running alone.

**Co-location** is the within-file companion. Keep a rule's definition, its caveats and its exception under
one heading. Scattering one meaning across a file is not duplication, but it fails the same way: reading one
part no longer brings its neighbours with it.

## Completion criteria

Every step ends on a condition telling the run it is done, and two properties make that condition a lever.

**Clarity** is whether done can be told from not-done. A vague bound invites the run to stop early, with
attention drifting to the visible steps still ahead. Sharpen the bound first; splitting the sequence to hide
later steps only works across a real context boundary, and an inline call is not one.

**Demand** is how much the condition requires. "Every changed contract accounted for" produces legwork that
"list the changes" does not. Demand is not step-bound: "every rule applied" binds a body of flat reference
exactly as "every step done" binds a sequence, which is how a reference-only file still carries a bar.

The strongest criteria are both checkable and exhaustive. Most of this catalog's completion checklists are
written to that shape; keep new ones there.

## Leading words

A **leading word** is a compact concept the model already holds, reused as a token so a whole region of
behavior anchors on it: _blast radius_, _seam_, _root cause_, _frontier_, _tight loop_. Repeat the word,
never the sentence defining it. It anchors twice — in the body the run reaches for the same behavior every
time the word appears, and in a pointer the shared vocabulary makes the material easier to reach.

Coining a new word works only when you pay to define it, and a made-up word recruits nothing from
pretraining. Reach for an existing one first.

Hunt for the inverse: a triad spelled out at three sites, a pointer spending a sentence to gesture at one
idea. Each is a passage waiting to collapse into a token, and collapsing it is how a skill fits a ceiling
without losing a rule.

## Prompt the positive

Steering by prohibition pulls the forbidden behavior into context and makes it more available, not less. A
ban half-reads as an instruction. State the target behavior instead, so the unwanted one is never named:
"report the verification level you actually ran" beats "do not overstate verification". A prohibition earns
its place as a hard guardrail that resists positive phrasing — mutation authority, secret disclosure,
reporting an absent peer as run — and even there it reads better paired with the positive target.

This catalog is not clean on that axis. Treat every `Do not` you touch as a candidate for rewriting into the
behavior it wants.

## Proportionality

Procedure scales with risk, not with the number of roles installed. A one-line fix, a change that follows a
local pattern, or a prompt that already states its outcome and testable criteria takes the short path: no
framing pass, no design pass, one combined verify with real commands. Ceremony — a framing pass, a separate QA
and Code Review, a written plan — is reserved for the work whose risk or ambiguity pays for it. Write a new
rule with its cheapest applicable path first and the escalation condition second, and never make the short
path depend on skipping evidence: proportionality removes procedure, not proof.

What the user already supplied is input, not a draft to re-derive. A brief, a screenshot, a reference link or
stated acceptance criteria settle what they cover; a skill fills only the gap they leave.

## Frontier-model no-ops

The models these skills run on already read before editing, match repository conventions, check an API
before calling it, and write tests for what they change. An instruction restating a default like these costs
every run tokens and changes nothing. Keep a sentence only when it encodes a decision the model would
otherwise get wrong — a threshold, an ordering, an ownership, a stop condition, a safety boundary — and delete
the rest. When unsure, delete it and name the sentence in the change description, so it can be restored if
real use shows a regression.

## Pruning

- **One source of truth per meaning.** Duplication costs maintenance, costs tokens, and inflates a rule's
  apparent rank. Deliberate exceptions exist and are declared where they are made, never left for a reader to
  discover. `AGENTS.md` documents the standing one: each role's `quality-bar-and-preflight.md` may restate
  rules its working references also carry, and the completion checklist points at it instead of copying it.
  Where the two disagree, the quality bar is current. The other shape is reachability — a rule
  restated verbatim in a second file because a task type cannot load the first — and it is declared in the
  ceiling comment that pays for it.
- **The environment is a source of truth.** `package.json` scripts, the directory layout, `--help` output. A
  document restating them is a cache, and a cache earns its load only when the lookup is expensive. Cache the
  unwritten convention and the reason behind a choice; leave the one-command lookups where they cannot go
  stale.
- **Hunt no-ops.** An instruction the model already follows by default pays load to say nothing. The test is
  model-relative, not reader-relative: see "Frontier-model no-ops" above. When a sentence fails, delete the sentence rather than
  trim words from it. The test also grades leading words — one too weak to beat the default is a no-op, and
  the fix is a stronger word rather than a different technique.
- **Watch for sediment.** Stale layers settle because adding feels safe and removing feels risky. A rule that
  described the catalog two changes ago is worse than no rule, because a run cannot tell it from a live one.

## What the gate does and does not tell you

`pnpm validate` proves the catalog is consistent, routed and inside its ceilings. What it cannot prove, and
the evidence a claim about output needs instead, is stated in `AGENTS.md` and not restated here. The part
that belongs to authoring: `docs/skill-observations.md` records what a real run got wrong, and an entry is a
candidate rule, never an edit.
