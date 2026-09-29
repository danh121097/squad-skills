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
 * set**: entrypoint words plus the references the median task actually opens.
 * That is what a run costs. Bounding the total instead would tax the routing
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
 * moved from per gate to per unit.
 * Each comment gives the ceiling it replaced; the history of earlier raises is
 * in git and summarized in `docs/maintainer-notes.md`.
 */
export const skillPayloadCeilings: Readonly<Record<string, number>> = {
  'squad-backend': 2033, // was 2333
  'squad-code-review': 2184, // was 2179
  'squad-designer': 2064, // was 2064
  'squad-devops': 2009, // was 2170
  'squad-fix': 2420, // was 2415
  'squad-frontend': 1971, // was 2542
  'squad-mobile': 1929, // was 2261
  'squad-product': 2392, // was 2489
  'squad-qa': 2272, // was 2267
  'squads-team': 2898, // was 2893
};
