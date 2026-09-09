import type { BoundaryClause, RetiredPhrase } from './cross-skill-contract-validator.ts';

const designerSkill = 'skills/squad-designer/SKILL.md';
const designerMotion = 'skills/squad-designer/references/platform-web-foundations-and-motion.md';
const designerHandoff =
  'skills/squad-designer/references/design-system-ux-accessibility-and-handoff.md';
const designerExamples = 'skills/squad-designer/references/codebase-first-examples.md';
const designerQuality = 'skills/squad-designer/references/anti-slop-quality-review.md';
const designerResearch = 'skills/squad-designer/references/task-specific-ui-ux-research.md';
const designerSources = 'skills/squad-designer/references/official-sources.md';
const designerNativeCross = 'skills/squad-designer/references/platform-native-cross-platform.md';
const designerNativeAppleAndroid =
  'skills/squad-designer/references/platform-native-apple-android.md';
const designerAdaptive = 'skills/squad-designer/references/platform-adaptive-layout-and-input.md';
// The DECISION-RECORD-001 files below are the four selection references plus the
// lead's framing fallback: the places a choice is made that another role then
// builds on. They are references, not entrypoints, so the clause costs a median
// only where the reference sits inside a skill's median loaded set.
const backendMatrix = 'skills/squad-backend/references/backend-stack-and-runtime-matrix.md';
const devopsMatrix = 'skills/squad-devops/references/platform-iac-and-delivery-matrix.md';
const mobileStack = 'skills/squad-mobile/references/mobile-stack-architecture-and-data.md';
const frontendIntake = 'skills/squad-frontend/references/designer-gate-and-design-intake.md';
const frontendMotion = 'skills/squad-frontend/references/frontend-stack-and-motion-selection.md';
const mobileGates = 'skills/squad-mobile/references/design-platform-and-lifecycle-gates.md';
const teamPipeline = 'skills/squads-team/references/delivery-pipeline-and-roster.md';
const teamCoordination = 'skills/squads-team/references/coordination-contract.md';
// Each role states the specialist skill pairing contract in the reference its
// own router points at for tool selection, so the file names differ by role.
const backendRuntime = 'skills/squad-backend/references/runtime-capability-fallbacks.md';
const codeReviewRuntime = 'skills/squad-code-review/references/review-runtime-and-verdict.md';
const devopsRuntime = 'skills/squad-devops/references/runtime-and-safe-delivery-fallbacks.md';
const fixRuntime = 'skills/squad-fix/references/runtime-capability-fallbacks.md';
const frontendRuntime = 'skills/squad-frontend/references/runtime-capability-fallbacks.md';
const mobileRuntime = 'skills/squad-mobile/references/runtime-capability-fallbacks.md';
const qaRuntime = 'skills/squad-qa/references/test-strategy-runtime-and-verdict.md';
const roleRuntimes = [
  backendRuntime,
  codeReviewRuntime,
  devopsRuntime,
  fixRuntime,
  frontendRuntime,
  mobileRuntime,
  qaRuntime,
];
// Role entrypoints. The handoff clauses below bind the two ends of a stage
// boundary, so they name SKILL.md rather than a reference: what a role hands
// over is part of the contract a reader learns from the entrypoint alone.
const backendSkill = 'skills/squad-backend/SKILL.md';
const codeReviewSkill = 'skills/squad-code-review/SKILL.md';
const devopsSkill = 'skills/squad-devops/SKILL.md';
const fixSkill = 'skills/squad-fix/SKILL.md';
const frontendSkill = 'skills/squad-frontend/SKILL.md';
const mobileSkill = 'skills/squad-mobile/SKILL.md';
const productSkill = 'skills/squad-product/SKILL.md';
const productPlanDocument = 'skills/squad-product/references/plan-document-contract.md';
const productQuality = 'skills/squad-product/references/quality-bar-and-preflight.md';
const qaSkill = 'skills/squad-qa/SKILL.md';
const teamSkill = 'skills/squads-team/SKILL.md';
// squad-designer is deliberately absent from every handoff clause below but one.
// Its side of the design handoff is already bound by BOUNDARY-ARTIFACT-001 and
// BOUNDARY-LOGIC-001, stated on the build roles that consume it, so repeating it
// here would give the same boundary two owners that can disagree. The exception
// is HANDOFF-DECISION-001, which binds who may answer a user's question rather
// than who owns an artifact, so the reasoning above does not reach it.
// Not `buildRoles`: "the build role" is already a term of art in this contract
// layer, meaning squad-frontend on web and squad-mobile on native — the phrase
// BOUNDARY-LOGIC-001 is bound on. These five are simply the roles that produce
// an implementation slice and therefore depend on the QA and Review gates.
const rolesWithAnImplementationSlice = [
  backendSkill,
  devopsSkill,
  fixSkill,
  frontendSkill,
  mobileSkill,
];
// Ten of ten. HANDOFF-DECISION-001 is the only clause that reaches every
// entrypoint, because it binds a runtime property every role runs under rather
// than a stage only some of them touch.
const everyRoleEntrypoint = [
  backendSkill,
  codeReviewSkill,
  designerSkill,
  devopsSkill,
  fixSkill,
  frontendSkill,
  mobileSkill,
  productSkill,
  qaSkill,
  teamSkill,
];
const everyRoleWithAPreflight = [
  backendSkill,
  codeReviewSkill,
  devopsSkill,
  fixSkill,
  frontendSkill,
  mobileSkill,
  productSkill,
  qaSkill,
];

