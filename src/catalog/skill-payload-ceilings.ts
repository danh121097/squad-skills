/**
 * A total-payload ceiling for every skill the catalog ships.
 *
 * `evals/squad-designer/baseline-manifest.yml` already bounds size, but only for
 * the skill its `budget.skill` names: the entrypoint and median-loaded ceilings
 * read `phase_1_reference.<budget skill>`, and `max_reference_words` caps that
 * same skill's references. Six of the nine skills are recorded in no manifest at
 * all, and the two that are carry hashes and word counts without `task_types`,
 * so no loaded-words figure exists for them to be compared against. The result
 * was that eight skills could grow without any check objecting — and they did,
 * by 12% to 42% of their reference words in one upgrade, while the change that
 * made them grow believed a budget was governing it.
 *
 * These ceilings close that. They are deliberately the plainer metric: total
 * entrypoint plus reference words, not the median loaded set. Total payload is
 * the wrong governing figure where routing exists — progressive disclosure means
 * a native reference never loads for a web task, and taxing the total punishes
 * exactly the routing that keeps a run cheap. But a skill that declares no task
 * types has no loaded set to measure, and total payload is then the only bound
 * available. Treat it as a proxy that catches unnoticed growth, not as a claim
 * about what a run actually loads.
 *
 * Each value is the measurement at the time it was recorded, with no headroom,
 * so the first word past it fails the gate. Raising one is the point rather than
 * the workaround: growth that is worth shipping is worth stating as a reviewed
 * number in the same diff, which is what turns a 40% increase from an invisible
 * side effect into a line a reviewer has to approve. Cut the content first; the
 * ceiling moves only when the content genuinely earns it.
 *
 * A ceiling is not skill content. Recording one for `squad-designer` does not
 * edit its payload and so owes its evaluation cycle nothing; what would owe the
 * cycle is trimming the skill to fit.
 */
export const skillPayloadCeilings: Readonly<Record<string, number>> = {
  'squad-backend': 4994,
  'squad-code-review': 3275,
  // The largest payload in the catalog, and the only one whose size is also
  // governed by a measured loaded-set budget. This ceiling is the outer bound;
  // the manifest's median-loaded figure is the one that binds in practice.
  'squad-designer': 7497,
  'squad-devops': 5255,
  'squad-fix': 4284,
  'squad-frontend': 5224,
  // Raised by ten words: the router now names existing-versus-new-app stack
  // selection, and the checklist carries the branch where nothing exists to
  // preserve. The reference already held the selection criteria; only the
  // entrypoint that routes to them moved.
  'squad-mobile': 3886,
  'squad-qa': 4075,
  // Raised by 225 words for the framing contract. The lead is told to lock
  // outcome, constraints, non-goals and acceptance in step one, and no role
  // skill covers how — an empty repository returns nothing to scout, so the
  // stack has to be framed as a decision rather than discovered as a fact.
  // Growth this size is what the ceiling exists to put in front of a reviewer,
  // and it is approved here rather than absorbed.
  'squads-team': 4033,
};
