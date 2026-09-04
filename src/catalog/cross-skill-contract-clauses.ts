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
const frontendIntake = 'skills/squad-frontend/references/designer-gate-and-design-intake.md';
const frontendMotion = 'skills/squad-frontend/references/frontend-stack-and-motion-selection.md';
const mobileGates = 'skills/squad-mobile/references/design-platform-and-lifecycle-gates.md';
const teamPipeline = 'skills/squads-team/references/delivery-pipeline-and-roster.md';
const teamCoordination = 'skills/squads-team/references/coordination-contract.md';
// Each role states the AgentKit pairing contract in the reference its own
// router points at for tool selection, so the file names differ by role.
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
const qaSkill = 'skills/squad-qa/SKILL.md';
const teamSkill = 'skills/squads-team/SKILL.md';
// squad-designer is deliberately absent from every clause below. Its SKILL.md is
// eval-covered — `evals/squad-designer/case-manifest.yml` exists — so editing it
// runs the evaluation cycle and human promotion approval, which no clause here
// can substitute for. Its side of the design handoff is already bound by
// BOUNDARY-ARTIFACT-001 and BOUNDARY-LOGIC-001, stated on the build roles that
// consume it.
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
const everyRoleWithAPreflight = [
  backendSkill,
  codeReviewSkill,
  devopsSkill,
  fixSkill,
  frontendSkill,
  mobileSkill,
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
 * `PAIRING-*` binds how a role detects an `ak:*` skill, which side is
 * authoritative when both are present, and that it may never report an absent
 * skill as run.
 * `HANDOFF-*` covers a stage boundary in the squad pipeline. And
 * `QUALITY-PREFLIGHT-*` binds the pre-flight line the roles share.
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
    // is recorded in `evals/squad-designer/baseline-manifest.yml`, so no payload
    // figure moves with this wording.
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
    // `ak:*` skill rather than an absent role. "where this role's boundary
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
    // enforced by nothing until it was bound here.
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
