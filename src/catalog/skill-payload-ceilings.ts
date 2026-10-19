/**
 * A payload ceiling for every skill the catalog ships.
 *
 * A skill without a ceiling grows with nothing objecting: skills once grew by
 * 12% to 42% of their reference words in one upgrade, while the change that
 * made them grow believed something else was bounding them.
 *
 * Which figure a ceiling bounds depends on what the skill declares.
 *
 * A skill listed in `skill-task-types.ts` is bounded on the **median loaded
 * set**: entrypoint words plus the references the median declared task is expected to open.
 * This is a static reading-path estimate, not observed token cost. Bounding the total instead would tax the routing
 * that keeps a run cheap, which is backwards for a catalog of deep specialists —
 * and the measurements say so plainly. When the median first bound, totals ran
 * from 3,933 to 7,529 words while medians sat between 1,991 and 2,619: the
 * roles cost about the same per run, and the total measured what no run pays.
 *
 * A skill that declares no task types has no loaded set to measure, so its
 * ceiling bounds the **total payload** because that is the only bound available.
 * No shipped skill is in that position today: every one declares task types and
 * is bounded on the median. The fallback stays because a new skill arrives
 * without a routing table, and a skill with no declared routes must not land
 * under the loosest bound in the catalog by default.
 *
 * Each value is the measurement at the time it was recorded, with no headroom,
 * so the first word past it fails the gate. Raising one is the point rather than
 * the workaround: growth worth shipping is worth stating as a reviewed number in
 * the same diff, which is what turns a 40% increase from an invisible side
 * effect into a line a reviewer has to approve. On a median-bounded skill there
 * is a second way out that the total never offered — route the new content to
 * the tasks that need it, and the median does not move at all.
 *
 * Every figure below was re-recorded on 2026-09-29, after generic knowledge,
 * source registries, runtime-fallback boilerplate and in-skill repeats were cut
 * and the shared fork, loop and approve clauses were shortened; the product and
 * team figures again after the written plan was reduced to one file by default.
 * Code review, fix, QA and team rose by five words each when the gate loop cap
 * moved from per gate to per unit, then again when QA and Code Review began
 * running together, a return carried both gates' findings, a behavior-preserving
 * fix reran only the existing suite, and QA and Review split the dimensions they
 * had both claimed.
 * On 2026-10-19, the fix and team figures were remeasured for role-named build
 * chats, explicit Codex chat model selection, main-owned subagent gates and
 * bounded returns to the same implementation owner. These are dispatch and
 * handoff rules their delegated reading paths must carry.
 * The paired gates now start concurrently and exchange evidence while Review
 * waits to finalize on matching QA evidence. Each gate role needs that rule in
 * its entrypoint; each controller needs the launch order in its reading path.
 * The controller paths also carry the worker's repair report back to main and
 * the lead's final done report to that same chat, so a repair cannot skip the
 * new gate pass or leave an approved worker thread awaiting another dispatch.
 * The fix and team figures rose again for authorized parallel Codex worktrees,
 * transfer of the exact worker diff into the current branch, conflict repair,
 * integrated verification and cleanup. Codex-specific mechanics live in the
 * generated dispatch reference; the shared completion boundary remains in both
 * orchestrator entrypoints and their routed coordination references.
 * Each comment gives the ceiling it replaced; the history of earlier raises is
 * in git and summarized in `docs/maintainer-notes.md`.
 *
 * The eight implementation/lead/gate entrypoints now carry a user-assigned
 * external gate handoff. Its owner, pending status and exact-diff evidence must
 * be reachable from either session with only that role installed, so it cannot
 * live solely in the lead's coordination reference. The figures below record
 * that contract and its solo/fallback exceptions after the prose rewrite;
 * designer and product are unchanged.
 *
 * Fix rose by 50 words when it gained the `thread` mode: it cannot reach the
 * team's coordination reference, so the read-back, pending-launch, patch and
 * report-back rules that make the mode safe must sit in its own entrypoint.
 *
 * Every figure was lowered on 2026-10-15 after a catalog-wide pass removed
 * frontier-model no-ops, in-file duplicates and generic knowledge, and rewrote
 * non-guardrail prohibitions as the behavior they want. Rules a task type could
 * no longer reach were restored before the figures were recorded. Fix then
 * rose by 20 words: its `thread` mode starts a worker at once when the runtime
 * allows and runs a gate as a subagent when a woken turn is refused a start.
 */
export const skillPayloadCeilings: Readonly<Record<string, number>> = {
  'squad-backend': 2115, // was 2116
  'squad-code-review': 2235, // was 2205: concurrent peer-gate handoff
  'squad-designer': 2322, // was 2027: adaptive and accepted web handoffs now include their platform
  'squad-devops': 2067, // was 2092
  'squad-fix': 4696, // was 4597: Codex worktree isolation and verified integration
  'squad-frontend': 2011, // was 2045
  'squad-mobile': 1928, // was 2012
  'squad-product': 2359, // was 2392
  'squad-qa': 2371, // was 2341: concurrent peer-gate handoff
  'squads-team': 4623, // was 4543: Codex worktree isolation and verified integration
};