// Handed to the lead when a named squad-* skill is absent, so it states the
// boundary for exactly the case where `squad-designer` never runs.
const teamContracts = 'skills/squads-team/references/domain-coverage-contracts.md';

/**
 * Every sentence the catalog binds, in four families.
 *
 * `BOUNDARY-*` says who owns what between the designer and the build roles, as
 * it stands after the designer moved from spec-only to presentational code.
 * `PAIRING-*` binds how a role detects an installed specialist skill, which side
 * is authoritative when both are present, and that it may never report an absent
 * skill as run.
 * `HANDOFF-*` covers a stage boundary in the squad pipeline, and binds only
 * entrypoints, because both ends of a boundary must be readable without loading
 * a reference. `PLAN-BUNDLE-*` binds the shape of a written plan bundle, and is
 * a separate family for that reason: the bundle's schema lives in a reference
 * and a run reaches it by routing there. And `QUALITY-PREFLIGHT-*` binds the
 * pre-flight line the roles share.
 *
 * Every skill that states one of these carries the same wording, so a reader of
 * any one of them learns the same contract.
 */
export const boundaryClauses: BoundaryClause[] = [
  {
    id: 'BOUNDARY-ARTIFACT-001',
    statement: 'the designer hands over presentational component code, not a written spec',
    files: [designerSkill, frontendIntake, mobileGates, teamContracts, teamPipeline],
  },
  {
    id: 'BOUNDARY-LOGIC-001',
    statement:
      'state, data fetching, API integration, routing, forms submission, and platform lifecycle stay with the build role',
    files: [designerSkill, frontendIntake, mobileGates, teamContracts, teamPipeline],
  },
  {
    id: 'BOUNDARY-MOTION-001',
    statement:
      'whoever writes the animation code owns its lifecycle scoping, teardown, and reduced-motion fallback',
    // The adaptive reference is not bound: it carries no animation guidance of
    // its own and always composes with a platform reference that does.
    files: [
      designerMotion,
      designerNativeCross,
      designerNativeAppleAndroid,
      frontendMotion,
      mobileGates,
    ],
  },
  {
    id: 'DECISION-RECORD-001',
    // Deliberately carries only the half no file had. Backend and devops already
    // record the rejected options and the deciding constraint in their own
    // domain vocabulary; binding those words too would state one obligation
    // twice in the same section and flatten wording that is correctly
    // layer-specific. What no role recorded is the condition that ends the
    // choice, so that is what must not drift.
    statement:
      'a decision another role implements records what would reopen it, not only what was chosen',
    files: [backendMatrix, devopsMatrix, frontendMotion, mobileStack, teamContracts],
  },
  {
    id: 'PAIRING-DETECT-001',
    // The team contract detects once per run rather than per task, so the
    // clause binds the mechanism both share, not the cadence they do not.
    statement: 'by inspecting the live skill catalog for',
    files: [...roleRuntimes, designerSources, teamCoordination],
  },
  {
    id: 'PAIRING-AUTHORITY-001',
    // Deliberately starts after the subject: roles say "this role's boundary,
    // gates, and evidence rules", the designer says "this skill's boundary,
    // source lanes, and quality bar". What must not drift is which side wins.
    statement: 'stay authoritative wherever the two disagree',
    files: [...roleRuntimes, designerSources],
  },
  {
    id: 'PAIRING-SAFETY-001',
    // The designer is not bound: its entrypoint carries the never-auto-install
    // rule in "Scope and boundary", and its registry states the same ban in the
    // registry's own words rather than repeating this sentence.
    statement: 'never report a skill as run when it does not exist',
    files: roleRuntimes,
  },
  {
    id: 'HANDOFF-PLAN-001',
    // The first edge in the pipeline, and the last one to be stated at both
    // ends. `squads-team` accepts `[goal | plan-path]` and hard gate 1 says to
    // reuse an accepted plan, but nothing said what an accepted plan contains —
    // so the lead had no wording to refuse a plan with no non-goals and no
    // checkable criteria, which is the shape a vague request naturally produces.
    //
    // Bound on the producing side's sentence, the way HANDOFF-QA-001 was:
    // squad-product states it as what it hands over, squads-team as what it
    // takes in. "a run can actually check" is the load-bearing half — a plan
    // whose criteria nothing can fail reads exactly like one whose criteria can.
    statement:
      "the outcome in the user's own terms, the constraints and explicit non-goals, acceptance criteria a run can actually check, and the phases with the required Squad role or roles and each role's responsibility",
    files: [productSkill, teamSkill],
  },
  {
    id: 'HANDOFF-PLAN-BUNDLE-001',
    // Product owns written-plan production and the lead owns the inline fallback
    // when Product is unavailable. Binding both sides prevents one path from
    // collapsing the requested bundle back into a monolithic plan file.
    //
    // Restated 2026-09-09 from a flat directory to the four-directory layout.
    // The flat shape said where phase files go and nothing about anything else,
    // so a plan that produced artifacts, decisions and shared background put
    // them beside the phases — where a reader cannot tell ordered work from
    // background, and where a handoff named with the phase prefix reads as an
    // extra phase. What the clause binds now is the root: `plan.md` alone, and
    // the four named directories. Everything the layout rules out follows from
    // that sentence being stated the same way on both sides.
    statement:
      'a written plan is one directory whose root holds only plan.md and the standard phases, artifacts, adr and references directories, with every phase file in phases/ named phase-XX-kebab-case-title.md and every link relative',
    files: [productSkill, teamSkill],
  },
  {
    id: 'PLAN-BUNDLE-ARTIFACT-001',
    // The half of the layout a reader gets wrong first. Ordering by filename is
    // the habit the flat bundle taught, and it survives the directory split
    // unless something says where ownership is written instead: an artifact
    // named `phase-02-handoff.md` still sorts and reads as a phase, in a
    // directory whose whole job is to hold things that are not phases.
    //
    // Bound on the two files that describe an artifact being produced: the
    // Product plan contract, which says what the bundle holds, and the lead's
    // coordination contract, which is what a run reads while filling it.
    statement:
      'an artifact records its owning phase, owner, revision and status in frontmatter, never in a phase-XX- filename prefix, which phases/ alone reserves',
    files: [productPlanDocument, teamCoordination],
  },
  {
    id: 'PLAN-BUNDLE-SUPERSEDE-001',
    // A bundle outlives the framing that produced it, and this is the only rule
    // that keeps it from outliving its own truth. A verdict names the revisions
    // it graded; move one and the record is about a document the bundle no
    // longer holds, which reads exactly like a record about the current one.
    // Editing the verdict in place is worse than leaving it: it produces an
    // approval that was never earned against anything.
    //
    // Three files, because three readers need it. The plan contract is read
    // while writing the bundle, the pipeline while advancing a gate, and the
    // coordination contract while recording one.
    statement:
      'a change to structure or contract after a gate marks the recorded verdict superseded and requires QA then Code Review again',
    files: [productPlanDocument, teamCoordination, teamPipeline],
  },
  {
    id: 'QUALITY-PREFLIGHT-PLAN-001',
    // The detailed Product schema is progressively disclosed, while the lead
    // must carry the same schema inline when Product is unavailable.
    statement:
      'each phase file states context and current state; objective and concrete deliverables; required role or roles and their distinct scope boundaries; prerequisites and blocking decisions; ordered work steps; phase-specific acceptance criteria and expected verification evidence; applicable risks and recovery; and the handoff condition',
    files: [productPlanDocument, teamSkill],
  },
  {
    id: 'HANDOFF-DECISION-001',
    // The return edge HANDOFF-PLAN-001 never described. That clause says what an
    // accepted plan contains; this one says what happens to the choices the plan
    // could not make, and it exists because the runtime silently removes the
    // obvious answer. A role spawned as a child agent has no channel to the
    // user: a question it writes into its report is read by the lead and by
    // nobody else. Observed in this repository — four material forks (smoke-test
    // credentials, version number, two breaking changes) reached the user as
    // four bullets in a report, after the role that raised them had already
    // planned past them.
    //
    // Bound on the producing side like HANDOFF-PLAN-001, and "named options with
    // their consequences" is the load-bearing half rather than decoration: prose
    // is what a controller cannot put to a user without composing the choice
    // itself, which is the authorship this clause moves back to the user.
    //
    // Every role entrypoint, which is unusual for a HANDOFF clause and is the
    // point: the missing channel is a property of how a role is executed, not
    // of which stage it sits at. QA hitting an absent credential and Designer
    // hitting an undecided brand direction are the same failure as the framing
    // case that produced this clause, and a contract that bound only the two
    // ends of the plan edge would have left the other eight roles free to keep
    // assuming. squad-designer is otherwise absent from the handoff family — its
    // boundary is bound on the build roles by BOUNDARY-ARTIFACT-001 — and is
    // named here anyway, because this clause binds who may answer a question
    // rather than who owns an artifact.
    statement:
      'each open fork as named options with their consequences, put to the user from the session that can ask and never answered by the role that raised it',
    files: everyRoleEntrypoint,
  },
  {
    id: 'HANDOFF-API-001',
    // Written from the consumer's side: Frontend and Mobile cannot start until
    // they know the error shape and the auth rules, so those are the contract,
    // not the endpoint list the producer finds convenient to publish.
    statement:
      'the schema, error shape, auth rules, pagination and idempotency behavior the consumer codes against, not a description of the endpoint',
    files: [backendSkill, frontendSkill, mobileSkill],
  },
  {
    id: 'HANDOFF-QA-001',
    // Every producing role states this and QA states the same sentence as what
    // it receives, so a role cannot hand over less than QA is told to expect.
    statement:
      'the diff under test, the acceptance criteria it claims to meet, the commands and environment that exercise it, and the checks already run',
    files: [...rolesWithAnImplementationSlice, qaSkill],
  },
  {
    id: 'HANDOFF-VERDICT-001',
    // The verdict names keep their underscores against the matcher's general
    // advice, because both the clause and the skills that state it flatten the
    // same way — `NEEDS_ENVIRONMENT` and NEEDS_ENVIRONMENT both reduce to one
    // token. What the advice guards against is an underscore that is markdown
    // emphasis on one side only; a verdict name is neither side's emphasis.
    statement:
      'a verdict of `PASS`, `FAIL` or `NEEDS_ENVIRONMENT` with the evidence behind it, coverage and residual risk, and whether the pass was independent',
    files: [codeReviewSkill, qaSkill],
  },
  {
    id: 'HANDOFF-FINDINGS-001',
    // Every role that produces a slice is a consuming side here, not only
    // squad-fix: `CHANGES_REQUESTED` returns to whoever owns the diff. The lead's
    // copy of the same rule lives in the team pipeline reference in its own words.
    statement:
      'severity-ranked findings carrying file:line, failure condition, impact and remediation, and a verdict of `APPROVE`, `CHANGES_REQUESTED` or `NEEDS_EVIDENCE`',
    files: [codeReviewSkill, ...rolesWithAnImplementationSlice],
  },
  {
    id: 'HANDOFF-REPRO-001',
    // The forward edges were stated at both ends and bound; the return edges were
    // stated only by the gate that issues them. A role that has never been told
    // what a `FAIL` contains has nothing in its own contract to refuse a bare
    // "it does not work" with, and the FAIL loop is where a squad spends its
    // iterations. Bound from the shared fragment: QA addresses it to the owning
    // role, the owning role states it as what a FAIL brings back.
    statement: 'the minimal repro, expected versus actual, and the redacted artifacts',
    files: [qaSkill, ...rolesWithAnImplementationSlice],
  },
  {
    id: 'HANDOFF-RUNTIME-001',
    // squad-backend published its data changes to nobody in particular while
    // squad-devops — the role that has to order a migration against a deploy —
    // named nothing it receives. A deploy that runs a migration in the wrong
    // order against a live database is the failure this edge exists to prevent,
    // and it was the one stage boundary in the pipeline stated at neither end.
    statement:
      'what the change needs to run: the runtime version and service configuration by reference rather than by value, the migration ordering against the deploy, and the health signal that proves the service started',
    files: [backendSkill, devopsSkill],
  },
  {
    id: 'HANDOFF-BUILD-001',
    // HANDOFF-RUNTIME-001 bound backend to devops and left the other two
    // producers unbound, so a bundle could cross the same boundary with nothing
    // said about it. The build-time-versus-runtime split is the specific failure:
    // a value baked into a client artifact cannot be changed without a rebuild
    // and, if it is a secret, was published to every viewer the moment it shipped.
    statement:
      'the build command and the artifact it produces, which configuration values are baked into that artifact at build time and which are read at runtime, and what the artifact assumes about routing, signing or release channel',
    files: [devopsSkill, frontendSkill, mobileSkill],
  },
  {
    id: 'HANDOFF-DEPLOY-001',
    // Code Review gates operational readiness, so it is the consumer that has
    // to be told which level of verification actually ran.
    statement:
      'the exact target acted on, which verification level ran — static, plan or deployed — and the rollback trigger and recovery path',
    files: [codeReviewSkill, devopsSkill],
  },
  {
    id: 'HANDOFF-GATE-001',
    // squads-team declares QA and Code Review non-optional. A role running
    // without those skills installed has to name who carries them, or the
    // mandatory gate disappears with nothing reporting that it did.
    //
    // squad-qa and squad-code-review are not bound here, because "with neither
    // skill installed" cannot be said by a role that is one of the two. They
    // owe the same answer in their own terms, which is HANDOFF-GATE-002.
    statement:
      'QA and Code Review stay mandatory: with neither skill installed this role runs both as separate logical passes and labels them non-independent',
    files: [...rolesWithAnImplementationSlice, teamSkill],
  },
  {
    id: 'HANDOFF-GATE-002',
    // HANDOFF-GATE-001 for the two roles that are themselves the gates. Install
    // squad-qa alone and Code Review is still mandatory with nobody named to
    // carry it; the same holds in reverse. "where its boundary allows" keeps QA
    // out of marking work done, and "reports the gate as unowned" is the honest
    // answer when the pass cannot be carried at all.
    statement:
      "QA and Code Review are both mandatory: when the peer gate's skill is absent, this role runs that pass itself where its boundary allows and labels it non-independent, or reports the gate as unowned",
    files: [codeReviewSkill, qaSkill],
  },
  {
    id: 'HANDOFF-GATE-003',
    // GATE-001 and GATE-002 bind who owns a gate when a peer is missing. Neither
    // binds what closes a stage, so `squads-team` hard gate 4 and the
    // `squad-fix` gate that restates it were free to disagree on the verdict
    // names, the order, or who issues the pass — a review-before-QA rewrite, or
    // an implementer self-certifying its own `PASS`, both left the gate green.
    //
    // The statement therefore carries four things and each is load-bearing:
    // `must receive` (the slice does not issue its own verdict), `QA` (the
    // producer, which a subjectless fragment left open), the order, and the two
    // verdict names. An earlier draft bound only "`PASS`, then Code Review
    // `APPROVE`"; a probe rewriting `squad-fix` to "the owning role must return
    // `PASS`" passed it, which is the independence GATE-001 and GATE-002 exist
    // to protect.
    //
    // `squad-fix` was reworded to match `squads-team` rather than the reverse:
    // the lead owns the pipeline rule, and `squad-fix` restates it. Neither file
    // carries task types whose loaded set this wording changes, so no payload
    // figure moves with it.
    //
    // Only these two entrypoints state the sequence. The five implementing roles
    // carry HANDOFF-GATE-001 instead, which binds that both gates are mandatory
    // rather than which verdict closes each one.
    statement: 'must receive QA `PASS`, then Code Review `APPROVE`',
    files: [fixSkill, teamSkill],
  },
  {
    id: 'HANDOFF-SOLO-001',
    // The squad-peer analog of PAIRING-SAFETY-001, which covers an absent
    // specialist skill rather than an absent role. "where this role's boundary
    // allows" is load-bearing: QA may not carry an implementer's stage, and no
    // role may absorb one the boundary clauses put somewhere else.
    //
    // The closing test is about the pass, not the peer. An earlier wording ran
    // "when the peer did not run", which contradicted the branch above it: a
    // lead that carries QA inline has to report that QA ran, disclosing the
    // reduced independence, and the peer skill never ran in that case either.
    statement:
      "When a named squad peer is absent, carry its stage inline at the same standard where this role's boundary allows, and otherwise report the gap; never report a stage as run when no pass actually ran it",
    files: [...rolesWithAnImplementationSlice, codeReviewSkill, qaSkill, teamSkill],
  },
  {
    id: 'QUALITY-PREFLIGHT-001',
    // Seven roles were given this line word for word, with the sameness
    // enforced by nothing until it was bound here. squad-product joined as the
    // eighth, which is the clause paying for itself: the wording was copied from
    // the bound sentence rather than reinvented, because the gate would have
    // caught a paraphrase.
    statement: 'The quality-bar pre-flight ran; failed checks were fixed or reported',
    files: everyRoleWithAPreflight,
  },
];

