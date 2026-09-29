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
 * Every figure below was re-recorded on 2026-09-24, after the catalog was cut
 * down to risk-tiered gates, one-line bound handoffs and shorter references,
 * then raised where every role that can run on its own took the tier list, the
 * gates took their solo rule, the lead's plan fallback took the layout, and
 * every role took the fork rule that stops on doubt and lets the lead settle
 * only what it can show.
 * Each comment gives the ceiling it replaced; the history of earlier raises is
 * in git and summarized in `docs/maintainer-notes.md`.
 */
export const skillPayloadCeilings: Readonly<Record<string, number>> = {
  'squad-backend': 2333, // was 2272
  'squad-code-review': 2713, // was 2640
  'squad-designer': 2064, // was 2003
  'squad-devops': 2170, // was 2109
  'squad-fix': 2889, // was 2828
  'squad-frontend': 2542, // was 2481
  'squad-mobile': 2261, // was 2200
  'squad-product': 2794, // was 2739
  'squad-qa': 2763, // was 2690
  'squads-team': 3557, // was 3493
};
