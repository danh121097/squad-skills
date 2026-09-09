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
  // ENTRYPOINT-IA-001 makes the public role files navigable through one section
  // order and adds the missing Usage blocks. Exact median deltas are: backend
  // 2260→2268, Code Review 2266→2277, Designer 2023→2064, DevOps 2248→2256,
  // Frontend 2601→2609, Mobile 2251→2260, QA 2382→2392 and Team 3109→3139.
  // Fix and Product already carried Usage and Stop conditions; their heading
  // normalization did not raise the measured median.
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
  'squad-backend': 2268,
  // Raised from 2157 when language-runtime-review-signatures.md landed. The
  // file is 621 words but the median moved 82, because it routes to one task
  // and the entrypoint grew by a router line and a checklist item. The task
  // that loads it sits at 2778, third-heaviest in the catalog, and that is the
  // point of the median regime: the run that needs the depth pays for it, and
  // the four that do not are unchanged.
  // Then 2239 to 2266 by HANDOFF-DECISION-001.
  // Raised 2277 to 2394 for the two-axis reporting rule: spec compliance and
  // production quality are ranked apart and never merged into one list, because
  // a merged list is how a diff that follows every convention while implementing
  // the wrong feature reads as a strong review. The 117 words sit in
  // review-runtime-and-verdict.md, which all six task types load, so the median
  // pays the whole file cost. There is no cheaper route: the rule governs what
  // every review reports, so a task type that skipped it would be a review
  // allowed to merge the axes.
  //
  // Part of that is the vocabulary decision, and it is the part worth
  // defending. The rule arrived from an external catalog naming its axes
  // Spec and Standards, and it shipped that way until review caught that
  // review-methodology-debugging-and-mindset.md already prescribes the same
  // split under its own names — Spec compliance and Production quality — and
  // that both files sit in the load of feature-diff-review and
  // spec-compliance-pass together. A run reading two vocabularies for one split
  // is the leading-word failure docs/authoring-doctrine.md warns about, landing
  // in the same change that states the warning. The existing names won: an
  // imported word has to beat the one already in the reader's context, and this
  // one did not. Renaming back across this tree returns seven words — three in
  // review-runtime-and-verdict.md and two in each of the two places the P1 raise
  // below added the pairing — which is the figure a reader can reproduce. The
  // draft that carried the imported names was never committed, so no delta
  // measured against it is checkable and none is recorded here.
  //
  // The maintainability baseline that landed in the same change is free at the
  // median and deliberately so. It gives the production-quality axis a named vocabulary
  // for a repository that documents no conventions, and it belongs to
  // cross-stack-review-dimensions.md, which only feature-diff-review and
  // unfamiliar-runtime-review open — the two heaviest tasks, both already above
  // the median. Neither HANDOFF-FINDINGS-001 nor any other clause moved: an axis
  // label is extra structure on a finding, not a change to what crosses the
  // boundary, so the clause statement is unchanged in all six files that carry
  // it — this skill's entrypoint and the five roles with an implementation
  // slice. The entrypoint is edited in this change, but by the P1 checklist
  // item below, not on the clause line.
  // Raised 2394 to 2425 by Code Review finding P1: the two-axis rule had no
  // completion criterion. Two files a reviewer actually reads say what a review
  // report must contain — quality-bar-and-preflight.md and the entrypoint
  // checklist — and neither mentioned the split, so
  // a reviewer composing its report from the pre-flight, which AGENTS.md
  // designates as the copy a role runs in one piece before it hands over, would
  // emit the single merged list the rule exists to prevent and pass every check
  // this catalog has. A rule with no completion criterion is the failure
  // docs/authoring-doctrine.md names, and it landed in the change that states
  // the warning. One pre-flight bullet and one checklist item: the pre-flight
  // reaches five of the six task types, standard-lookup being the exception, and
  // the entrypoint checklist is what makes the criterion universal.
  //
  // The 148 words between 2277 and 2425 decompose exactly: 117 into
  // review-runtime-and-verdict.md, which all six tasks load; 17 into
  // quality-bar-and-preflight.md, which both middle tasks load; and 14 into the
  // entrypoint, which every task pays.
  'squad-code-review': 2425,
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
  'squad-designer': 2064,
  // Raised 2209 to 2216 by DECISION-RECORD-001: the 15-word clause landing in
  // platform-iac-and-delivery-matrix.md's `Selection output`, which the median
  // delivery task loads. Measured, not budgeted — the four other bound files
  // took the same sentence and only squads-team moved with it.
  // Then 2216 to 2248 by HANDOFF-DECISION-001.
  'squad-devops': 2256,
  // Raised 2101 to 2624 as corrected accounting, not growth: total payload is
  // unchanged at 4299 words. The entrypoint reads
  // runtime-capability-fallbacks.md before choosing tools for any repair, so
  // every task loads it, but only one task declared it. The same omission was
  // corrected in squad-frontend and squad-mobile, whose entrypoints carry the
  // same unconditional line. squad-backend and squad-devops were left alone:
  // their routers name a condition ("a missing provider/test/review
  // capability"), so a single declaring task is the honest count there.
  // Then 2624 to 2651 by HANDOFF-DECISION-001.
  // Raised 2651 to 2694 by the feedback-loop upgrade, and 43 is the whole of it.
  // Every figure below re-derives from a state this comment names: the tree as
  // shipped, HEAD, or the one counterfactual, which is labelled as such.
  //
  // 665 words landed in diagnosis-root-cause-and-fix-loop.md (518 to 1183) —
  // build a red-capable loop before hypothesizing, the construction ladder, loop
  // tightening, reproduction rate for intermittent failures, minimization, three
  // to five ranked falsifiable hypotheses, tagged probes, and the shallow-seam
  // finding. That file costs the median nothing: only diagnose-and-route (3483)
  // and root-cause-to-fix (3908) open it, and both were already the two heaviest
  // tasks. This is the routing lever working as designed.
  //
  // The 43 comes from the other 86 words, added to
  // verification-qa-review-and-reporting.md (416 to 502) by Code Review finding
  // P2. The shallow-seam shortfall and the tagged-probe removal are
  // verification-phase rules that had landed only in the diagnosis file, which
  // regression-evidence does not load — and the entrypoint routes verification
  // work away from it, to this file. A run entering at regression-evidence
  // therefore shipped the shallow test with no shortfall finding, which is the
  // incentive the rule exists to remove, and left tagged probes in the tree.
  // Restating both rules there moves that task 2639 to 2725, and since it is one
  // of the two middle loads the median moves half of 86 with it.
  //
  // Routing the diagnosis file into regression-evidence instead of restating the
  // rules was the cheaper edit and the wrong one: that task would go to 3822 and
  // the median to 3073, buying the same two rules for 422 rather than 43 —
  // nearly ten times the price.
  'squad-fix': 2694,
  // Frontend, mobile and devops each rose about forty words in an earlier
  // change: HANDOFF-BUILD-001 is one sentence stated at three entrypoints, and
  // an entrypoint sentence is read by every task of that skill. Frontend then
  // moved 2134 to 2572 and mobile 1875 to 2226 for the runtime-fallback
  // accounting described above; both totals are unchanged.
  // Then 2572 to 2601 by HANDOFF-DECISION-001.
  'squad-frontend': 2609,
  // Then 2226 to 2251 by HANDOFF-DECISION-001.
  'squad-mobile': 2260,
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
  // Raised 2829 to 3138 for the requested written-plan bundle contract. Most of
  // the increase is routed only to `write-plan-document`: the directory/index
  // shape and the execution-ready phase schema. The short entrypoint/checklist
  // wording binds that output shape on every path that can write the bundle.
  // Raised 3138 to 3302 so a phase may declare one or several required Squad
  // roles with distinct responsibilities and handoffs, while the lead retains
  // live file ownership and agent-instance assignment.
  'squad-product': 3302,
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
  'squad-qa': 2392,
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
  // Raised 2771 to 2851 by HANDOFF-PLAN-BUNDLE-001 and
  // QUALITY-PREFLIGHT-PLAN-001. The lead pays the shape and phase schema at its
  // entrypoint because it produces the plan inline when Product is unavailable;
  // Product keeps the detailed explanation in its routed reference.
  // Raised 2851 to 2899 so the lead's inline planning fallback carries the same
  // one-or-many role assignment and responsibility-separation rule.
  // Raised 2899 to 2925 for the explicit context/result packet contract: task
  // and thread IDs are transport addresses, while the lead remains the source
  // of truth for handoffs and integration.
  // Raised 2925 to 2955 for revisioned async messages and dependency-frontier
  // dispatch. The extra detail stays in routed coordination references; the
  // entrypoint pays only the ready-frontier and invalidation checks every run
  // needs.
  // Raised 2955 to 3007 for explicit per-run top-level-thread authority. The
  // cost binds the independent-outcome boundary, duplicate check, context seed,
  // expiry and preserved mutation limits; without those, a flexible grant can
  // silently become unbounded task creation or broader authorization.
  // Raised 3007 to 3084 to make no-flag behavior explicit and rename the
  // misleading `--delegate` control to `--coordinate-only` while retaining it
  // as an alias. The entrypoint pays this because invocation defaults must be
  // known before routing or conditional references are selected.
  // Raised 3084 to 3109 to distinguish skill-level semantic controls from npm
  // CLI flags and to keep mandatory framing explicit when plan approval is off.
  // Raised 3139 to 3383 by Code Review finding P4, the largest single raise on
  // this entry and the one with the least room to argue. The phase-boundary
  // ladder governs the implementation-into-QA and QA-into-Review boundaries and
  // is the rule protecting gate independence, and advance-a-gate — the task type
  // named for advancing a gate — could not load it: coordination-contract.md
  // reached exactly one of five task types. Both pointers were also stale, still
  // naming only mode selection and spawning, which docs/authoring-doctrine.md
  // calls a variance bug and AGENTS.md forbids by requiring the router and the
  // task types to be edited together.
  //
  // The 244 decomposes into two parts and no third, each measured in isolation
  // against HEAD. Routing advance-a-gate to coordination-contract.md, with that
  // file still at its HEAD size, takes the task 2577 to 4325 and the median to
  // 3369: 230 of the 244, and there is no cheaper route, because a gate rule the
  // gate-advancing run cannot read is not a rule. The remaining 14 is the
  // entrypoint pointer rewrite, which every task pays. In the shipped tree that
  // task reads 4821, the extra 496 being the two new sections and the two
  // pointer rewrites.
  //
  // The squad-fix entry above faced this shape and chose the other way, so the
  // comparison belongs here too. Restating section 7's gate carve-out in
  // delivery-pipeline-and-roster.md, which all five tasks already load, would
  // have cost about 38 words — the carve-out as written — against 230. Routing
  // wins anyway, and not on the carve-out alone: advance-a-gate dispatches
  // independent QA and Review, and option 4 of the ladder sends that dispatch to
  // the packet contract, which is section 2 of the same file. A restatement that carried the carve-out would
  // leave the packet contract unreachable from the task that dispatches, which
  // is the defect this raise exists to close, one section further down.
  //
  // The two new sections cost the median nothing. They are 468 words — 374 in
  // the phase-boundary ladder, 94 in peer invocation — and with the header
  // pointer rewrite they take the file 1748 to 2230, but the median task after
  // this edit is ambiguous-routing-calibration, which does not open that file.
  // Only select-execution-mode and advance-a-gate pay for them.
  'squads-team': 3383,
};
