/**
 * A payload ceiling for every skill the catalog ships.
 *
 * `evals/squad-designer/baseline-manifest.yml` already bounds size, but only for
 * the skill its `budget.skill` names. Six of the nine skills are recorded in no
 * manifest at all, so eight could grow with nothing objecting — and they did, by
 * 12% to 42% of their reference words in one upgrade, while the change that made
 * them grow believed a budget was governing it.
 *
 * Which figure a ceiling bounds depends on what the skill declares.
 *
 * A skill listed in `skill-task-types.ts` is bounded on the **median loaded
 * set**: entrypoint words plus the references the median task actually opens.
 * That is what a run costs. Bounding the total instead would tax the routing
 * that keeps a run cheap, which is backwards for a catalog of deep specialists —
 * and the measurements say so plainly. Totals across these eight range from
 * 3,275 to 5,327 words while their medians sit between 1,836 and 2,595: the
 * roles already cost about the same per run, and the total was measuring
 * something no run pays.
 *
 * A skill that declares no task types has no loaded set to measure, so its
 * ceiling bounds the **total payload** because that is the only bound available.
 * `squad-designer` is the one such skill today, and deliberately: its task types
 * live in the baseline manifest where the evaluation budget binds them, and a
 * second copy here would drift from the one that governs.
 *
 * Each value is the measurement at the time it was recorded, with no headroom,
 * so the first word past it fails the gate. Raising one is the point rather than
 * the workaround: growth worth shipping is worth stating as a reviewed number in
 * the same diff, which is what turns a 40% increase from an invisible side
 * effect into a line a reviewer has to approve. On a median-bounded skill there
 * is a second way out that the total never offered — route the new content to
 * the tasks that need it, and the median does not move at all.
 *
 * A ceiling is not skill content. Recording one for `squad-designer` does not
 * edit its payload and so owes its evaluation cycle nothing; what would owe the
 * cycle is trimming the skill to fit.
 */
export const skillPayloadCeilings: Readonly<Record<string, number>> = {
  'squad-backend': 2186,
  // The least selective router in the catalog after squads-team: a typical
  // review opens two-thirds of the skill, so depth added here is paid for by
  // every review unless it is routed to a specific one.
  'squad-code-review': 2157,
  // Bounded on total payload, not the median: its task types live in
  // evals/squad-designer/baseline-manifest.yml, whose `median_loaded_words` is
  // the figure that binds in practice. This is the outer bound behind it.
  'squad-designer': 7497,
  'squad-devops': 2147,
  'squad-fix': 2101,
  'squad-frontend': 2095,
  'squad-mobile': 1836,
  'squad-qa': 2236,
  // The highest median in the catalog and the flattest router, in the skill
  // that runs on every squad task. Worth the next routing pass.
  'squads-team': 2595,
};
