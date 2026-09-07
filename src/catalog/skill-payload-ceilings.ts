/**
 * A payload ceiling for every skill the catalog ships.
 *
 * An evaluation manifest used to bound size, but only for the one skill its
 * budget named. Of the nine that existed then, six were recorded in no manifest
 * at all, so eight could grow with nothing objecting — and they did, by 12% to
 * 42% of their reference words in one upgrade, while the change that made them
 * grow believed a budget was governing it. That lane is retired; this file is
 * the bound now.
 *
 * Which figure a ceiling bounds depends on what the skill declares.
 *
 * A skill listed in `skill-task-types.ts` is bounded on the **median loaded
 * set**: entrypoint words plus the references the median task actually opens.
 * That is what a run costs. Bounding the total instead would tax the routing
 * that keeps a run cheap, which is backwards for a catalog of deep specialists —
 * and the measurements say so plainly. Totals range from 3,933 to 7,529 words
 * while the medians sit between 1,991 and 2,619: the roles already cost about
 * the same per run, and the total was measuring something no run pays. The skill
 * with the largest total still has the smallest median.
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
 * A ceiling is not skill content. Recording one for `squad-designer` does not
 * edit its payload and so owes its evaluation cycle nothing; what would owe the
 * cycle is trimming the skill to fit.
 */
