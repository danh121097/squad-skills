/**
 * A payload ceiling for every skill the catalog ships.
 *
 * An evaluation manifest used to bound size, but only for the one skill its
 * budget named. Six of the nine were recorded in no manifest at all, so eight
 * could grow with nothing objecting — and they did, by 12% to 42% of their
 * reference words in one upgrade, while the change that made them grow believed
 * a budget was governing it. That lane is retired; this file is the bound now.
 *
 * Which figure a ceiling bounds depends on what the skill declares.
 *
 * A skill listed in `skill-task-types.ts` is bounded on the **median loaded
 * set**: entrypoint words plus the references the median task actually opens.
 * That is what a run costs. Bounding the total instead would tax the routing
 * that keeps a run cheap, which is backwards for a catalog of deep specialists —
 * and the measurements say so plainly. Totals across the nine range from 3,938
 * to 7,497 words while their medians sit between 1,959 and 2,624: the roles
 * already cost about the same per run, and the total was measuring something no
 * run pays. The skill with the largest total has the smallest median.
 *
 * A skill that declares no task types has no loaded set to measure, so its
 * ceiling bounds the **total payload** because that is the only bound available.
 * No shipped skill is in that position today: all nine declare task types and
 * all nine are bounded on the median. The fallback stays because a new skill
 * arrives without a routing table, and a skill with no declared routes must not
 * land under the loosest bound in the catalog by default.
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
  // Raised 2186 to 2205, and squad-devops 2147 to 2168, by naming the
  // existing-versus-greenfield fork in both entrypoints. Nineteen and
  // twenty-one entrypoint words each, which is why both moved the median one
  // for one: a router line is read by every task, and that is the cost the
  // total-payload regime never made visible.
  // Raised 2205 to 2228 for a rule that was wrong as written: the pre-flight
  // forbade a credential reaching "a response or a fixture", which prohibits
  // the response an authentication endpoint exists to send and prohibits
  // synthetic test data. Twenty-three median words to say the prohibition is
  // unintended disclosure — a log, an error body, a response to another caller,
  // a committed value — and both copies pay, because the pre-flight and the
  // security reference each state it in their own voice on purpose.
  'squad-backend': 2228,
  // Raised from 2157 when language-runtime-review-signatures.md landed. The
  // file is 621 words but the median moved 82, because it routes to one task
  // and the entrypoint grew by a router line and a checklist item. The task
  // that loads it sits at 2778, third-heaviest in the catalog, and that is the
  // point of the median regime: the run that needs the depth pays for it, and
  // the four that do not are unchanged.
  'squad-code-review': 2239,
  // Was bounded on total payload while the retired evaluation lane held its task
  // types. Those moved to `skill-task-types.ts` when the lane was removed, so the
  // median binds here now. 1959 is the measured figure, and it reproduces the
  // `median_loaded_words` the retired manifest recorded — the same number reached
  // by a second route. Its heaviest task loads 6132, which the median regime
  // deliberately does not tax: only the runs that need that depth pay for it.
  // Raised 1959 to 1972 to settle a contradiction inside the entrypoint: the
  // build step requires motion teardown to live in the component that animates,
  // while the handoff checklist forbade emitting "lifecycle code" at all. The
  // checklist now says product state and platform lifecycle, and names the
  // animation's own bookkeeping as the exception. Thirteen entrypoint words, so
  // every task pays; a checklist read on every handoff is where the cost belongs.
  'squad-designer': 1972,
  'squad-devops': 2209,
  // Raised 2101 to 2624 as corrected accounting, not growth: total payload is
  // unchanged at 4299 words. The entrypoint reads
  // runtime-capability-fallbacks.md before choosing tools for any repair, so
  // every task loads it, but only one task declared it. The same omission was
  // corrected in squad-frontend and squad-mobile, whose entrypoints carry the
  // same unconditional line. squad-backend and squad-devops were left alone:
  // their routers name a condition ("a missing provider/test/review
  // capability"), so a single declaring task is the honest count there.
  'squad-fix': 2624,
  // Frontend, mobile and devops each rose about forty words in an earlier
  // change: HANDOFF-BUILD-001 is one sentence stated at three entrypoints, and
  // an entrypoint sentence is read by every task of that skill. Frontend then
  // moved 2134 to 2572 and mobile 1875 to 2226 for the runtime-fallback
  // accounting described above; both totals are unchanged.
  'squad-frontend': 2572,
  'squad-mobile': 2226,
  // Raised from 2236 by a false-FAIL rule in the verdict reference: a runner's
  // non-zero exit can mean the process was dirty rather than an assertion
  // failing. Sixty words, and all six task types load that file, so the median
  // pays the whole file cost — the case where the median regime offers no
  // discount. It buys it anyway: the rule is about what makes this gate's FAIL
  // legitimate, and it was found by running the skill's own domain against a
  // seeded-defect corpus, where a produced test's own double leaked exactly
  // this exit. No checklist item accompanies it, deliberately: an entrypoint
  // line would be read by every task to repeat what every task already loads.
  'squad-qa': 2296,
  // The flattest router in the catalog, in the skill that runs on every squad
  // task: its median is 64% of its total, so routing buys it little. Worth the
  // next routing pass.
  'squads-team': 2595,
};
