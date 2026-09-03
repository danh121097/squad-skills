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
const buildRoles = [backendSkill, devopsSkill, fixSkill, frontendSkill, mobileSkill];
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
 * The role boundary as it stands after the designer moved from spec-only to
 * presentational code. Every skill that names the boundary carries the same
 * sentence so a reader of any one of them learns the same contract.
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
    files: [...buildRoles, qaSkill],
  },
  {
    id: 'HANDOFF-VERDICT-001',
    statement:
      'a verdict of `PASS`, `FAIL` or `NEEDS_ENVIRONMENT` with the evidence behind it, coverage and residual risk, and whether the pass was independent',
    files: [codeReviewSkill, qaSkill],
  },
  {
    id: 'HANDOFF-FINDINGS-001',
    // squad-fix is the consuming side that acts on findings; the lead's copy of
    // the same rule lives in the team pipeline reference in its own words.
    statement:
      'severity-ranked findings carrying file:line, failure condition, impact and remediation, and a verdict of `APPROVE`, `CHANGES_REQUESTED` or `NEEDS_EVIDENCE`',
    files: [codeReviewSkill, fixSkill],
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
    statement:
      'QA and Code Review stay mandatory: with neither skill installed this role runs both as separate logical passes and labels them non-independent',
    files: [...buildRoles, teamSkill],
  },
  {
    id: 'HANDOFF-SOLO-001',
    // The squad-peer analog of PAIRING-SAFETY-001, which covers an absent
    // `ak:*` skill rather than an absent role. "where this role's boundary
    // allows" is load-bearing: QA may not carry an implementer's stage, and no
    // role may absorb one the boundary clauses put somewhere else.
    statement:
      "When a named squad peer is absent, carry its stage inline at the same standard where this role's boundary allows, and otherwise report the gap; never report a stage as run when the peer did not run",
    files: [...buildRoles, codeReviewSkill, qaSkill, teamSkill],
  },
  {
    id: 'QUALITY-PREFLIGHT-001',
    // Carried in from the quality-bar phase, which gave seven roles this line
    // word for word and left the sameness enforced by nothing.
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