/**
 * Spec-era wording that contradicts the clauses above. Retired phrases sweep
 * the whole designer surface, not only the files a clause binds: a reference
 * that no clause names can still tell the designer to hand over a document, and
 * that contradiction ships even though every bound file agrees.
 */
export const retiredPhrases: RetiredPhrase[] = [
  {
    id: 'RETIRED-SPEC-001',
    phrase: 'not production code',
    files: [
      designerSkill,
      designerAdaptive,
      designerExamples,
      designerHandoff,
      designerMotion,
      designerNativeAppleAndroid,
      designerNativeCross,
      designerQuality,
      designerResearch,
      designerSources,
      teamContracts,
      teamPipeline,
    ],
  },
  {
    id: 'RETIRED-SPEC-005',
    phrase: 'never production code',
    files: [
      designerSkill,
      designerAdaptive,
      designerExamples,
      designerHandoff,
      designerMotion,
      designerNativeAppleAndroid,
      designerNativeCross,
      designerQuality,
      designerResearch,
      designerSources,
      teamContracts,
      teamPipeline,
    ],
  },
  {
    id: 'RETIRED-SPEC-002',
    phrase: 'implementation-ready design specs',
    files: [designerSkill, designerHandoff, teamPipeline],
  },
  {
    // Deliberately excludes SKILL.md: the entrypoint carries this wording
    // legitimately inside BOUNDARY-ARTIFACT-001 ("not a written spec").
    id: 'RETIRED-SPEC-003',
    phrase: 'written spec',
    files: [
      designerAdaptive,
      designerExamples,
      designerHandoff,
      designerMotion,
      designerNativeAppleAndroid,
      designerNativeCross,
      designerQuality,
      designerResearch,
      designerSources,
    ],
  },
  {
    // The flat plan bundle HANDOFF-PLAN-BUNDLE-001 replaced. A file still
    // telling a role to put phase files beside the index describes a layout the
    // validator now rejects, and it would be read as the current contract by
    // whichever run opened that file first.
    id: 'RETIRED-SPEC-006',
    phrase: 'phase files live beside the index',
    files: [productSkill, productPlanDocument, productQuality, teamSkill, teamCoordination],
  },
  {
    id: 'RETIRED-SPEC-004',
    phrase: 'markdown handoff',
    files: [
      designerSkill,
      designerAdaptive,
      designerExamples,
      designerHandoff,
      designerMotion,
      designerNativeAppleAndroid,
      designerNativeCross,
      designerQuality,
      designerResearch,
      designerSources,
    ],
  },
];
