/** Shared text is generated into each orchestrator so either installs alone. */
export function renderThreadHandoff(): string {
  return `# Thread handoff

<!-- Generated from src/agents/thread-handoff.ts by pnpm agents:generate. -->

Read only for build chats. Before dispatch, read [worker models](worker-models.md) for the selected
runtime.

## Dispatch and report

Include this bootstrap in the initial worker prompt on both runtimes: the worker captures its initial
snapshot after seeding and before its first edit, retaining base revision and inherited tracked/untracked
contents outside the product tree without committing. If seeding or capture fails, stop before editing.
Return the snapshot reference with the report; main must not reconstruct it from already-edited files.

Select the owning skill first. Give the worker its exact squad role, main ID, acceptance, file ownership,
dependencies, tier, checks, base and proven cause for repairs. Use the lead's project and title
\`[squad-frontend]: <slice>\` or the assigned role. Ownership changes return to main before continuing.

When a valid user-started launcher is available, build slices stay pending until launched, including on a
woken turn. Reuse it with read-back and follow-ups. Missing authorization stays pending; start authorized ready work.

After each implementation or repair pass, the worker sends main its changes, commands/results and gaps
through authorized messaging or its final turn. Main checks the artifact and reuses the same build thread.
Keep reports in conversation; return worker-chat user decisions with their source before dependent work.

## Gate the worker artifact

The gate handoff names the absolute worker checkout path, base revision, initial worker snapshot,
current diff identity (including untracked content), acceptance, commands and environment. Both gates
run there, not in main's default directory; HEAD alone identifies no uncommitted content.
The worker pauses edits until main returns findings. Recheck the diff identity before accepting verdicts;
changed inputs invalidate affected evidence. Missing checkouts/environments remain gaps.

Light work closes on its combined verify pass; no paired gate is required. For standard/high work, main
starts squad-qa and squad-code-review together before waiting for either result. Send peer handles after
both exist; exchange evidence directly or through main. Review waits for matching QA evidence. If either paired subagent cannot start, keep the gate pending.
An externally assigned gate retains its owner under the entrypoint contract.

Within the repair budget, main sends all actionable findings to the same build thread together. The worker fixes and reports back to main; main assesses that revision with
both gates over the affected scope. Report BLOCKED at the budget or unresolved evidence gap.

## Integrate and finish

Main sends a done report with its evidence to the worker chat after the tier passes and stops its edits.
With --coordinate-only, assign one integration owner to apply changes, resolve conflicts and run combined
checks; main reviews evidence without editing the target. Otherwise main performs integration.
The integrator transfers only the worker delta from its initial snapshot, including added, deleted,
renamed and binary files. Preserve inherited and concurrent user edits. If the worker already used the
target checkout, verify its changes in place rather than replaying the delta. Resolve conflicts, verify
and rerun affected gates on the integrated target when behavior or contracts change. Retain a reviewable
diff. Clean transferred task worktrees/branches only after verification; preserve unintegrated work and
report cleanup gaps. Main closes the parent only after integration and required gates pass.
`;
}