export const skillPayloadCeilings: Readonly<Record<string, number>> = {
  // HANDOFF-DECISION-001 raised all ten figures below in one change, by 25 to 32
  // words each. It is a handoff-contract bullet at every role entrypoint, so
  // every task of every skill pays it, and no routing lever exists: a role
  // cannot have a task type that opts out of knowing it may not answer the
  // user's question on their behalf.
  //
  // Ten entrypoints is the widest any clause has reached, and the cost was
  // argued before it was measured. The narrow version bound only squad-product
  // and squads-team, on the reasoning that the framing edge is where forks
  // surface. That reasoning does not survive the observation behind it: the
  // missing channel is a property of running as a child agent, which every role
  // does, so QA meeting an absent credential and Designer meeting an undecided
  // brand direction would have kept assuming under the narrow clause. Per-role
  // deltas are recorded at each key.
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
  // Then 2228 to 2260 by HANDOFF-DECISION-001.
  'squad-backend': 2260,
  // Raised from 2157 when language-runtime-review-signatures.md landed. The
  // file is 621 words but the median moved 82, because it routes to one task
  // and the entrypoint grew by a router line and a checklist item. The task
  // that loads it sits at 2778, third-heaviest in the catalog, and that is the
  // point of the median regime: the run that needs the depth pays for it, and
  // the four that do not are unchanged.
  // Then 2239 to 2266 by HANDOFF-DECISION-001.
  'squad-code-review': 2266,
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
  // Then 1972 to 1991 to name the helper by capability rather than by memory.
  // The old paragraph made `ui-ux-pro-max` the rule and its old alias the
  // caveat, which is a rule that expires when the catalog changes. It now says
  // design-intelligence skill, resolved from the live catalog, and names the
  // installed one as today's answer.
  // Then 1991 to 2023 by HANDOFF-DECISION-001.
  'squad-designer': 2023,
  // Raised 2209 to 2216 by DECISION-RECORD-001: the 15-word clause landing in
  // platform-iac-and-delivery-matrix.md's `Selection output`, which the median
  // delivery task loads. Measured, not budgeted — the four other bound files
  // took the same sentence and only squads-team moved with it.
  // Then 2216 to 2248 by HANDOFF-DECISION-001.
  'squad-devops': 2248,
  // Raised 2101 to 2624 as corrected accounting, not growth: total payload is
  // unchanged at 4299 words. The entrypoint reads
  // runtime-capability-fallbacks.md before choosing tools for any repair, so
  // every task loads it, but only one task declared it. The same omission was
  // corrected in squad-frontend and squad-mobile, whose entrypoints carry the
  // same unconditional line. squad-backend and squad-devops were left alone:
  // their routers name a condition ("a missing provider/test/review
  // capability"), so a single declaring task is the honest count there.
  // Then 2624 to 2651 by HANDOFF-DECISION-001.
  'squad-fix': 2651,
  // Frontend, mobile and devops each rose about forty words in an earlier
  // change: HANDOFF-BUILD-001 is one sentence stated at three entrypoints, and
  // an entrypoint sentence is read by every task of that skill. Frontend then
  // moved 2134 to 2572 and mobile 1875 to 2226 for the runtime-fallback
  // accounting described above; both totals are unchanged.
  // Then 2572 to 2601 by HANDOFF-DECISION-001.
  'squad-frontend': 2601,
  // Then 2226 to 2251 by HANDOFF-DECISION-001.
  'squad-mobile': 2251,
  // Recorded on the skill's first landing at 2233 and corrected to 2740 in
  // review, which is the more useful half of the story.
  //
  // The first measurement was 2981. Prose trimming moved it 255 and stalled, so
  // two routing edges were dropped instead — `scope-cut-and-tradeoff` without
  // the elicitation reference, `write-plan-document` without the phasing rules —
  // on the argument that the task before each had already read them. That
  // argument does not survive contact with what a task type is. It is an entry
  // point, not a step: a run that arrives asking for the plan file is the whole
  // run, and under the dropped edge it wrote phases with owners and
  // preconditions having loaded no phasing rules. The 466 words were bought
  // from runs that never happened.
  //
  // So the routing lever is real but not free, and the test for using it is
  // whether the median task still loads what it needs when it is the only task
  // that runs. Restoring both edges, plus the existing-versus-greenfield fork
  // AGENTS.md requires in the router line and the checklist, lands at 2740.
  // That is the heaviest median in the catalog, above squads-team at 2680, and
  // it is recorded rather than engineered away: the alternative on the table
  // was a cheaper number that described a run nobody makes.
  // Raised 2740 to 2801 promoting two candidate rules out of
  // docs/skill-observations.md entries 2 and 3, 61 words for both.
  //
  // The first has live proof in this repository: the squad-architect plan's two
  // load-bearing findings were recorded with evidence and no expiry, one died
  // and one turned out to have been wrong from the start, and nothing noticed
  // until a second walk re-checked them. Framing that plans against an earlier
  // plan's evidence inherits that failure.
  //
  // The second closes the other half of a loop landed the same day: squads-team
  // now owns the root workspace layout, so the first slice of an empty
  // repository finally has an owner to name — before this, product had a phase
  // it could only report as a coverage gap.
  //
  // This keeps squad-product the heaviest median in the catalog, above
  // squads-team at 2737. Both rules come from a single run each, which the
  // entries say; the gate below proves neither of them improves a plan.
  // Raised 2801 to 2829 by the producing half of HANDOFF-DECISION-001, 28
  // entrypoint words in the handoff contract, so every task pays. The two
  // sections it adds to requirements-and-unknowns.md are free at the median:
  // that file already sits inside the median load, and the median task is not
  // the one that opens it.
  //
  // Paying at the entrypoint is the point here. The rule is about what leaves
  // this role, and the run that skipped it was a run that never opened the
  // reference — a plan handed over with its four material forks resolved by the
  // role that found them, which is the one place a checklist cannot recover
  // from later. This figure is unchanged by the clause widening to all ten
  // entrypoints: product already stated it.
  'squad-product': 2829,
  // Raised from 2236 by a false-FAIL rule in the verdict reference: a runner's
  // non-zero exit can mean the process was dirty rather than an assertion
  // failing. Sixty words, and all six task types load that file, so the median
  // pays the whole file cost — the case where the median regime offers no
  // discount. It buys it anyway: the rule is about what makes this gate's FAIL
  // legitimate, and it was found by running the skill's own domain against a
  // seeded-defect corpus, where a produced test's own double leaked exactly
  // this exit. No checklist item accompanies it, deliberately: an entrypoint
  // line would be read by every task to repeat what every task already loads.
  // Raised 2296 to 2350 to give the determinism gate a reading for a subject
  // that is stochastic by construction. Every mention of nondeterminism in this
  // skill treated it as a flake category to diagnose and fix, and gate 4 bars
  // "uncontrolled remote data" outright — so a QA run against a model, a
  // randomized algorithm or a load generator had to either refuse the work or
  // classify the subject's own variance as a defect. That is a contradiction in
  // shipped text, found by reading it; the gate below proves the catalog stays
  // consistent and sized, not that any verdict got better.
  // Then 2350 to 2382 by HANDOFF-DECISION-001.
  'squad-qa': 2382,
  // The flattest router in the catalog, in the skill that runs on every squad
  // task: its median is 64% of its total, so routing buys it little. Worth the
  // next routing pass. Raised three words by the same capability-resolved
  // helper wording recorded under squad-designer.
  // Raised 2598 to 2619 by the receiving half of HANDOFF-PLAN-001. Hard gate 1
  // said "capture outcome, constraints, non-goals and observable acceptance
  // criteria" and left the lead nothing to refuse an incomplete plan with; it
  // now states what an accepted plan contains, word for word with what
  // squad-product hands over. Thirty-two entrypoint words, so every task pays,
  // netting 21 after the framing fallback shed the sentence claiming no role
  // skill covered framing. The gate that used to be the vaguest is the one
  // deciding what the whole run is measured against, so this is the entrypoint
  // line most worth its median.
  // Then 2619 to 2680 for the Product row in the role boundary matrix and its
  // automatic-routing line. Review caught the omission: hard gate 1 had started
  // routing framing through a role the lead's own roster did not list, while
  // both new files say a phase whose owner is absent from the roster is a gap to
  // report rather than one to assign — so a Product phase was unownable by the
  // roster's own text. Every team task loads that reference, so the median pays
  // all 61 words.
  // Raised 2680 to 2695 by DECISION-RECORD-001. domain-coverage-contracts.md is
  // in every team task's load, so the median pays the clause in full. The lead
  // carries it because it runs the framing fallback when squad-product is
  // absent, and a record rule that lapses exactly when the roster is thinnest is
  // the case it exists for.
  // Raised 2695 to 2737 to name an owner for the one artifact nothing owned.
  // `grep -rinE "monorepo|workspace|scaffold" skills/` returned 0 across all
  // ten skills: on an empty repository every app and package had a role, and
  // the layout that decides which packages exist had none. It is the lead's
  // because "one owner per file" is the lead's own principle and the layout is
  // what makes it assignable — not a new judgment, a stated precondition of an
  // existing one. This is the whole surviving output of the abandoned
  // squad-architect plan: 42 words in place of an eleventh skill.
  // Raised 2737 to 2771 by the receiving half of HANDOFF-DECISION-001: 34 words
  // in hard gate 1, where the lead already learns what an accepted plan
  // contains, plus the subagent-mode paragraph in coordination-contract.md,
  // which every team task loads and which therefore pays in full. Both halves
  // are entrypoint-or-median cost with no cheaper routing available — the lead
  // has no task type that skips framing, and the mode paragraph is read before
  // any spawn.
  'squads-team': 2771,
};
